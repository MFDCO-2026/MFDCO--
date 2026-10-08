"use strict";


document.addEventListener(
    "DOMContentLoaded",
    async () => {


        /* =========================================
           DOM
        ========================================= */

        const searchInput =
            document.getElementById("search");

        const sortSelect =
            document.getElementById("sort");

        const tagFilters =
            document.getElementById("tag-filters");

        const clearFiltersButton =
            document.getElementById("clear-filters");

        const activeFilters =
            document.getElementById("active-filters");

        const activeFilterList =
            document.getElementById("active-filter-list");

        const worksCount =
            document.getElementById("works-count");

        const worksLoading =
            document.getElementById("works-loading");

        const worksError =
            document.getElementById("works-error");

        const worksErrorText =
            document.getElementById("works-error-text");

        const worksEmpty =
            document.getElementById("works-empty");

        const worksGrid =
            document.getElementById("works-grid");



        /* =========================================
           SUPABASE
        ========================================= */

        const supabase =
            window.supabaseClient;


        if (!supabase) {

            showError(
                "Supabaseへ接続できませんでした。"
            );

            return;

        }



        /* =========================================
           STATE
        ========================================= */

        let allWorks = [];

        let selectedTags =
            new Set();

        let searchKeyword = "";

        let currentSort =
            "newest";



        /* =========================================
           TAG FILTER
        ========================================= */

        renderTagFilters();



        /* =========================================
           LOAD
        ========================================= */

        await loadWorks();



        /* =========================================
           EVENTS
        ========================================= */

        if (searchInput) {

            searchInput.addEventListener(
                "input",
                () => {

                    searchKeyword =
                        searchInput.value
                            .trim()
                            .toLowerCase();

                    renderWorks();

                }
            );

        }


        if (sortSelect) {

            sortSelect.addEventListener(
                "change",
                () => {

                    currentSort =
                        sortSelect.value;

                    renderWorks();

                }
            );

        }


        if (clearFiltersButton) {

            clearFiltersButton.addEventListener(
                "click",
                () => {

                    selectedTags.clear();

                    document
                        .querySelectorAll(
                            ".tag-filter-button"
                        )
                        .forEach(button => {

                            button.classList.remove(
                                "active"
                            );

                        });

                    updateActiveFilters();

                    renderWorks();

                }
            );

        }



        /* =========================================
           LOAD WORKS
        ========================================= */

        async function loadWorks() {

            try {

                showLoading();


                const {
                    data,
                    error
                } = await supabase
                    .from("works")
                    .select(`
                        id,
                        title,
                        description,
                        image_url,
                        usage_terms,
                        tags,
                        work_url,
                        created_at,
                        user_id
                    `)
                    .eq(
                        "status",
                        "approved"
                    )
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


                if (error) {

                    console.error(
                        "作品取得エラー:",
                        error
                    );

                    throw new Error(
                        "作品データを取得できませんでした。"
                    );

                }


                allWorks =
                    await attachProfiles(
                        data || []
                    );


                renderWorks();

            } catch (error) {

                console.error(error);

                showError(
                    error.message
                );

            }

        }



        /* =========================================
           PROFILE
        ========================================= */

        async function attachProfiles(
            works
        ) {

            if (!works.length) {
                return [];
            }


            const userIds =
                [
                    ...new Set(
                        works
                            .map(
                                work =>
                                    work.user_id
                            )
                            .filter(Boolean)
                    )
                ];


            if (!userIds.length) {
                return works;
            }


            const {
                data: profiles,
                error
            } = await supabase
                .from("profiles")
                .select(`
                    id,
                    activity_name,
                    icon_url
                `)
                .in(
                    "id",
                    userIds
                );


            if (error) {

                console.warn(
                    "プロフィール取得エラー:",
                    error
                );

                return works;

            }


            const profileMap =
                new Map();


            for (
                const profile
                of profiles || []
            ) {

                profileMap.set(
                    profile.id,
                    profile
                );

            }


            return works.map(
                work => ({

                    ...work,

                    profile:
                        profileMap.get(
                            work.user_id
                        ) || null

                })
            );

        }



        /* =========================================
           TAG BUTTONS
        ========================================= */

        function renderTagFilters() {

            if (!tagFilters) {
                return;
            }


            tagFilters.innerHTML = "";


            if (
                typeof MFDCO_TAGS ===
                "undefined"
            ) {

                console.warn(
                    "MFDCO_TAGS がありません。"
                );

                return;

            }


            MFDCO_TAGS.forEach(
                tag => {

                    const button =
                        document.createElement(
                            "button"
                        );


                    button.type =
                        "button";

                    button.className =
                        "tag-filter-button";

                    button.textContent =
                        tag;


                    button.addEventListener(
                        "click",
                        () => {

                            if (
                                selectedTags.has(
                                    tag
                                )
                            ) {

                                selectedTags.delete(
                                    tag
                                );

                                button
                                    .classList
                                    .remove(
                                        "active"
                                    );

                            } else {

                                selectedTags.add(
                                    tag
                                );

                                button
                                    .classList
                                    .add(
                                        "active"
                                    );

                            }


                            updateActiveFilters();

                            renderWorks();

                        }
                    );


                    tagFilters.appendChild(
                        button
                    );

                }
            );

        }



        /* =========================================
           ACTIVE FILTERS
        ========================================= */

        function updateActiveFilters() {

            if (
                !activeFilters ||
                !activeFilterList
            ) {
                return;
            }


            activeFilterList.innerHTML =
                "";


            if (
                selectedTags.size === 0
            ) {

                activeFilters
                    .classList
                    .add(
                        "hidden"
                    );

                return;

            }


            activeFilters
                .classList
                .remove(
                    "hidden"
                );


            selectedTags.forEach(
                tag => {

                    const item =
                        document.createElement(
                            "button"
                        );


                    item.type =
                        "button";

                    item.className =
                        "active-filter-item";

                    item.textContent =
                        `${tag} ×`;


                    item.addEventListener(
                        "click",
                        () => {

                            selectedTags.delete(
                                tag
                            );


                            document
                                .querySelectorAll(
                                    ".tag-filter-button"
                                )
                                .forEach(
                                    button => {

                                        if (
                                            button.textContent ===
                                            tag
                                        ) {

                                            button
                                                .classList
                                                .remove(
                                                    "active"
                                                );

                                        }

                                    }
                                );


                            updateActiveFilters();

                            renderWorks();

                        }
                    );


                    activeFilterList
                        .appendChild(
                            item
                        );

                }
            );

        }



        /* =========================================
           RENDER
        ========================================= */

        function renderWorks() {

            hideMessages();


            let works =
                [...allWorks];



            /* =====================================
               SEARCH
            ====================================== */

            if (searchKeyword) {

                works =
                    works.filter(
                        work => {

                            const text = [

                                work.title,

                                work.description,

                                work.profile
                                    ?.activity_name,

                                ...(work.tags || [])

                            ]
                                .filter(Boolean)
                                .join(" ")
                                .toLowerCase();


                            return text.includes(
                                searchKeyword
                            );

                        }
                    );

            }



            /* =====================================
               TAG FILTER
            ====================================== */

            if (
                selectedTags.size > 0
            ) {

                works =
                    works.filter(
                        work => {

                            const tags =
                                work.tags || [];


                            return [
                                ...selectedTags
                            ].every(
                                tag =>
                                    tags.includes(
                                        tag
                                    )
                            );

                        }
                    );

            }



            /* =====================================
               SORT
            ====================================== */

            works.sort(
                (a, b) => {

                    switch (
                        currentSort
                    ) {

                        case "oldest":

                            return (
                                new Date(
                                    a.created_at
                                ) -
                                new Date(
                                    b.created_at
                                )
                            );


                        case "name-asc":

                            return (
                                a.title || ""
                            ).localeCompare(
                                b.title || "",
                                "ja"
                            );


                        case "name-desc":

                            return (
                                b.title || ""
                            ).localeCompare(
                                a.title || "",
                                "ja"
                            );


                        case "newest":
                        default:

                            return (
                                new Date(
                                    b.created_at
                                ) -
                                new Date(
                                    a.created_at
                                )
                            );

                    }

                }
            );



            /* =====================================
               COUNT
            ====================================== */

            if (worksCount) {

                worksCount.textContent =
                    `${works.length}作品`;

            }



            /* =====================================
               EMPTY
            ====================================== */

            if (!works.length) {

                if (worksEmpty) {

                    worksEmpty
                        .classList
                        .remove(
                            "hidden"
                        );

                }

                return;

            }



            /* =====================================
               CARDS
            ====================================== */

            worksGrid.innerHTML = "";


            works.forEach(
                work => {

                    worksGrid.appendChild(
                        createWorkCard(
                            work
                        )
                    );

                }
            );

        }



        /* =========================================
           CREATE CARD
        ========================================= */

        function createWorkCard(
            work
        ) {

            const article =
                document.createElement(
                    "article"
                );


            article.className =
                "work-card";


            article.tabIndex =
                0;



            /* IMAGE */

            const imageWrap =
                document.createElement(
                    "div"
                );


            imageWrap.className =
                "work-card-image-wrap";


            const image =
                document.createElement(
                    "img"
                );


            image.className =
                "work-card-image";


            image.src =
                work.image_url ||
                "assets/noimage.png";


            image.alt =
                `${work.title} のプレビュー画像`;


            image.loading =
                "lazy";


            image.addEventListener(
                "error",
                () => {

                    image.src =
                        "assets/noimage.png";

                },
                {
                    once: true
                }
            );


            imageWrap.appendChild(
                image
            );



            /* BODY */

            const body =
                document.createElement(
                    "div"
                );


            body.className =
                "work-card-body";



            /* TITLE */

            const title =
                document.createElement(
                    "h3"
                );


            title.className =
                "work-card-title";

            title.textContent =
                work.title;



            /* AUTHOR */

            const author =
                document.createElement(
                    "div"
                );


            author.className =
                "work-card-author";


            if (
                work.profile
                    ?.icon_url
            ) {

                const icon =
                    document.createElement(
                        "img"
                    );


                icon.src =
                    work.profile.icon_url;

                icon.alt = "";

                icon.className =
                    "work-card-author-icon";


                author.appendChild(
                    icon
                );

            }


            const authorName =
                document.createElement(
                    "span"
                );


            authorName.textContent =
                work.profile
                    ?.activity_name ||
                "MFDCO MEMBER";


            author.appendChild(
                authorName
            );



            /* DESCRIPTION */

            if (
                work.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.className =
                    "work-card-description";

                description.textContent =
                    work.description;


                body.appendChild(
                    title
                );

                body.appendChild(
                    author
                );

                body.appendChild(
                    description
                );

            } else {

                body.appendChild(
                    title
                );

                body.appendChild(
                    author
                );

            }



            /* TAGS */

            if (
                Array.isArray(
                    work.tags
                ) &&
                work.tags.length
            ) {

                const tags =
                    document.createElement(
                        "div"
                    );


                tags.className =
                    "work-card-tags";


                work.tags
                    .slice(
                        0,
                        5
                    )
                    .forEach(
                        tag => {

                            const item =
                                document.createElement(
                                    "span"
                                );


                            item.textContent =
                                tag;


                            tags.appendChild(
                                item
                            );

                        }
                    );


                body.appendChild(
                    tags
                );

            }



            /* DATE */

            const date =
                document.createElement(
                    "time"
                );


            date.className =
                "work-card-date";


            date.dateTime =
                work.created_at;


            date.textContent =
                formatDate(
                    work.created_at
                );


            body.appendChild(
                date
            );



            /* DETAIL */

            const detail =
                document.createElement(
                    "span"
                );


            detail.className =
                "work-card-detail";

            detail.textContent =
                "作品を見る →";


            body.appendChild(
                detail
            );



            /* COMPLETE */

            article.appendChild(
                imageWrap
            );

            article.appendChild(
                body
            );



            /* LINK */

            const openWork =
                () => {

                    window.location.href =
                        `work.html?id=${encodeURIComponent(
                            work.id
                        )}`;

                };


            article.addEventListener(
                "click",
                openWork
            );


            article.addEventListener(
                "keydown",
                event => {

                    if (
                        event.key ===
                            "Enter" ||
                        event.key ===
                            " "
                    ) {

                        event.preventDefault();

                        openWork();

                    }

                }
            );


            return article;

        }



        /* =========================================
           DATE
        ========================================= */

        function formatDate(
            value
        ) {

            if (!value) {
                return "";
            }


            const date =
                new Date(
                    value
                );


            return new Intl
                .DateTimeFormat(
                    "ja-JP",
                    {
                        year:
                            "numeric",

                        month:
                            "2-digit",

                        day:
                            "2-digit"
                    }
                )
                .format(
                    date
                );

        }



        /* =========================================
           UI
        ========================================= */

        function showLoading() {

            hideMessages();

            if (worksLoading) {

                worksLoading
                    .classList
                    .remove(
                        "hidden"
                    );

            }

        }


        function showError(
            message
        ) {

            hideMessages();


            if (worksErrorText) {

                worksErrorText.textContent =
                    message;

            }


            if (worksError) {

                worksError
                    .classList
                    .remove(
                        "hidden"
                    );

            }


            if (worksCount) {

                worksCount.textContent =
                    "取得失敗";

            }

        }


        function hideMessages() {

            if (worksLoading) {

                worksLoading
                    .classList
                    .add(
                        "hidden"
                    );

            }


            if (worksError) {

                worksError
                    .classList
                    .add(
                        "hidden"
                    );

            }


            if (worksEmpty) {

                worksEmpty
                    .classList
                    .add(
                        "hidden"
                    );

            }


            if (worksGrid) {

                worksGrid.innerHTML =
                    "";

            }

        }


    }
);