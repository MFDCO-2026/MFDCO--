/* =========================================
   MFDCO MAIN JAVASCRIPT
   Common HTML / Hero / Top Works
   ========================================= */

"use strict";


/* =========================================
   LOAD HTML
   ========================================= */

async function loadHtmlInto(
    selector,
    file
) {

    const container =
        document.querySelector(
            selector
        );


    if (!container) {

        return false;

    }


    try {

        const response =
            await fetch(
                file
            );


        if (!response.ok) {

            throw new Error(
                file +
                " の読み込みに失敗しました。HTTP " +
                response.status
            );

        }


        const html =
            await response.text();


        container.innerHTML =
            html;


        return true;

    }
    catch (error) {

        console.error(
            file +
            " loading error:",
            error
        );


        return false;

    }

}



/* =========================================
   LOAD HEADER
   ========================================= */

async function loadHeader() {

    const loaded =
        await loadHtmlInto(
            "#header-container",
            "header.html"
        );


    if (!loaded) {

        return;

    }


    /*
     * header.htmlがDOMに入った後で
     * header.jsを初期化
     */

    if (
        typeof window.initializeHeader ===
        "function"
    ) {

        window.initializeHeader();

    }
    else {

        console.warn(
            "initializeHeader() が見つかりません。"
        );

    }

}



/* =========================================
   LOAD FOOTER
   ========================================= */

async function loadFooter() {

    await loadHtmlInto(
        "#footer-container",
        "footer.html"
    );

}



/* =========================================
   HERO VIDEO
   ========================================= */

function initializeHeroVideo() {

    const heroVideo =
        document.querySelector(
            ".hero-video"
        );


    if (!heroVideo) {

        return;

    }


    /*
     * videoが存在する場合だけ再生
     */

    const playPromise =
        heroVideo.play();


    if (
        playPromise &&
        typeof playPromise.catch ===
            "function"
    ) {

        playPromise.catch(
            function () {

                console.log(
                    "Autoplay was blocked by the browser."
                );

            }
        );

    }

}



/* =========================================
   TOP WORKS
   ========================================= */

async function loadTopWorks() {

    const grid =
        document.getElementById(
            "top-works-grid"
        );


    const errorBox =
        document.getElementById(
            "top-works-error"
        );


    if (!grid) {

        return;

    }


    /*
     * Supabaseが使えない場合
     */

    if (!window.supabaseClient) {

        console.error(
            "MFDCO TOP WORKS: Supabase client がありません。"
        );


        showTopWorksError(
            grid,
            errorBox,
            "作品を読み込めませんでした。"
        );


        return;

    }


    try {

        /*
         * 公開中の作品を
         * 新しい順に最大3件取得
         */

        const {
            data: works,
            error: worksError
        } =
            await window.supabaseClient
                .from(
                    "works"
                )
                .select(
                    `
                    id,
                    user_id,
                    title,
                    image_url,
                    created_at
                    `
                )
                .eq(
                    "status",
                    "approved"
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            false
                    }
                )
                .limit(
                    3
                );


        if (worksError) {

            throw worksError;

        }


        const workList =
            Array.isArray(
                works
            )
                ? works
                : [];


        /*
         * 公開作品がまだない場合
         */

        if (
            workList.length ===
            0
        ) {

            grid.innerHTML =
                "";


            const empty =
                document.createElement(
                    "div"
                );


            empty.className =
                "top-works-message";


            empty.textContent =
                "現在公開中の作品はありません。";


            grid.appendChild(
                empty
            );


            return;

        }



        /* =====================================
           AUTHOR IDS
        ===================================== */

        const userIds =
            [
                ...new Set(
                    workList
                        .map(
                            function (
                                work
                            ) {

                                return work.user_id;

                            }
                        )
                        .filter(
                            Boolean
                        )
                )
            ];



        /* =====================================
           LOAD PROFILES
        ===================================== */

        const profileMap =
            new Map();


        if (
            userIds.length >
            0
        ) {

            const {
                data: profiles,
                error: profilesError
            } =
                await window.supabaseClient
                    .from(
                        "profiles"
                    )
                    .select(
                        `
                        id,
                        activity_name
                        `
                    )
                    .in(
                        "id",
                        userIds
                    );


            /*
             * プロフィール取得に失敗しても
             * 作品自体は表示する
             */

            if (profilesError) {

                console.warn(
                    "MFDCO TOP WORKS PROFILE ERROR:",
                    profilesError
                );

            }
            else {

                const profileList =
                    Array.isArray(
                        profiles
                    )
                        ? profiles
                        : [];


                profileList.forEach(
                    function (
                        profile
                    ) {

                        profileMap.set(
                            profile.id,
                            profile
                        );

                    }
                );

            }

        }



        /* =====================================
           RENDER
        ===================================== */

        renderTopWorks(
            grid,
            workList,
            profileMap
        );


        console.log(
            "MFDCO TOP WORKS:",
            workList.length +
            "件読み込み完了"
        );

    }
    catch (error) {

        console.error(
            "MFDCO TOP WORKS ERROR:",
            error
        );


        showTopWorksError(
            grid,
            errorBox,
            "提供作品の読み込みに失敗しました。"
        );

    }

}



/* =========================================
   RENDER TOP WORKS
   ========================================= */

function renderTopWorks(
    grid,
    works,
    profileMap
) {

    grid.innerHTML =
        "";


    works.forEach(
        function (
            work,
            index
        ) {

            const profile =
                profileMap.get(
                    work.user_id
                ) ||
                null;


            const authorName =
                String(
                    profile?.activity_name ||
                    "提供者"
                ).trim();


            const title =
                String(
                    work.title ||
                    "無題の作品"
                ).trim();


            const workNumber =
                String(
                    index + 1
                ).padStart(
                    3,
                    "0"
                );



            /* =================================
               CARD
            ================================= */

            const card =
                document.createElement(
                    "a"
                );


            card.className =
                "work-card";


            card.href =
                "work.html?id=" +
                encodeURIComponent(
                    work.id
                );



            /* =================================
               IMAGE AREA
            ================================= */

            const imageArea =
                document.createElement(
                    "div"
                );


            imageArea.className =
                "work-image";



            /* ---------------------------------
               PLACEHOLDER
            --------------------------------- */

            const placeholder =
                document.createElement(
                    "div"
                );


            placeholder.className =
                "top-work-image-placeholder";


            placeholder.textContent =
                "NO IMAGE";


            imageArea.appendChild(
                placeholder
            );



            /* ---------------------------------
               IMAGE
            --------------------------------- */

            const imageUrl =
                String(
                    work.image_url ||
                    ""
                ).trim();


            if (imageUrl) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    imageUrl;


                image.alt =
                    title;


                image.loading =
                    "lazy";


                image.addEventListener(
                    "error",
                    function () {

                        image.remove();

                    },
                    {
                        once:
                            true
                    }
                );


                imageArea.appendChild(
                    image
                );

            }



            /* ---------------------------------
               OVERLAY
            --------------------------------- */

            const overlay =
                document.createElement(
                    "div"
                );


            overlay.className =
                "work-overlay";


            const overlayText =
                document.createElement(
                    "span"
                );


            overlayText.textContent =
                "VIEW";


            overlay.appendChild(
                overlayText
            );


            imageArea.appendChild(
                overlay
            );



            /* =================================
               INFO
            ================================= */

            const info =
                document.createElement(
                    "div"
                );


            info.className =
                "work-info";



            /* ---------------------------------
               ID
            --------------------------------- */

            const idText =
                document.createElement(
                    "p"
                );


            idText.className =
                "work-id";


            idText.textContent =
                "MFDCO WORK " +
                workNumber;



            /* ---------------------------------
               TITLE
            --------------------------------- */

            const titleElement =
                document.createElement(
                    "h3"
                );


            titleElement.textContent =
                title;



            /* ---------------------------------
               AUTHOR
            --------------------------------- */

            const author =
                document.createElement(
                    "p"
                );


            author.className =
                "work-author";


            author.textContent =
                authorName;



            /* =================================
               APPEND
            ================================= */

            info.appendChild(
                idText
            );


            info.appendChild(
                titleElement
            );


            info.appendChild(
                author
            );


            card.appendChild(
                imageArea
            );


            card.appendChild(
                info
            );


            grid.appendChild(
                card
            );

        }
    );

}



/* =========================================
   TOP WORKS ERROR
   ========================================= */

function showTopWorksError(
    grid,
    errorBox,
    message
) {

    if (grid) {

        grid.innerHTML =
            "";

    }


    if (errorBox) {

        errorBox.textContent =
            message;


        errorBox.hidden =
            false;

    }

}



/* =========================================
   DOM READY
   ========================================= */

async function initializeMain() {

    console.log(
        "MFDCO MAIN: 初期化開始"
    );


    /*
     * header / footer
     */

    await Promise.all([

        loadHeader(),

        loadFooter()

    ]);


    /*
     * HERO
     */

    initializeHeroVideo();


    /*
     * TOP WORKS
     */

    await loadTopWorks();


    console.log(
        "MFDCO MAIN: 初期化完了"
    );

}



/* =========================================
   START
   ========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeMain,
        {
            once:
                true
        }
    );

}
else {

    initializeMain();

}



/* =========================================
   LOG
   ========================================= */

console.log(
    "MFDCO main.js loaded successfully."
);
