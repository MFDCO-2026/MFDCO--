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
} from "../_shared/common.ts";

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

        await enforceRateLimit(
            serviceClient,
            identity,
            "like",
            workId,
            20,
            600,
        );

        const { data: work, error: workError } = await serviceClient
            .from("works")
            .select("id,status")
            .eq("id", workId)
            .maybeSingle();

        if (workError) throw workError;
        if (!work || work.status !== "approved") {
            throw new HttpError(404, "評価できる作品が見つかりません。");
        }

        let existingQuery = serviceClient
            .from("work_likes")
            .select("id")
            .eq("work_id", workId);

        existingQuery = identity.userId
            ? existingQuery.eq("user_id", identity.userId)
            : existingQuery.eq("visitor_hash", identity.visitorHash);

        const { data: existing, error: existingError } =
            await existingQuery.maybeSingle();

        if (existingError) throw existingError;

        let liked: boolean;

        if (existing) {
            const { error } = await serviceClient
                .from("work_likes")
                .delete()
                .eq("id", existing.id);
            if (error) throw error;
            liked = false;
        } else {
            const { error } = await serviceClient
                .from("work_likes")
                .insert({
                    work_id: workId,
                    user_id: identity.userId,
                    visitor_hash: identity.visitorHash,
                });
            if (error) throw error;
            liked = true;
        }

        const { data: updatedWork, error: countError } = await serviceClient
            .from("works")
            .select("like_count")
            .eq("id", workId)
            .single();

        if (countError) throw countError;

        return jsonResponse(req, {
            ok: true,
            liked,
            like_count: Number(updatedWork.like_count ?? 0),
        });
    } catch (error) {
        return handleError(req, error);
    }
});

