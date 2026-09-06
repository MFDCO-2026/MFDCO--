/* =========================================
   MFDCO NEWS
========================================= */

(() => {

    "use strict";


    /* =====================================
       ELEMENTS
    ====================================== */

    const loadingElement =
        document.getElementById("news-loading");

    const errorElement =
        document.getElementById("news-error");

    const emptyElement =
        document.getElementById("news-empty");

    const listElement =
        document.getElementById("news-list");

    const adminAreaElement =
        document.getElementById("news-admin-area");


    /* =====================================
       ESCAPE HTML
    ====================================== */

    function escapeHtml(value) {

        if (value === null || value === undefined) {
            return "";
        }

        return String(value)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }


    /* =====================================
       DATE
    ====================================== */

    function formatDate(value) {

        if (!value) {
            return "";
        }

        const date =
            new Date(value);

        if (Number.isNaN(date.getTime())) {
            return "";
        }

        return new Intl.DateTimeFormat(
            "ja-JP",
            {
                year: "numeric",
                month: "2-digit",
                day: "2-digit"
            }
        ).format(date);
    }


    /* =====================================
       PREVIEW
    ====================================== */

    function createPreview(content) {

        if (!content) {
            return "";
        }

        const normalized =
            String(content)
                .replace(/\s+/g, " ")
                .trim();

        const limit =
            120;

        if (normalized.length <= limit) {
            return normalized;
        }

        return (
            normalized.slice(0, limit)
            + "..."
        );
    }


    /* =====================================
       IMAGE URL CHECK
    ====================================== */

    function isSafeImageUrl(url) {

        if (!url) {
            return false;
        }

        try {

            const parsed =
                new URL(
                    url,
                    window.location.href
                );

            return (
                parsed.protocol === "https:"
                || parsed.protocol === "http:"
            );

        } catch {

            return false;

        }

    }


    /* =====================================
       CURRENT USER / PERMANENT MEMBER
    ====================================== */

    async function checkPermanentMember() {

        if (
            !window.supabaseClient
            || !adminAreaElement
        ) {
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

            if (
                userError
                || !user
            ) {

                adminAreaElement.hidden = true;

                return;
            }


            const {
                data: profile,
                error: profileError
            } =
                await window.supabaseClient
                    .from("profiles")
                    .select("permanent_member")
                    .eq("id", user.id)
                    .maybeSingle();


            if (profileError) {

                console.error(
                    "NEWS: 常任理事国判定失敗",
                    profileError
                );

                adminAreaElement.hidden = true;

                return;
            }


            adminAreaElement.hidden =
                profile?.permanent_member !== true;

        } catch (error) {

            console.error(
                "NEWS: 常任理事国判定エラー",
                error
            );

            adminAreaElement.hidden = true;

        }

    }


    /* =====================================
       CREATE NEWS ITEM
    ====================================== */

    function createNewsItem(newsItem) {

        const article =
            document.createElement("article");

        article.className =
            "news-item";


        const authorName =
            newsItem.author?.activity_name
            || "MFDCO";


        const safeTitle =
            escapeHtml(newsItem.title);


        const safePreview =
            escapeHtml(
                createPreview(
                    newsItem.content
                )
            );


        const safeAuthor =
            escapeHtml(authorName);


        const date =
            formatDate(
                newsItem.published_at
                || newsItem.created_at
            );


        const detailsUrl =
            `news-detail.html?id=${encodeURIComponent(newsItem.id)}`;


        const hasImage =
            isSafeImageUrl(
                newsItem.image_url
            );


        if (hasImage) {

            article.classList.add(
                "has-image"
            );

        }


        article.innerHTML = `

            <div class="news-date">
                ${escapeHtml(date)}
            </div>


            <div class="news-main">

                <h2 class="news-title">
                    ${safeTitle}
                </h2>

                <p class="news-preview">
                    ${safePreview}
                </p>

                <div class="news-meta">

                    <span class="news-author">
                        投稿者：
                        ${safeAuthor}
                    </span>

                </div>

            </div>


            ${
                hasImage
                    ? `
                        <div class="news-image-wrap">
                            <img
                                src="${escapeHtml(newsItem.image_url)}"
                                alt=""
                                class="news-image"
                                loading="lazy"
                            >
                        </div>
                    `
                    : ""
            }


            <a
                href="${escapeHtml(detailsUrl)}"
                class="news-link"
            >
                詳細を見る
                <span aria-hidden="true">
                    →
                </span>
            </a>

        `;


        return article;

    }


    /* =====================================
       LOAD NEWS
    ====================================== */

    async function loadNews() {

        if (!window.supabaseClient) {

            console.error(
                "NEWS: Supabase client がありません。"
            );

            showError();

            return;
        }


        try {

            const {
                data: newsItems,
                error: newsError
            } =
                await window.supabaseClient
                    .from("news")
                    .select(`
                        id,
                        author_id,
                        title,
                        content,
                        image_url,
                        published_at,
                        created_at
                    `)
                    .order(
                        "published_at",
                        {
                            ascending: false
                        }
                    );


            if (newsError) {
                throw newsError;
            }


            const items =
                newsItems || [];


            if (items.length === 0) {

                showEmpty();

                return;
            }


            const authorIds =
                [
                    ...new Set(
                        items
                            .map(
                                item =>
                                    item.author_id
                            )
                            .filter(Boolean)
                    )
                ];


            let profilesMap =
                new Map();


            if (authorIds.length > 0) {

                const {
                    data: profiles,
                    error: profilesError
                } =
                    await window.supabaseClient
                        .from("profiles")
                        .select(`
                            id,
                            activity_name
                        `)
                        .in(
                            "id",
                            authorIds
                        );


                if (profilesError) {

                    console.warn(
                        "NEWS: 投稿者情報取得失敗",
                        profilesError
                    );

                } else {

                    profilesMap =
                        new Map(
                            (profiles || [])
                                .map(
                                    profile => [
                                        profile.id,
                                        profile
                                    ]
                                )
                        );

                }

            }


            const mergedItems =
                items.map(
                    item => ({
                        ...item,
                        author:
                            profilesMap.get(
                                item.author_id
                            )
                            || null
                    })
                );


            renderNews(
                mergedItems
            );

        } catch (error) {

            console.error(
                "NEWS: 読み込み失敗",
                error
            );

            showError();

        }

    }


    /* =====================================
       RENDER
    ====================================== */

    function renderNews(items) {

        loadingElement.hidden =
            true;

        errorElement.hidden =
            true;

        emptyElement.hidden =
            true;

        listElement.hidden =
            false;

        listElement.innerHTML =
            "";


        items.forEach(
            item => {

                const element =
                    createNewsItem(item);

                listElement.appendChild(
                    element
                );

            }
        );

    }


    /* =====================================
       EMPTY
    ====================================== */

    function showEmpty() {

        loadingElement.hidden =
            true;

        errorElement.hidden =
            true;

        listElement.hidden =
            true;

        emptyElement.hidden =
            false;

    }


    /* =====================================
       ERROR
    ====================================== */

    function showError() {

        loadingElement.hidden =
            true;

        emptyElement.hidden =
            true;

        listElement.hidden =
            true;

        errorElement.hidden =
            false;

    }


    /* =====================================
       INIT
    ====================================== */

    async function initializeNewsPage() {

        console.log(
            "MFDCO NEWS: 初期化開始"
        );


        await Promise.all([
            loadNews(),
            checkPermanentMember()
        ]);


        console.log(
            "MFDCO NEWS: 初期化完了"
        );

    }


    if (
        document.readyState === "loading"
    ) {

        document.addEventListener(
            "DOMContentLoaded",
            initializeNewsPage
        );

    } else {

        initializeNewsPage();

    }


    console.log(
        "MFDCO news.js loaded successfully."
    );

})();