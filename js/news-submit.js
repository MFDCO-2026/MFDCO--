/* =========================================
   MFDCO NEWS SUBMIT
========================================= */

(() => {

    "use strict";


    /* =====================================
       ELEMENTS
    ====================================== */

    const loadingElement =
        document.getElementById("news-submit-loading");

    const errorElement =
        document.getElementById("news-submit-error");

    const errorTextElement =
        document.getElementById("news-submit-error-text");

    const formElement =
        document.getElementById("news-submit-form");

    const titleElement =
        document.getElementById("news-title");

    const contentElement =
        document.getElementById("news-content");

    const imageUrlElement =
        document.getElementById("news-image-url");

    const submitButton =
        document.getElementById("news-submit-button");

    const messageElement =
        document.getElementById("news-submit-message");

    const previewDateElement =
        document.getElementById("news-preview-date");

    const previewTitleElement =
        document.getElementById("news-preview-title");

    const previewContentElement =
        document.getElementById("news-preview-content");

    const previewImageWrapElement =
        document.getElementById("news-preview-image-wrap");

    const previewImageElement =
        document.getElementById("news-preview-image");


    let currentUser = null;


    /* =====================================
       ERROR
    ====================================== */

    function showPermissionError(message) {

        loadingElement.hidden = true;
        formElement.hidden = true;
        errorElement.hidden = false;

        errorTextElement.textContent =
            message;

    }


    /* =====================================
       FORM
    ====================================== */

    function showForm() {

        loadingElement.hidden = true;
        errorElement.hidden = true;
        formElement.hidden = false;

    }


    /* =====================================
       DATE
    ====================================== */

    function getCurrentDateLabel() {

        return new Intl.DateTimeFormat(
            "ja-JP",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(new Date());

    }


    /* =====================================
       IMAGE URL CHECK
    ====================================== */

    function isSafeImageUrl(value) {

        if (!value) {
            return false;
        }

        try {

            const url =
                new URL(value);

            return (
                url.protocol === "https:"
                || url.protocol === "http:"
            );

        } catch {

            return false;

        }

    }


    /* =====================================
       PREVIEW
    ====================================== */

    function updatePreview() {

        const title =
            titleElement.value.trim();

        const content =
            contentElement.value.trim();

        const imageUrl =
            imageUrlElement.value.trim();


        previewDateElement.textContent =
            getCurrentDateLabel();


        previewTitleElement.textContent =
            title
            || "お知らせタイトル";


        previewContentElement.textContent =
            content
            || "本文を入力するとここに表示されます。";


        if (isSafeImageUrl(imageUrl)) {

            previewImageElement.src =
                imageUrl;

            previewImageWrapElement.hidden =
                false;

        } else {

            previewImageElement.removeAttribute(
                "src"
            );

            previewImageWrapElement.hidden =
                true;

        }

    }


    /* =====================================
       PERMISSION CHECK
    ====================================== */

    async function checkPermission() {

        if (!window.supabaseClient) {

            showPermissionError(
                "Supabaseに接続できませんでした。"
            );

            return;

        }


        try {

            const {
                data: {
                    user
                },
                error: userError
            } =
                await window.supabaseClient
                    .auth
                    .getUser();


            if (userError) {
                throw userError;
            }


            if (!user) {

                showPermissionError(
                    "お知らせを投稿するにはログインが必要です。"
                );

                return;

            }


            currentUser =
                user;


            const {
                data: profile,
                error: profileError
            } =
                await window.supabaseClient
                    .from("profiles")
                    .select(`
                        id,
                        activity_name,
                        permanent_member
                    `)
                    .eq(
                        "id",
                        user.id
                    )
                    .maybeSingle();


            if (profileError) {
                throw profileError;
            }


            if (!profile) {

                showPermissionError(
                    "プロフィールを確認できませんでした。"
                );

                return;

            }


            if (
                profile.permanent_member
                !== true
            ) {

                showPermissionError(
                    "お知らせを投稿できるのは常任理事国のみです。"
                );

                return;

            }


            showForm();

            updatePreview();


        } catch (error) {

            console.error(
                "NEWS SUBMIT: 権限確認失敗",
                error
            );

            showPermissionError(
                "投稿権限を確認できませんでした。"
            );

        }

    }


    /* =====================================
       MESSAGE
    ====================================== */

    function showMessage(message) {

        messageElement.textContent =
            message;

        messageElement.hidden =
            false;

    }


    /* =====================================
       SUBMIT
    ====================================== */

    async function submitNews(event) {

        event.preventDefault();


        if (!currentUser) {

            showMessage(
                "ログイン情報を確認できません。"
            );

            return;

        }


        const title =
            titleElement.value.trim();

        const content =
            contentElement.value.trim();

        const imageUrl =
            imageUrlElement.value.trim();


        if (!title) {

            showMessage(
                "タイトルを入力してください。"
            );

            titleElement.focus();

            return;

        }


        if (!content) {

            showMessage(
                "本文を入力してください。"
            );

            contentElement.focus();

            return;

        }


        if (
            imageUrl
            && !isSafeImageUrl(imageUrl)
        ) {

            showMessage(
                "画像URLが正しくありません。"
            );

            imageUrlElement.focus();

            return;

        }


        submitButton.disabled =
            true;

        submitButton.textContent =
            "投稿中...";

        messageElement.hidden =
            true;


        try {

            /*
             * ここでも最新の権限を再確認します。
             */

            const {
                data: profile,
                error: profileError
            } =
                await window.supabaseClient
                    .from("profiles")
                    .select("permanent_member")
                    .eq(
                        "id",
                        currentUser.id
                    )
                    .maybeSingle();


            if (profileError) {
                throw profileError;
            }


            if (
                profile?.permanent_member
                !== true
            ) {

                throw new Error(
                    "現在のアカウントには投稿権限がありません。"
                );

            }


            /*
             * NEWS INSERT
             */

            const {
                data: createdNews,
                error: insertError
            } =
                await window.supabaseClient
                    .from("news")
                    .insert({
                        author_id:
                            currentUser.id,

                        title:
                            title,

                        content:
                            content,

                        image_url:
                            imageUrl || null
                    })
                    .select(`
                        id,
                        title,
                        published_at
                    `)
                    .single();


            if (insertError) {
                throw insertError;
            }


            console.log(
                "NEWS SUBMIT: 投稿完了",
                createdNews
            );


            /*
             * 一覧へ移動
             */

            window.location.href =
                "news.html";


        } catch (error) {

            console.error(
                "NEWS SUBMIT: 投稿失敗",
                error
            );


            if (
                error?.code === "42501"
            ) {

                showMessage(
                    "投稿権限がありません。常任理事国のアカウントか確認してください。"
                );

            } else {

                showMessage(
                    error?.message
                    || "お知らせの投稿に失敗しました。"
                );

            }


            submitButton.disabled =
                false;

            submitButton.textContent =
                "投稿する";

        }

    }


    /* =====================================
       EVENTS
    ====================================== */

    titleElement?.addEventListener(
        "input",
        updatePreview
    );

    contentElement?.addEventListener(
        "input",
        updatePreview
    );

    imageUrlElement?.addEventListener(
        "input",
        updatePreview
    );

    formElement?.addEventListener(
        "submit",
        submitNews
    );


    /* =====================================
       INIT
    ====================================== */

    async function initializeNewsSubmitPage() {

        console.log(
            "MFDCO NEWS SUBMIT: 初期化開始"
        );


        await checkPermission();


        console.log(
            "MFDCO NEWS SUBMIT: 初期化完了"
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeNewsSubmitPage
        );

    } else {

        initializeNewsSubmitPage();

    }


    console.log(
        "MFDCO news-submit.js loaded successfully."
    );

})();