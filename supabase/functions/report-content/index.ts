import {
    corsHeaders,
    ensureAllowedOrigin,
    ensureConfigured,
    enforceRateLimit,
    escapeHtml,
    handleError,
    HttpError,
    jsonResponse,
    requireUuid,
    resolveIdentity,
    serviceClient,
} from "../_shared/common.ts";

const allowedReasons = new Set([
    "copyright",
    "false_authorship",
    "malicious",
    "inappropriate",
    "spam",
    "terms_violation",
    "other",
]);

const reasonLabels: Record<string, string> = {
    copyright: "著作権違反",
    false_authorship: "自作発言・作者詐称",
    malicious: "悪意のある投稿",
    inappropriate: "不適切な内容",
    spam: "スパム",
    terms_violation: "規約違反",
    other: "その他",
};

async function sendAdminEmail(data: {
    targetType: "work" | "comment";
    targetId: string;
    reason: string;
    details: string | null;
    reportId: string;
}): Promise<boolean> {
    const apiKey = Deno.env.get("RESEND_API_KEY") ?? "";
    const adminEmail = Deno.env.get("MFDCO_ADMIN_EMAIL") ?? "";
    const fromEmail = Deno.env.get("MFDCO_FROM_EMAIL") ?? "";

    if (!apiKey || !adminEmail || !fromEmail) {
        console.warn("Report saved, but email secrets are not configured.");
        return false;
    }

    const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: fromEmail,
            to: [adminEmail],
            subject: `[MFDCO通報] ${reasonLabels[data.reason]}`,
            html: `
                <h2>MFDCOに新しい通報があります</h2>
                <p><strong>対象:</strong> ${escapeHtml(data.targetType)}</p>
                <p><strong>対象ID:</strong> ${escapeHtml(data.targetId)}</p>
                <p><strong>理由:</strong> ${escapeHtml(reasonLabels[data.reason])}</p>
                <p><strong>詳細:</strong><br>${escapeHtml(data.details ?? "（記載なし）")}</p>
                <p><strong>通報ID:</strong> ${escapeHtml(data.reportId)}</p>
            `,
        }),
    });

    if (!response.ok) {
        console.error("RESEND ERROR:", response.status, await response.text());
        return false;
    }

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
        const targetType = body.target_type === "comment" ? "comment" : "work";
        const targetId = requireUuid(body.target_id, "通報対象ID");
        const reason = String(body.reason ?? "").trim();
        const details = String(body.details ?? "").trim() || null;

        if (!allowedReasons.has(reason)) {
            throw new HttpError(400, "通報理由が不正です。");
        }
        if (details && details.length > 4000) {
            throw new HttpError(400, "通報詳細は4000文字以内にしてください。");
        }
        if (reason === "other" && (!details || details.length < 5)) {
            throw new HttpError(400, "その他の場合は詳細を5文字以上入力してください。");
        }

        const identity = await resolveIdentity(req, body.visitor_id);
        const action = targetType === "work" ? "report_work" : "report_comment";

        await enforceRateLimit(
            serviceClient,
            identity,
            action,
            targetId,
            3,
            86400,
        );

        const targetTable = targetType === "work" ? "works" : "work_comments";
        const { data: target, error: targetError } = await serviceClient
            .from(targetTable)
            .select("id")
            .eq("id", targetId)
            .maybeSingle();

        if (targetError) throw targetError;
        if (!target) throw new HttpError(404, "通報対象が見つかりません。");

        const reportTable = targetType === "work" ? "work_reports" : "comment_reports";
        const targetColumn = targetType === "work" ? "work_id" : "comment_id";

        const { data: report, error: reportError } = await serviceClient
            .from(reportTable)
            .insert({
                [targetColumn]: targetId,
                reporter_user_id: identity.userId,
                visitor_hash: identity.visitorHash,
                reason,
                details,
            })
            .select("id")
            .single();

        if (reportError) {
            if (reportError.code === "23505") {
                throw new HttpError(409, "この対象はすでに通報済みです。");
            }
            throw reportError;
        }

        const emailSent = await sendAdminEmail({
            targetType,
            targetId,
            reason,
            details,
            reportId: report.id,
        });

        return jsonResponse(req, {
            ok: true,
            report_id: report.id,
            email_sent: emailSent,
        });
    } catch (error) {
        return handleError(req, error);
    }
});

