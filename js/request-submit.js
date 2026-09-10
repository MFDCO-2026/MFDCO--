(() => {
    "use strict";

    const MAX_TAGS = 10;
    const MAX_TAG_LENGTH = 30;

    const state = {
        client: null,
        user: null,
        profile: null,
        tags: [],
        submitting: false
    };

    const el = {};

    document.addEventListener("DOMContentLoaded", init);


    async function init() {
        cacheElements();
        bindEvents();

        state.client = resolveSupabaseClient();

        if (!state.client) {
            setAuthError(
                "Supabaseクライアントを取得できませんでした。"
            );

            disableForm();

            return;
        }

        await loadSession();

        updateCounters();
        updatePreview();
    }


    function cacheElements() {
        el.form =
            document.getElementById("request-submit-form");

        el.auth =
            document.getElementById("request-submit-auth");

        el.authText =
            document.getElementById("request-submit-auth-text");

        el.title =
            document.getElementById("request-title");

        el.titleCount =
            document.getElementById("request-title-count");

        el.category =
            document.getElementById("request-category");

        el.description =
            document.getElementById("request-description");

        el.descriptionCount =
            document.getElementById(
                "request-description-count"
            );

        el.tagInput =
            document.getElementById("request-tag-input");

        el.tagAdd =
            document.getElementById("request-tag-add");

        el.tags =
            document.getElementById("request-tags");

        el.confirm =
            document.getElementById("request-confirm");

        el.button =
            document.getElementById("request-submit-button");

        el.message =
            document.getElementById("request-submit-message");

        el.previewTitle =
            document.getElementById("preview-title");

        el.previewCategory =
            document.getElementById("preview-category");

        el.previewDescription =
            document.getElementById(
                "preview-description"
            );

        el.previewTags =
            document.getElementById("preview-tags");
    }


    function bindEvents() {
        el.title.addEventListener(
            "input",
            handleFormInput
        );

        el.category.addEventListener(
            "change",
            handleFormInput
        );

        el.description.addEventListener(
            "input",
            handleFormInput
        );

        el.tagAdd.addEventListener(
            "click",
            addTagFromInput
        );

        el.tagInput.addEventListener(
            "keydown",
            (event) => {

                if (
                    event.key === "Enter" ||
                    event.key === ","
                ) {
                    event.preventDefault();
                    addTagFromInput();
                }

            }
        );

        el.tags.addEventListener(
            "click",
            handleTagRemove
        );

        el.form.addEventListener(
            "submit",
            submitRequest
        );
    }


    function resolveSupabaseClient() {
        try {
            if (
                typeof supabaseClient !== "undefined" &&
                supabaseClient
            ) {
                return supabaseClient;
            }
        } catch (_) {
            // ignore
        }

        if (window.supabaseClient) {
            return window.supabaseClient;
        }

        if (window.mfdcoSupabase) {
            return window.mfdcoSupabase;
        }

        if (window.MFDCO_SUPABASE) {
            return window.MFDCO_SUPABASE;
        }

        return null;
    }


    async function loadSession() {
        try {

            const {
                data,
                error
            } = await state.client.auth.getSession();

            if (error) {
                throw error;
            }

            state.user =
                data?.session?.user || null;


            if (!state.user) {

                setAuthError(
                    "制作依頼を投稿するにはログインが必要です。"
                );

                disableForm();

                setTimeout(() => {
                    window.location.href = "join.html";
                }, 1400);

                return;
            }


            await loadProfile();


            const name =
                state.profile?.activity_name ||
                state.user.email ||
                "ログインユーザー";


            el.auth.classList.remove("is-error");

            el.authText.textContent =
                `${name} として制作依頼を投稿します。`;

        } catch (error) {

            console.error(
                "MFDCO REQUEST SUBMIT: session error",
                error
            );

            setAuthError(
                "ログイン状態を確認できませんでした。"
            );

            disableForm();
        }
    }


    async function loadProfile() {
        if (!state.user) {
            return;
        }

        const {
            data,
            error
        } = await state.client
            .from("profiles")
            .select(
                "id, activity_name, icon_url"
            )
            .eq(
                "id",
                state.user.id
            )
            .maybeSingle();


        if (error) {
            console.warn(
                "MFDCO REQUEST SUBMIT: profile warning",
                error
            );
        }


        state.profile =
            data || null;
    }


    function handleFormInput() {
        updateCounters();
        updatePreview();
    }


    function updateCounters() {
        el.titleCount.textContent =
            String(el.title.value.length);

        el.descriptionCount.textContent =
            String(el.description.value.length);
    }


    function addTagFromInput() {
        let value =
            el.tagInput.value.trim();


        if (!value) {
            return;
        }


        value =
            value
                .replace(/^#+/, "")
                .trim();


        if (!value) {
            return;
        }


        if (
            value.length >
            MAX_TAG_LENGTH
        ) {
            showMessage(
                `タグは${MAX_TAG_LENGTH}文字以内で入力してください。`,
                "error"
            );

            return;
        }


        if (
            state.tags.length >=
            MAX_TAGS
        ) {
            showMessage(
                `タグは最大${MAX_TAGS}個まで設定できます。`,
                "error"
            );

            return;
        }


        const duplicate =
            state.tags.some(
                (tag) =>
                    tag.toLowerCase() ===
                    value.toLowerCase()
            );


        if (duplicate) {
            el.tagInput.value = "";
            return;
        }


        state.tags.push(value);

        el.tagInput.value = "";

        renderTags();
        updatePreview();
        clearMessage();
    }


    function handleTagRemove(event) {
        const button =
            event.target.closest(
                "[data-remove-tag]"
            );


        if (!button) {
            return;
        }


        const index =
            Number(
                button.dataset.removeTag
            );


        if (
            !Number.isInteger(index) ||
            index < 0 ||
            index >= state.tags.length
        ) {
            return;
        }


        state.tags.splice(
            index,
            1
        );


        renderTags();
        updatePreview();
    }


    function renderTags() {
        el.tags.innerHTML = "";


        state.tags.forEach(
            (tag, index) => {

                const item =
                    document.createElement("span");


                item.className =
                    "request-submit-tag";


                const text =
                    document.createElement("span");

                text.textContent =
                    `#${tag}`;


                const button =
                    document.createElement("button");

                button.type =
                    "button";

                button.dataset.removeTag =
                    String(index);

                button.setAttribute(
                    "aria-label",
                    `${tag}を削除`
                );

                button.textContent =
                    "×";


                item.appendChild(text);
                item.appendChild(button);

                el.tags.appendChild(item);
            }
        );
    }


    function updatePreview() {
        const title =
            el.title.value.trim();

        const category =
            el.category.value;

        const description =
            el.description.value.trim();


        el.previewTitle.textContent =
            title ||
            "制作依頼のタイトル";


        el.previewCategory.textContent =
            category ||
            "CATEGORY";


        el.previewDescription.textContent =
            description ||
            "ここに依頼内容のプレビューが表示されます。";


        el.previewTags.innerHTML = "";


        state.tags.forEach(
            (tag) => {

                const span =
                    document.createElement("span");

                span.className =
                    "request-submit-preview-tag";

                span.textContent =
                    `#${tag}`;

                el.previewTags.appendChild(span);
            }
        );
    }


    async function submitRequest(event) {
        event.preventDefault();


        if (state.submitting) {
            return;
        }


        clearMessage();


        if (!state.user) {
            showMessage(
                "制作依頼を投稿するにはログインが必要です。",
                "error"
            );

            return;
        }


        const title =
            el.title.value.trim();

        const category =
            el.category.value.trim();

        const description =
            el.description.value.trim();


        if (!title) {
            showMessage(
                "依頼タイトルを入力してください。",
                "error"
            );

            el.title.focus();

            return;
        }


        if (
            title.length > 120
        ) {
            showMessage(
                "依頼タイトルは120文字以内で入力してください。",
                "error"
            );

            el.title.focus();

            return;
        }


        if (!category) {
            showMessage(
                "カテゴリーを選択してください。",
                "error"
            );

            el.category.focus();

            return;
        }


        if (!description) {
            showMessage(
                "依頼内容を入力してください。",
                "error"
            );

            el.description.focus();

            return;
        }


        if (
            description.length > 5000
        ) {
            showMessage(
                "依頼内容は5000文字以内で入力してください。",
                "error"
            );

            el.description.focus();

            return;
        }


        if (!el.confirm.checked) {
            showMessage(
                "投稿内容を確認し、公開確認にチェックしてください。",
                "error"
            );

            el.confirm.focus();

            return;
        }


        state.submitting = true;

        setSubmitting(true);


        try {

            /*
             * user_id はログイン中ユーザーのIDを使用。
             *
             * requests のRLS:
             *
             * with check (
             *     user_id = auth.uid()
             * )
             *
             * により、他人のUUIDでの投稿は拒否されます。
             */

            const {
                data,
                error
            } = await state.client
                .from("requests")
                .insert({
                    user_id:
                        state.user.id,

                    title:
                        title,

                    description:
                        description,

                    category:
                        category,

                    tags:
                        state.tags,

                    status:
                        "open"
                })
                .select(
                    "id, title, status, created_at"
                )
                .single();


            if (error) {
                throw error;
            }


            console.log(
                "MFDCO REQUEST SUBMIT: created",
                data
            );


            showMessage(
                "制作依頼を公開しました。制作依頼一覧へ移動します。",
                "success"
            );


            /*
             * 一覧へ戻る。
             * request.html を作成した後は
             *
             * request.html?id=${data.id}
             *
             * に変更することもできます。
             */

            setTimeout(() => {

                window.location.href =
                    "requests.html";

            }, 900);


        } catch (error) {

            console.error(
                "MFDCO REQUEST SUBMIT: insert failed",
                error
            );


            showMessage(
                readableError(
                    error,
                    "制作依頼を投稿できませんでした。"
                ),
                "error"
            );


            state.submitting = false;

            setSubmitting(false);
        }
    }


    function setSubmitting(active) {
        el.button.disabled =
            active;


        if (active) {

            el.button.innerHTML = `
                <span>公開しています...</span>
            `;

        } else {

            el.button.innerHTML = `
                <span>制作依頼を公開</span>
                <span>→</span>
            `;

        }
    }


    function disableForm() {
        const controls =
            el.form.querySelectorAll(
                "input, select, textarea, button"
            );


        controls.forEach(
            (control) => {
                control.disabled = true;
            }
        );
    }


    function setAuthError(message) {
        el.auth.classList.add(
            "is-error"
        );

        el.authText.textContent =
            message;
    }


    function showMessage(
        message,
        type = ""
    ) {
        el.message.hidden =
            false;

        el.message.className =
            "request-submit-message";

        el.message.textContent =
            message;


        if (type) {
            el.message.classList.add(
                `is-${type}`
            );
        }


        el.message.scrollIntoView({
            behavior: "smooth",
            block: "center"
        });
    }


    function clearMessage() {
        el.message.hidden =
            true;

        el.message.textContent =
            "";

        el.message.className =
            "request-submit-message";
    }


    function readableError(
        error,
        fallback
    ) {
        const message =
            String(
                error?.message ||
                error?.details ||
                error?.hint ||
                ""
            );


        if (
            /row-level security/i.test(
                message
            )
        ) {
            return "このアカウントでは制作依頼を投稿できません。ログイン状態またはSupabaseのRLS設定を確認してください。";
        }


        if (
            /duplicate key/i.test(
                message
            )
        ) {
            return "同じ制作依頼がすでに登録されています。";
        }


        if (
            /violates check constraint/i.test(
                message
            )
        ) {
            return "入力内容が制作依頼の登録条件を満たしていません。";
        }


        if (
            /not authenticated/i.test(
                message
            )
        ) {
            return "制作依頼を投稿するにはログインが必要です。";
        }


        return (
            message ||
            fallback
        );
    }

})();