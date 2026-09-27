import {
    corsHeaders,
    ensureAllowedOrigin,
    ensureConfigured,
    enforceRateLimit,
    handleError,
    HttpError,
    jsonResponse,
    requireUuid,
    resolveIdentity,
    serviceClient,
    sha256Hmac,
} from "../_shared/common.ts";

async function hasMemberAccess(userId: string): Promise<boolean> {
    const { data, error } = await serviceClient
        .from("profiles")
        .select("membership_status")
        .eq("id", userId)
        .maybeSingle();

    if (error) throw error;

    return ["member", "approved", "active"].includes(
        String(data?.membership_status ?? ""),
    );
}

async function hasIndividualGrant(workId: string, userId: string): Promise<boolean> {
    const { data, error } = await serviceClient
        .from("work_download_grants")
        .select("id,expires_at,revoked_at")
        .eq("work_id", workId)
        .eq("user_id", userId)
        .maybeSingle();

    if (error) throw error;
    if (!data || data.revoked_at) return false;
    if (data.expires_at && new Date(data.expires_at).getTime() <= Date.now()) return false;

    return true;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders(req) });
    }

    if (req.method !== "POST") {
        return jsonResponse(req, { ok: false, error: "POSTのみ使用できます。" }, 405);
    }

    try {
        ensureConfigured();
        ensureAllowedOrigin(req);

        const body = await req.json();
        const workId = requireUuid(body.work_id, "作品ID");
        const identity = await resolveIdentity(req, body.visitor_id);

        const { data: work, error: workError } = await serviceClient
            .from("works")
            .select(`
                id,user_id,status,submission_type,file_path,external_url,
                download_access,original_filename
            `)
            .eq("id", workId)
            .maybeSingle();

        if (workError) throw workError;
        if (!work || work.status !== "approved") {
            throw new HttpError(404, "ダウンロードできる作品が見つかりません。");
        }

        const isOwner = Boolean(identity.userId && identity.userId === work.user_id);
        let allowed = false;

        if (isOwner || work.download_access === "public") {
            allowed = true;
        } else if (work.download_access === "user") {
            allowed = Boolean(identity.userId);
        } else if (identity.userId && work.download_access === "member") {
            allowed =
                await hasMemberAccess(identity.userId) ||
                await hasIndividualGrant(workId, identity.userId);
        } else if (identity.userId && work.download_access === "private") {
            allowed = await hasIndividualGrant(workId, identity.userId);
        }

        if (!allowed) {
            throw new HttpError(
                identity.userId ? 403 : 401,
                identity.userId
                    ? "この作品をダウンロードする権限がありません。"
                    : "この作品のダウンロードにはログインが必要です。",
            );
        }

        await enforceRateLimit(
            serviceClient,
            identity,
            "download",
            workId,
            30,
            600,
        );

        const tenMinuteWindow = Math.floor(Date.now() / 600000);
        const identityKey = identity.userId ?? identity.visitorHash ?? "unknown";
        const eventKey = await sha256Hmac(
            `download:${workId}:${identityKey}:${tenMinuteWindow}`,
        );

        const { error: eventError } = await serviceClient
            .from("work_download_events")
            .insert({
                event_key: eventKey,
                work_id: workId,
                user_id: identity.userId,
                visitor_hash: identity.visitorHash,
            });

        if (eventError && eventError.code !== "23505") throw eventError;

        if (work.submission_type === "url") {
            if (!work.external_url) throw new HttpError(404, "作品URLが登録されていません。");

            return jsonResponse(req, {
                ok: true,
                type: "external",
                url: work.external_url,
                filename: null,
            });
        }

        if (!work.file_path) {
            throw new HttpError(404, "作品ファイルが登録されていません。");
        }

        if (work.download_access === "public") {
            const { data } = serviceClient.storage
                .from("work-files-public")
                .getPublicUrl(work.file_path);

            return jsonResponse(req, {
                ok: true,
                type: "file",
                url: data.publicUrl,
                filename: work.original_filename,
            });
        }

        const { data: signed, error: signedError } = await serviceClient.storage
            .from("work-files")
            .createSignedUrl(work.file_path, 60, {
                download: work.original_filename ?? true,
            });

        if (signedError || !signed?.signedUrl) {
            throw signedError ?? new Error("署名付きURLを作成できませんでした。");
        }

        return jsonResponse(req, {
            ok: true,
            type: "file",
            url: signed.signedUrl,
            filename: work.original_filename,
        });
    } catch (error) {
        return handleError(req, error);
    }
});

