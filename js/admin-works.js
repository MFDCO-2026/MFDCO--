"use strict";


/* =========================================
   STATE
========================================= */

let adminWorks = [];

let currentStatusFilter = "pending";


/* =========================================
   ELEMENTS
========================================= */

const elements = {};


/* =========================================
   DOM READY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        cacheElements();

        setupEvents();

        await initializeAdminPage();

    }
);


/* =========================================
   CACHE
========================================= */

function cacheElements() {

    elements.loading =
        document.getElementById(
            "admin-loading"
        );

    elements.denied =
        document.getElementById(
            "admin-denied"
        );

    elements.content =
        document.getElementById(
            "admin-content"
        );

    elements.error =
        document.getElementById(
            "admin-error"
        );

    elements.worksLoading =
        document.getElementById(
            "works-loading"
        );

    elements.empty =
        document.getElementById(
            "works-empty"
        );

    elements.list =
        document.getElementById(
            "works-list"
        );

    elements.statusFilter =
        document.getElementById(
            "status-filter"
        );

    elements.reloadButton =
        document.getElementById(
            "reload-button"
        );

    elements.countPending =
        document.getElementById(
            "count-pending"
        );

    elements.countApproved =
        document.getElementById(
            "count-approved"
        );

    elements.countRejected =
        document.getElementById(
            "count-rejected"
        );

}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    elements.statusFilter?.addEventListener(
        "change",
        function () {

            currentStatusFilter =
                elements.statusFilter.value;

            renderWorks();

        }
    );


    elements.reloadButton?.addEventListener(
        "click",
        async function () {

            await loadWorks();

        }
    );

}


/* =========================================
   INITIALIZE
========================================= */

async function initializeAdminPage() {

    try {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabase client が初期化されていません。"
            );

        }


        const {
            data,
            error
        } =
            await window.supabaseClient.auth.getUser();


        if (error) {

            throw error;

        }


        const user =
            data?.user;


        if (!user) {

            showDenied();

            return;

        }


        /*
         * まず全作品SELECTを試します。
         *
         * 管理者には
         * "Admins can view all works"
         * RLSがある前提です。
         */

        const {
            data: works,
            error: worksError
        } =
            await window.supabaseClient
                .from("works")
                .select(`
                    id,
                    user_id,
                    title,
                    description,
                    image_url,
                    tags,
                    status,
                    admin_note,
                    created_at,
                    updated_at,
                    submission_type,
                    original_filename,
                    file_type
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (worksError) {

            console.error(
                "ADMIN ACCESS ERROR:",
                worksError
            );

            showDenied();

            return;

        }


        adminWorks =
            Array.isArray(works)
                ? works
                : [];


        /*
         * RLSでは、権限がないSELECTが
         * エラーではなく0件になる構成もあります。
         *
         * そのため後述のRPCが使える場合は
         * RPC方式の方がより確実です。
         */


        showAdmin();


        await attachAuthorProfiles();


        renderSummary();

        renderWorks();


        console.log(
            "MFDCO ADMIN: initialized"
        );

    }
    catch (error) {

        console.error(
            "ADMIN INIT ERROR:",
            error
        );

        showError(
            error.message ||
            "管理画面の初期化に失敗しました。"
        );

        showDenied();

    }

}


/* =========================================
   LOAD WORKS
========================================= */

async function loadWorks() {

    setWorksLoading(true);

    hideError();


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("works")
                .select(`
                    id,
                    user_id,
                    title,
                    description,
                    image_url,
                    tags,
                    status,
                    admin_note,
                    created_at,
                    updated_at,
                    submission_type,
                    original_filename,
                    file_type
                `)
                .order(
                    "created_at",
                    {
                        ascending: false
                    }
                );


        if (error) {

            throw error;

        }


        adminWorks =
            Array.isArray(data)
                ? data
                : [];


        await attachAuthorProfiles();


        renderSummary();

        renderWorks();

    }
    catch (error) {

        console.error(
            "ADMIN LOAD ERROR:",
            error
        );

        showError(
            error.message ||
            "作品一覧の取得に失敗しました。"
        );

    }
    finally {

        setWorksLoading(false);

    }

}


/* =========================================
   AUTHORS
========================================= */

async function attachAuthorProfiles() {

    if (!adminWorks.length) {

        return;

    }


    const userIds =
        [
            ...new Set(
                adminWorks
                    .map(
                        function (work) {
                            return work.user_id;
                        }
                    )
                    .filter(Boolean)
            )
        ];


    if (!userIds.length) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("profiles")
                .select(
                    "id, activity_name"
                )
                .in(
                    "id",
                    userIds
                );


        if (error) {

            console.warn(
                "ADMIN PROFILE LOAD:",
                error
            );

            return;

        }


        const profileMap =
            new Map();


        for (
            const profile
            of data || []
        ) {

            profileMap.set(
                profile.id,
                profile
            );

        }


        adminWorks =
            adminWorks.map(
                function (work) {

                    return {
                        ...work,

                        author:
                            profileMap.get(
                                work.user_id
                            ) || null
                    };

                }
            );

    }
    catch (error) {

        console.warn(
            "ADMIN PROFILE ERROR:",
            error
        );

    }

}


/* =========================================
   SUMMARY
========================================= */

function renderSummary() {

    const pending =
        adminWorks.filter(
            work =>
                work.status ===
                "pending"
        ).length;


    const approved =
        adminWorks.filter(
            work =>
                work.status ===
                "approved"
        ).length;


    const rejected =
        adminWorks.filter(
            work =>
                work.status ===
                "rejected"
        ).length;


    if (elements.countPending) {

        elements.countPending.textContent =
            String(pending);

    }


    if (elements.countApproved) {

        elements.countApproved.textContent =
            String(approved);

    }


    if (elements.countRejected) {

        elements.countRejected.textContent =
            String(rejected);

    }

}


/* =========================================
   RENDER
========================================= */

function renderWorks() {

    if (!elements.list) {

        return;

    }


    elements.list.innerHTML = "";


    let works =
        [...adminWorks];


    if (
        currentStatusFilter !==
        "all"
    ) {

        works =
            works.filter(
                function (work) {

                    return (
                        work.status ===
                        currentStatusFilter
                    );

                }
            );

    }


    if (!works.length) {

        if (elements.empty) {

            elements.empty.hidden =
                false;

        }

        return;

    }


    if (elements.empty) {

        elements.empty.hidden =
            true;

    }


    for (
        const work
        of works
    ) {

        elements.list.appendChild(
            createWorkCard(work)
        );

    }

}


/* =========================================
   CARD
========================================= */

function createWorkCard(work) {

    const article =
        document.createElement(
            "article"
        );


    article.className =
        "admin-work-card";


    /* IMAGE */

    const imageArea =
        document.createElement(
            "div"
        );


    imageArea.className =
        "admin-work-image";


    if (work.image_url) {

        const image =
            document.createElement(
                "img"
            );


        image.src =
            work.image_url;


        image.alt =
            work.title || "作品画像";


        image.addEventListener(
            "error",
            function () {

                image.remove();

                showImagePlaceholder(
                    imageArea
                );

            },
            {
                once: true
            }
        );


        imageArea.appendChild(
            image
        );

    }
    else {

        showImagePlaceholder(
            imageArea
        );

    }


    /* MAIN */

    const main =
        document.createElement(
            "div"
        );


    main.className =
        "admin-work-main";


    const status =
        document.createElement(
            "span"
        );


    status.className =
        "admin-work-status " +
        getStatusClass(
            work.status
        );


    status.textContent =
        getStatusLabel(
            work.status
        );


    const title =
        document.createElement(
            "h2"
        );


    title.className =
        "admin-work-title";


    title.textContent =
        work.title ||
        "無題";


    const meta =
        document.createElement(
            "div"
        );


    meta.className =
        "admin-work-meta";


    const author =
        document.createElement(
            "span"
        );


    author.textContent =
        "作者：" +
        (
            work.author?.activity_name ||
            "不明"
        );


    const date =
        document.createElement(
            "span"
        );


    date.textContent =
        "投稿：" +
        formatDate(
            work.created_at
        );


    const type =
        document.createElement(
            "span"
        );


    type.textContent =
        "提出：" +
        (
            work.submission_type ===
            "url"
                ? "外部URL"
                : "直接ファイル"
        );


    meta.append(
        author,
        date,
        type
    );


    main.append(
        status,
        title,
        meta
    );


    /* ACTION */

    const actions =
        document.createElement(
            "div"
        );


    actions.className =
        "admin-work-actions";


    const detail =
        document.createElement(
            "a"
        );


    detail.className =
        "admin-button";


    detail.href =
        "admin-work.html?id=" +
        encodeURIComponent(
            work.id
        );


    detail.textContent =
        "審査する";


    actions.appendChild(
        detail
    );


    article.append(
        imageArea,
        main,
        actions
    );


    return article;

}


/* =========================================
   IMAGE PLACEHOLDER
========================================= */

function showImagePlaceholder(
    container
) {

    container.innerHTML = "";


    const placeholder =
        document.createElement(
            "div"
        );


    placeholder.className =
        "admin-work-image-placeholder";


    placeholder.textContent =
        "NO IMAGE";


    container.appendChild(
        placeholder
    );

}


/* =========================================
   STATUS
========================================= */

function getStatusLabel(status) {

    switch (status) {

        case "approved":
            return "公開中";

        case "rejected":
            return "差し戻し";

        case "pending":
            return "審査待ち";

        default:
            return status || "不明";

    }

}


function getStatusClass(status) {

    switch (status) {

        case "approved":
            return "status-approved";

        case "rejected":
            return "status-rejected";

        default:
            return "status-pending";

    }

}


/* =========================================
   DATE
========================================= */

function formatDate(value) {

    if (!value) {

        return "-";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        }
    ).format(date);

}


/* =========================================
   UI
========================================= */

function showAdmin() {

    if (elements.loading) {

        elements.loading.hidden =
            true;

    }


    if (elements.denied) {

        elements.denied.hidden =
            true;

    }


    if (elements.content) {

        elements.content.hidden =
            false;

    }

}


function showDenied() {

    if (elements.loading) {

        elements.loading.hidden =
            true;

    }


    if (elements.content) {

        elements.content.hidden =
            true;

    }


    if (elements.denied) {

        elements.denied.hidden =
            false;

    }

}


function setWorksLoading(value) {

    if (elements.worksLoading) {

        elements.worksLoading.hidden =
            !value;

    }

}


function showError(message) {

    if (!elements.error) {

        return;

    }


    elements.error.textContent =
        message;


    elements.error.hidden =
        false;

}


function hideError() {

    if (elements.error) {

        elements.error.hidden =
            true;

    }

}


console.log(
    "MFDCO admin-works.js loaded successfully."
);