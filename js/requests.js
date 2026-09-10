(() => {
    "use strict";

    const STATUS_META = {
        open: { label: "未着手", english: "OPEN" },
        in_progress: { label: "着手中", english: "IN PROGRESS" },
        review: { label: "確認待ち", english: "REVIEW" },
        completed: { label: "完了", english: "COMPLETED" }
    };

    const state = {
        client: null,
        user: null,
        profile: null,
        requests: [],
        filteredRequests: [],
        activeFilter: "all",
        search: "",
        sort: "newest",
        modalRequestId: null,
        statusRequestId: null,
        ownWorks: []
    };

    const el = {};

    document.addEventListener("DOMContentLoaded", init);

    async function init() {
        cacheElements();
        bindEvents();
        state.client = resolveSupabaseClient();

        if (!state.client) {
            setLoading(false);
            showGlobalMessage("Supabaseクライアントを取得できませんでした。js/supabase-config.js の読み込みを確認してください。", "error");
            return;
        }

        await loadSession();
        await loadRequests();
    }

    function resolveSupabaseClient() {
        try {
            if (typeof supabaseClient !== "undefined" && supabaseClient) return supabaseClient;
        } catch (_) {}
        if (window.supabaseClient) return window.supabaseClient;
        if (window.mfdcoSupabase) return window.mfdcoSupabase;
        if (window.MFDCO_SUPABASE) return window.MFDCO_SUPABASE;
        return null;
    }

    function cacheElements() {
        el.grid = document.getElementById("requests-grid");
        el.loading = document.getElementById("requests-loading");
        el.empty = document.getElementById("requests-empty");
        el.message = document.getElementById("requests-message");
        el.count = document.getElementById("requests-result-count");
        el.search = document.getElementById("requests-search");
        el.sort = document.getElementById("requests-sort");
        el.refresh = document.getElementById("requests-refresh");
        el.loginNote = document.getElementById("requests-login-note");
        el.submissionModal = document.getElementById("submission-modal");
        el.submissionWorkSelect = document.getElementById("submission-work-select");
        el.submissionWorkHelp = document.getElementById("submission-work-help");
        el.submissionMessage = document.getElementById("submission-message");
        el.submissionConfirm = document.getElementById("submission-confirm");
        el.submissionModalMessage = document.getElementById("submission-modal-message");
        el.statusModal = document.getElementById("status-modal");
        el.statusSelect = document.getElementById("status-select");
        el.statusConfirm = document.getElementById("status-confirm");
        el.statusModalMessage = document.getElementById("status-modal-message");
    }

    function bindEvents() {
        el.search?.addEventListener("input", () => {
            state.search = el.search.value.trim().toLowerCase();
            applyFilters();
        });
        el.sort?.addEventListener("change", () => {
            state.sort = el.sort.value;
            applyFilters();
        });
        el.refresh?.addEventListener("click", loadRequests);
        document.addEventListener("click", handleDocumentClick);
        el.submissionConfirm?.addEventListener("click", submitCompletedWork);
        el.statusConfirm?.addEventListener("click", updateRequestStatus);
        document.addEventListener("keydown", (event) => {
            if (event.key === "Escape") {
                closeSubmissionModal();
                closeStatusModal();
            }
        });
    }

    async function loadSession() {
        const { data, error } = await state.client.auth.getSession();
        if (error) console.error("MFDCO REQUESTS: session error", error);
        state.user = data?.session?.user || null;

        if (state.user) {
            await loadCurrentProfile();
            el.loginNote.textContent = `${state.profile?.activity_name || "ログイン中"} として操作できます。`;
            document.querySelectorAll(".requests-filter-personal").forEach((button) => { button.hidden = false; });
        } else {
            el.loginNote.textContent = "閲覧は可能です。着手・完成作品の提出にはログインが必要です。";
        }

        state.client.auth.onAuthStateChange(async (_event, session) => {
            const oldId = state.user?.id || null;
            state.user = session?.user || null;
            if (state.user?.id !== oldId) {
                state.profile = null;
                state.ownWorks = [];
                if (state.user) await loadCurrentProfile();
                await loadRequests();
            }
        });
    }

    async function loadCurrentProfile() {
        if (!state.user) return;
        const { data, error } = await state.client
            .from("profiles")
            .select("id, activity_name, icon_url")
            .eq("id", state.user.id)
            .maybeSingle();
        if (error) console.warn("MFDCO REQUESTS: profile warning", error);
        state.profile = data || { id: state.user.id, activity_name: "ログインユーザー", icon_url: null };
    }

    async function loadRequests() {
        setLoading(true);
        clearGlobalMessage();
        try {
            const { data: requests, error } = await state.client
                .from("requests")
                .select("id,user_id,title,description,category,tags,status,created_at,updated_at,completed_at")
                .order("created_at", { ascending: false });
            if (error) throw error;
            const rows = requests || [];
            if (!rows.length) {
                state.requests = [];
                applyFilters();
                return;
            }

            const requestIds = rows.map((row) => row.id);
            const userIds = new Set(rows.map((row) => row.user_id));
            const [workersResult, submissionsResult] = await Promise.all([
                state.client.from("request_workers").select("id,request_id,user_id,joined_at").in("request_id", requestIds),
                state.client.from("request_submissions").select("id,request_id,user_id,work_id,message,status,created_at,reviewed_at").in("request_id", requestIds).order("created_at", { ascending: false })
            ]);
            if (workersResult.error) throw workersResult.error;
            if (submissionsResult.error) throw submissionsResult.error;

            const workers = workersResult.data || [];
            const submissions = submissionsResult.data || [];
            workers.forEach((w) => userIds.add(w.user_id));
            submissions.forEach((s) => userIds.add(s.user_id));
            const workIds = [...new Set(submissions.map((s) => s.work_id).filter(Boolean))];

            const [profilesResult, worksResult] = await Promise.all([
                userIds.size ? state.client.from("profiles").select("id,activity_name,icon_url").in("id", [...userIds]) : Promise.resolve({ data: [], error: null }),
                workIds.length ? state.client.from("works").select("id,title,image_url,status").in("id", workIds) : Promise.resolve({ data: [], error: null })
            ]);

            if (profilesResult.error) console.warn("MFDCO REQUESTS: profiles unavailable", profilesResult.error);
            if (worksResult.error) console.warn("MFDCO REQUESTS: works unavailable", worksResult.error);

            const profileMap = new Map((profilesResult.data || []).map((p) => [p.id, p]));
            const workMap = new Map((worksResult.data || []).map((w) => [w.id, w]));
            const workersByRequest = groupBy(workers, "request_id");
            const submissionsByRequest = groupBy(submissions, "request_id");

            state.requests = rows.map((request) => ({
                ...request,
                owner: profileMap.get(request.user_id) || null,
                workers: (workersByRequest.get(request.id) || []).map((w) => ({ ...w, profile: profileMap.get(w.user_id) || null })),
                submissions: (submissionsByRequest.get(request.id) || []).map((s) => ({ ...s, profile: profileMap.get(s.user_id) || null, work: workMap.get(s.work_id) || null }))
            }));
            applyFilters();
        } catch (error) {
            console.error("MFDCO REQUESTS: load failed", error);
            state.requests = [];
            applyFilters();
            showGlobalMessage(readableError(error, "制作依頼を読み込めませんでした。"), "error");
        } finally {
            setLoading(false);
        }
    }

    function applyFilters() {
        let rows = state.requests.filter((request) => {
            if (state.activeFilter === "mine") {
                if (!state.user || !request.workers.some((w) => w.user_id === state.user.id)) return false;
            } else if (state.activeFilter === "owned") {
                if (!state.user || request.user_id !== state.user.id) return false;
            } else if (state.activeFilter !== "all" && request.status !== state.activeFilter) {
                return false;
            }

            if (!state.search) return true;
            const text = [request.title, request.description, request.category, ...(Array.isArray(request.tags) ? request.tags : []), request.owner?.activity_name, ...request.workers.map((w) => w.profile?.activity_name)]
                .filter(Boolean).join(" ").toLowerCase();
            return text.includes(state.search);
        });

        rows = rows.slice().sort((a, b) => {
            if (state.sort === "oldest") return dateValue(a.created_at) - dateValue(b.created_at);
            if (state.sort === "updated") return dateValue(b.updated_at) - dateValue(a.updated_at);
            return dateValue(b.created_at) - dateValue(a.created_at);
        });
        state.filteredRequests = rows;
        if (el.count) el.count.textContent = String(rows.length);
        renderRequests(rows);
    }

    function renderRequests(rows) {
        if (!el.grid) return;
        el.grid.innerHTML = "";
        if (!rows.length) {
            if (el.empty) el.empty.hidden = false;
            return;
        }
        if (el.empty) el.empty.hidden = true;
        const fragment = document.createDocumentFragment();
        rows.forEach((request, index) => fragment.appendChild(createRequestCard(request, index)));
        el.grid.appendChild(fragment);
    }

    function createRequestCard(request, index) {
        const article = document.createElement("article");
        article.className = "request-card";
        article.dataset.requestId = request.id;
        const status = STATUS_META[request.status] || STATUS_META.open;
        const ownerName = request.owner?.activity_name || "MFDCO USER";
        const isOwner = !!(state.user && request.user_id === state.user.id);
        const isWorker = !!(state.user && request.workers.some((w) => w.user_id === state.user.id));
        const latestPendingSubmission = request.submissions.find((s) => s.status === "pending") || null;

        article.innerHTML = `
            <div class="request-card-top">
                <span class="request-status request-status-${escapeAttribute(request.status)}">${escapeHtml(status.label)}</span>
                <time class="request-date" datetime="${escapeAttribute(request.created_at || "")}">${escapeHtml(formatDate(request.created_at))}</time>
            </div>
            <div class="request-card-body">
                <p class="request-id">MFDCO REQUEST ${String(index + 1).padStart(3, "0")}</p>
                <h2 class="request-title">${escapeHtml(request.title || "無題の制作依頼")}</h2>
                <p class="request-description">${escapeHtml(request.description || "依頼内容の説明はありません。")}</p>
                ${renderTags(request.tags)}
                <div class="request-meta-grid">
                    <div>
                        <p class="request-meta-label">REQUESTER / 依頼者</p>
                        <div class="request-meta-value request-owner">${renderAvatar(request.owner, ownerName)}<span class="request-person-name">${escapeHtml(ownerName)}</span></div>
                    </div>
                    <div>
                        <p class="request-meta-label">WORKING MEMBERS / 着手中${request.workers.length ? ` · ${request.workers.length}名` : ""}</p>
                        ${renderWorkers(request.workers)}
                    </div>
                </div>
                ${renderSubmission(latestPendingSubmission)}
                <div class="request-card-actions">${renderActions(request, { isOwner, isWorker, latestPendingSubmission })}</div>
            </div>`;
        return article;
    }

    function renderTags(tags) {
        if (!Array.isArray(tags) || !tags.length) return "";
        return `<div class="request-tags">${tags.slice(0, 6).map((tag) => `<span class="request-tag">${escapeHtml(tag)}</span>`).join("")}</div>`;
    }

    function renderWorkers(workers) {
        if (!workers.length) return `<p class="request-no-workers">まだ誰も着手していません。</p>`;
        const visible = workers.slice(0, 4);
        return `<div class="request-workers">${visible.map((worker) => {
            const name = worker.profile?.activity_name || "MFDCO USER";
            return `<div class="request-worker">${renderAvatar(worker.profile, name)}<span class="request-person-name">${escapeHtml(name)}</span></div>`;
        }).join("")}${workers.length > visible.length ? `<span class="request-workers-more">ほか ${workers.length - visible.length}名</span>` : ""}</div>`;
    }

    function renderSubmission(submission) {
        if (!submission) return "";
        const submitter = submission.profile?.activity_name || "MFDCO USER";
        const workTitle = submission.work?.title || "提出されたMFDCO作品";
        const workLink = submission.work_id ? `work.html?id=${encodeURIComponent(submission.work_id)}` : "";
        return `<div class="request-submission-box">
            <p class="request-submission-label">COMPLETED WORK / 完成作品</p>
            <p class="request-submission-title">${escapeHtml(workTitle)}</p>
            <p class="request-submission-message">提出者：${escapeHtml(submitter)}${submission.message ? `<br>${escapeHtml(submission.message)}` : ""}</p>
            ${workLink ? `<a class="request-submission-link" href="${escapeAttribute(workLink)}">作品を見る →</a>` : ""}
        </div>`;
    }

    function renderActions(request, { isOwner, isWorker, latestPendingSubmission }) {
        if (!state.user) return `<a href="join.html" class="requests-action-button">ログインして参加</a>`;
        const buttons = [];
        if (isOwner) {
            buttons.push(`<button type="button" class="requests-action-button" data-action="status" data-request-id="${escapeAttribute(request.id)}">状態を変更</button>`);
            if (request.status === "review" && latestPendingSubmission) {
                buttons.push(`<button type="button" class="requests-action-button is-primary" data-action="accept" data-submission-id="${escapeAttribute(latestPendingSubmission.id)}">完成として承認</button>`);
                buttons.push(`<button type="button" class="requests-action-button" data-action="revision" data-submission-id="${escapeAttribute(latestPendingSubmission.id)}">修正を依頼</button>`);
            }
            return buttons.join("");
        }
        if (request.status === "completed") return `<button type="button" class="requests-action-button" disabled>完了済み</button>`;
        if (request.status === "review") return isWorker ? `<button type="button" class="requests-action-button" disabled>依頼者の確認待ち</button>` : "";
        if (isWorker) {
            buttons.push(`<button type="button" class="requests-action-button" data-action="leave" data-request-id="${escapeAttribute(request.id)}">着手を取り消す</button>`);
            buttons.push(`<button type="button" class="requests-action-button is-primary" data-action="submit-work" data-request-id="${escapeAttribute(request.id)}">完成作品を提出</button>`);
        } else {
            buttons.push(`<button type="button" class="requests-action-button is-primary" data-action="join" data-request-id="${escapeAttribute(request.id)}">この依頼に着手</button>`);
        }
        return buttons.join("");
    }

    function renderAvatar(profile, fallbackName) {
        if (profile?.icon_url) return `<img class="request-avatar" src="${escapeAttribute(profile.icon_url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
        const initial = Array.from(fallbackName || "M")[0] || "M";
        return `<span class="request-avatar-fallback" aria-hidden="true">${escapeHtml(initial.toUpperCase())}</span>`;
    }

    async function handleDocumentClick(event) {
        const filterButton = event.target.closest(".requests-filter");
        if (filterButton) {
            document.querySelectorAll(".requests-filter").forEach((button) => button.classList.toggle("is-active", button === filterButton));
            state.activeFilter = filterButton.dataset.filter || "all";
            applyFilters();
            return;
        }
        if (event.target.closest("[data-close-modal]")) { closeSubmissionModal(); return; }
        if (event.target.closest("[data-close-status-modal]")) { closeStatusModal(); return; }
        const button = event.target.closest("[data-action]");
        if (!button) return;
        const action = button.dataset.action;

        if (action === "join") return runRequestAction(button, "join_request", { p_request_id: button.dataset.requestId }, "依頼への着手を登録しました。");
        if (action === "leave") {
            if (!window.confirm("この依頼への着手を取り消しますか？")) return;
            return runRequestAction(button, "leave_request", { p_request_id: button.dataset.requestId }, "着手を取り消しました。");
        }
        if (action === "submit-work") return openSubmissionModal(button.dataset.requestId);
        if (action === "status") return openStatusModal(button.dataset.requestId);
        if (action === "accept") {
            if (!window.confirm("この作品を完成品として承認し、依頼を完了にしますか？")) return;
            return runRequestAction(button, "review_request_submission", { p_submission_id: button.dataset.submissionId, p_action: "accept" }, "完成作品を承認しました。依頼を完了にしました。");
        }
        if (action === "revision") {
            if (!window.confirm("提出を差し戻し、依頼を着手中へ戻しますか？")) return;
            return runRequestAction(button, "review_request_submission", { p_submission_id: button.dataset.submissionId, p_action: "revision" }, "修正依頼として差し戻しました。");
        }
    }

    async function runRequestAction(button, fn, params, successMessage) {
        if (!state.user) { window.location.href = "join.html"; return; }
        const text = button.textContent;
        button.disabled = true;
        button.textContent = "処理中...";
        try {
            const { error } = await state.client.rpc(fn, params);
            if (error) throw error;
            showGlobalMessage(successMessage, "success");
            await loadRequests();
        } catch (error) {
            console.error(`MFDCO REQUESTS: ${fn} failed`, error);
            showGlobalMessage(readableError(error, "操作に失敗しました。"), "error");
        } finally {
            button.disabled = false;
            button.textContent = text;
        }
    }

    async function openSubmissionModal(requestId) {
        if (!state.user) { window.location.href = "join.html"; return; }
        state.modalRequestId = requestId;
        clearModalMessage(el.submissionModalMessage);
        el.submissionMessage.value = "";
        el.submissionConfirm.disabled = true;
        el.submissionWorkHelp.textContent = "作品を読み込んでいます...";
        el.submissionWorkSelect.innerHTML = `<option value="">作品を読み込んでいます...</option>`;
        el.submissionModal.hidden = false;
        document.body.classList.add("requests-modal-open");
        try {
            const { data, error } = await state.client.from("works").select("id,title,status,created_at").eq("user_id", state.user.id).eq("status", "approved").order("created_at", { ascending: false });
            if (error) throw error;
            state.ownWorks = data || [];
            el.submissionWorkSelect.innerHTML = `<option value="">作品を選択してください</option>`;
            state.ownWorks.forEach((work) => {
                const option = document.createElement("option");
                option.value = work.id;
                option.textContent = work.title || "無題の作品";
                el.submissionWorkSelect.appendChild(option);
            });
            if (state.ownWorks.length) {
                el.submissionWorkHelp.textContent = `公開済みの自分の提供作品 ${state.ownWorks.length}件から選択できます。`;
                el.submissionConfirm.disabled = false;
            } else {
                el.submissionWorkHelp.textContent = "公開済みの提供作品がありません。先にMFDCOへ作品を提供し、承認されてから提出してください。";
            }
        } catch (error) {
            console.error("MFDCO REQUESTS: own works load failed", error);
            showModalMessage(el.submissionModalMessage, readableError(error, "提供作品を読み込めませんでした。"), "error");
        }
    }

    function closeSubmissionModal() {
        if (!el.submissionModal || el.submissionModal.hidden) return;
        el.submissionModal.hidden = true;
        state.modalRequestId = null;
        document.body.classList.remove("requests-modal-open");
    }

    async function submitCompletedWork() {
        const requestId = state.modalRequestId;
        const workId = el.submissionWorkSelect.value;
        const message = el.submissionMessage.value.trim();
        if (!requestId || !workId) {
            showModalMessage(el.submissionModalMessage, "MFDCOへ提供済みの作品を選択してください。", "error");
            return;
        }
        const text = el.submissionConfirm.textContent;
        el.submissionConfirm.disabled = true;
        el.submissionConfirm.textContent = "提出中...";
        try {
            const { error } = await state.client.rpc("submit_request_work", { p_request_id: requestId, p_work_id: workId, p_message: message || null });
            if (error) throw error;
            closeSubmissionModal();
            showGlobalMessage("完成作品を提出しました。依頼者の確認待ちになりました。", "success");
            await loadRequests();
        } catch (error) {
            console.error("MFDCO REQUESTS: submit work failed", error);
            showModalMessage(el.submissionModalMessage, readableError(error, "完成作品を提出できませんでした。"), "error");
        } finally {
            el.submissionConfirm.disabled = false;
            el.submissionConfirm.textContent = text;
        }
    }

    function openStatusModal(requestId) {
        const request = state.requests.find((r) => r.id === requestId);
        if (!request || !state.user || request.user_id !== state.user.id) return;
        state.statusRequestId = requestId;
        el.statusSelect.value = request.status;
        clearModalMessage(el.statusModalMessage);
        el.statusModal.hidden = false;
        document.body.classList.add("requests-modal-open");
    }

    function closeStatusModal() {
        if (!el.statusModal || el.statusModal.hidden) return;
        el.statusModal.hidden = true;
        state.statusRequestId = null;
        document.body.classList.remove("requests-modal-open");
    }

    async function updateRequestStatus() {
        if (!state.statusRequestId) return;
        const text = el.statusConfirm.textContent;
        el.statusConfirm.disabled = true;
        el.statusConfirm.textContent = "更新中...";
        try {
            const { error } = await state.client.rpc("set_request_status", { p_request_id: state.statusRequestId, p_status: el.statusSelect.value });
            if (error) throw error;
            closeStatusModal();
            showGlobalMessage("依頼の状態を更新しました。", "success");
            await loadRequests();
        } catch (error) {
            console.error("MFDCO REQUESTS: status update failed", error);
            showModalMessage(el.statusModalMessage, readableError(error, "状態を更新できませんでした。"), "error");
        } finally {
            el.statusConfirm.disabled = false;
            el.statusConfirm.textContent = text;
        }
    }

    function groupBy(items, key) {
        const map = new Map();
        for (const item of items) {
            if (!map.has(item[key])) map.set(item[key], []);
            map.get(item[key]).push(item);
        }
        return map;
    }
    function setLoading(value) { if (el.loading) el.loading.hidden = !value; }
    function showGlobalMessage(message, type = "") { if (!el.message) return; el.message.hidden = false; el.message.className = `requests-message${type ? ` is-${type}` : ""}`; el.message.textContent = message; }
    function clearGlobalMessage() { if (!el.message) return; el.message.hidden = true; el.message.textContent = ""; el.message.className = "requests-message"; }
    function showModalMessage(target, message, type = "") { if (!target) return; target.hidden = false; target.className = `requests-message${type ? ` is-${type}` : ""}`; target.textContent = message; }
    function clearModalMessage(target) { if (!target) return; target.hidden = true; target.textContent = ""; target.className = "requests-message"; }
    function readableError(error, fallback) {
        const message = String(error?.message || error?.details || error?.hint || "");
        if (/not authenticated/i.test(message)) return "この操作にはログインが必要です。";
        if (/not a worker/i.test(message)) return "この依頼へ着手しているメンバーだけが完成作品を提出できます。";
        if (/not owner/i.test(message)) return "この依頼の依頼者だけが操作できます。";
        if (/work is not owned/i.test(message)) return "自分が提供した作品だけを提出できます。";
        if (/work is not approved/i.test(message)) return "MFDCOで公開済みの作品だけを提出できます。";
        if (/request is completed/i.test(message)) return "この依頼はすでに完了しています。";
        if (/request is under review/i.test(message)) return "この依頼は現在、完成作品の確認待ちです。";
        if (/duplicate key/i.test(message)) return "すでに登録されています。";
        return message || fallback;
    }
    function formatDate(value) {
        if (!value) return "----.--.--";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return "----.--.--";
        return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" }).format(date).replaceAll("/", ".");
    }
    function dateValue(value) { const time = new Date(value || 0).getTime(); return Number.isFinite(time) ? time : 0; }
    function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }
    function escapeAttribute(value) { return escapeHtml(value).replaceAll("`", "&#096;"); }
})();
