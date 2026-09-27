import { createClient, type SupabaseClient, type User } from "npm:@supabase/supabase-js@2";

export const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
export const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
export const SUPABASE_SERVICE_ROLE_KEY =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
export const INTERACTION_SECRET =
    Deno.env.get("MFDCO_INTERACTION_SECRET") ?? "";

const configuredOrigins = (Deno.env.get("MFDCO_ALLOWED_ORIGINS") ??
    "https://mfdco.net,https://www.mfdco.net")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);

export const serviceClient = createClient(
    SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    },
);

export function corsHeaders(req: Request): Record<string, string> {
    const origin = req.headers.get("origin") ?? "";
    const allowedOrigin = configuredOrigins.includes(origin)
        ? origin
        : configuredOrigins[0] ?? "https://mfdco.net";

    return {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Headers":
            "authorization, x-client-info, apikey, content-type",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Max-Age": "86400",
        "Vary": "Origin",
    };
}

export function jsonResponse(
    req: Request,
    body: unknown,
    status = 200,
): Response {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders(req),
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": "no-store",
        },
    });
}

export function ensureConfigured(): void {
    if (
        !SUPABASE_URL ||
        !SUPABASE_ANON_KEY ||
        !SUPABASE_SERVICE_ROLE_KEY ||
        !INTERACTION_SECRET
    ) {
        throw new Error("Edge Function secrets are not configured.");
    }
}

export function ensureAllowedOrigin(req: Request): void {
    const origin = req.headers.get("origin");

    // curl等のサーバー側テストはOriginなしを許可する。
    if (origin && !configuredOrigins.includes(origin)) {
        throw new HttpError(403, "許可されていない送信元です。");
    }
}

export class HttpError extends Error {
    status: number;

    constructor(status: number, message: string) {
        super(message);
        this.name = "HttpError";
        this.status = status;
    }
}

export function requireUuid(value: unknown, label: string): string {
    const text = String(value ?? "").trim();
    const uuidPattern =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    if (!uuidPattern.test(text)) {
        throw new HttpError(400, `${label}が不正です。`);
    }

    return text;
}

export async function getOptionalUser(req: Request): Promise<User | null> {
    const authorization = req.headers.get("authorization") ?? "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();

    if (!token || token === SUPABASE_ANON_KEY) {
        return null;
    }

    const authClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
        },
    });

    const { data, error } = await authClient.auth.getUser(token);

    if (error || !data.user) {
        return null;
    }

    return data.user;
}

export async function sha256Hmac(value: string): Promise<string> {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        "raw",
        encoder.encode(INTERACTION_SECRET),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );
    const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));

    return Array.from(new Uint8Array(signature))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
}

export async function resolveIdentity(
    req: Request,
    visitorId: unknown,
): Promise<{ user: User | null; userId: string | null; visitorHash: string | null }> {
    const user = await getOptionalUser(req);

    if (user) {
        return { user, userId: user.id, visitorHash: null };
    }

    const visitor = requireUuid(visitorId, "匿名識別子");
    const visitorHash = await sha256Hmac(`visitor:${visitor}`);

    return { user: null, userId: null, visitorHash };
}

export async function enforceRateLimit(
    db: SupabaseClient,
    identity: { userId: string | null; visitorHash: string | null },
    action: "like" | "report_work" | "report_comment" | "download",
    targetId: string | null,
    limit: number,
    windowSeconds: number,
): Promise<void> {
    const since = new Date(Date.now() - windowSeconds * 1000).toISOString();
    let query = db
        .from("mfdco_interaction_events")
        .select("id", { count: "exact", head: true })
        .eq("action", action)
        .gte("created_at", since);

    if (identity.userId) {
        query = query.eq("user_id", identity.userId);
    } else {
        query = query.eq("visitor_hash", identity.visitorHash);
    }

    const { count, error } = await query;

    if (error) throw error;
    if ((count ?? 0) >= limit) {
        throw new HttpError(429, "操作回数が多すぎます。しばらく待ってから再試行してください。");
    }

    const { error: insertError } = await db
        .from("mfdco_interaction_events")
        .insert({
            action,
            target_id: targetId,
            user_id: identity.userId,
            visitor_hash: identity.visitorHash,
        });

    if (insertError) throw insertError;
}

export function handleError(req: Request, error: unknown): Response {
    console.error("MFDCO EDGE ERROR:", error);

    if (error instanceof HttpError) {
        return jsonResponse(req, { ok: false, error: error.message }, error.status);
    }

    const message = error instanceof Error
        ? error.message
        : "予期しないエラーが発生しました。";

    return jsonResponse(req, { ok: false, error: message }, 500);
}

export function escapeHtml(value: unknown): string {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

