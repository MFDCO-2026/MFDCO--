/* =========================================
   MFDCO COMMON HEADER
========================================= */

"use strict";


let mfdcoHeaderInitialized =
    false;


/* =========================================
   LOAD HEADER
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const container =
            document.getElementById(
                "header-container"
            );


        if (!container) {

            console.log(
                "HEADER: header-container がありません。"
            );

            return;

        }


        try {

            const response =
                await fetch(
                    "header.html"
                );


            if (!response.ok) {

                throw new Error(
                    `header.html の取得に失敗しました: ${response.status}`
                );

            }


            const html =
                await response.text();


            container.innerHTML =
                html;


            console.log(
                "HEADER: header.html 読み込み完了"
            );


            initializeHeader();


        } catch (error) {

            console.error(
                "HEADER LOAD ERROR:",
                error
            );

        }

    }
);


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(text) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            text ?? ""
        );


    return div.innerHTML;

}


/* =========================================
   DEFAULT ICON
========================================= */

function getDefaultIcon() {

    return "assets/default-icon.png";

}


/* =========================================
   SUPABASE CHECK
========================================= */

function isHeaderSupabaseReady() {

    if (
        typeof window.supabaseClient ===
        "undefined"
    ) {

        console.error(
            "HEADER ERROR: supabaseClient がありません。"
        );

        return false;

    }


    return true;

}


/* =========================================
   ELEMENTS
========================================= */

function getHeaderElements() {

    return {

        header:
            document.querySelector(
                ".site-header"
            ),

        memberLink:
            document.querySelector(
                "#header-member-link"
            ),

        menuButton:
            document.querySelector(
                ".menu-button"
            ),

        navigation:
            document.querySelector(
                ".main-nav"
            )

    };

}


/* =========================================
   LOGGED OUT
========================================= */

function showLoggedOutHeader() {

    const elements =
        getHeaderElements();


    if (
        !elements.memberLink
    ) {
        return;
    }


    elements.memberLink.href =
        "join.html";


    elements.memberLink.classList.remove(
        "header-member-profile",
        "header-loading",
        "logged-in"
    );


    elements.memberLink.classList.add(
        "header-join"
    );


    elements.memberLink.innerHTML = `
        <span class="header-login-text">
            参加 / ログイン
        </span>
    `;

}


/* =========================================
   LOADING
========================================= */

function showHeaderLoading() {

    const elements =
        getHeaderElements();


    if (
        !elements.memberLink
    ) {
        return;
    }


    elements.memberLink.href =
        "join.html";


    elements.memberLink.classList.remove(
        "header-member-profile"
    );


    elements.memberLink.classList.add(
        "header-join",
        "header-loading"
    );


    elements.memberLink.innerHTML = `
        <span class="header-login-text">
            読み込み中...
        </span>
    `;

}


/* =========================================
   LOGGED IN
========================================= */

function showLoggedInHeader(
    profile,
    user
) {

    const elements =
        getHeaderElements();


    if (
        !elements.memberLink
    ) {
        return;
    }


    const name =
        profile?.activity_name ||
        "MFDCO Member";


    const icon =
        profile?.icon_url ||
        getDefaultIcon();


    elements.memberLink.href =
        "mypage.html";


    elements.memberLink.classList.remove(
        "header-join",
        "header-loading"
    );


    elements.memberLink.classList.add(
        "header-member-profile",
        "logged-in"
    );


    elements.memberLink.innerHTML = `
        <img
            src="${escapeHtml(icon)}"
            alt=""
            class="header-member-icon"
        >

        <span class="header-member-name">
            ${escapeHtml(name)}
        </span>
    `;


    console.log(
        "HEADER DISPLAY:",
        {
            userId:
                user?.id || null,

            activityName:
                name,

            iconUrl:
                icon
        }
    );

}


/* =========================================
   UPDATE MEMBER
========================================= */

async function updateHeaderMember() {

    const elements =
        getHeaderElements();


    if (
        !elements.memberLink
    ) {

        return;

    }


    if (
        !isHeaderSupabaseReady()
    ) {

        showLoggedOutHeader();

        return;

    }


    showHeaderLoading();


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (error) {

            console.error(
                "HEADER AUTH ERROR:",
                error
            );


            showLoggedOutHeader();

            return;

        }


        const user =
            data?.user || null;


        if (!user) {

            showLoggedOutHeader();

            return;

        }


        const {
            data: profile,
            error: profileError
        } =
            await window.supabaseClient
                .from(
                    "profiles"
                )
                .select(
                    "activity_name, icon_url, status"
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (
            profileError
        ) {

            console.error(
                "HEADER PROFILE ERROR:",
                profileError
            );


            showLoggedInHeader(
                null,
                user
            );


            return;

        }


        showLoggedInHeader(
            profile,
            user
        );


    } catch (error) {

        console.error(
            "HEADER EXCEPTION:",
            error
        );


        showLoggedOutHeader();

    }

}


/* =========================================
   AUTH LISTENER
========================================= */

function setupHeaderAuthListener() {

    if (
        !isHeaderSupabaseReady()
    ) {
        return;
    }


    if (
        window.mfdcoHeaderAuthListener
    ) {
        return;
    }


    const {
        data
    } =
        window.supabaseClient
            .auth
            .onAuthStateChange(
                function (
                    event,
                    session
                ) {

                    console.log(
                        "HEADER AUTH EVENT:",
                        event
                    );


                    if (
                        event ===
                        "SIGNED_OUT"
                    ) {

                        showLoggedOutHeader();

                        return;

                    }


                    if (
                        event ===
                            "SIGNED_IN" ||
                        event ===
                            "INITIAL_SESSION" ||
                        event ===
                            "TOKEN_REFRESHED" ||
                        event ===
                            "USER_UPDATED"
                    ) {

                        setTimeout(
                            function () {

                                updateHeaderMember();

                            },
                            0
                        );

                    }

                }
            );


    window.mfdcoHeaderAuthListener =
        data.subscription;

}


/* =========================================
   MOBILE MENU
========================================= */

function setupMobileMenu() {

    const elements =
        getHeaderElements();


    if (
        !elements.menuButton ||
        !elements.navigation
    ) {
        return;
    }


    if (
        elements.menuButton
            .dataset
            .mfdcoMenuInitialized ===
        "true"
    ) {

        return;

    }


    elements.menuButton
        .dataset
        .mfdcoMenuInitialized =
        "true";


    elements.menuButton
        .addEventListener(
            "click",
            function () {

                const isOpen =
                    elements.navigation
                        .classList
                        .toggle(
                            "mobile-open"
                        );


                elements.menuButton
                    .classList
                    .toggle(
                        "active",
                        isOpen
                    );


                elements.menuButton
                    .setAttribute(
                        "aria-expanded",
                        String(isOpen)
                    );

            }
        );


    const links =
        elements.navigation
            .querySelectorAll(
                "a"
            );


    links.forEach(
        function (link) {

            link.addEventListener(
                "click",
                function () {

                    elements.navigation
                        .classList
                        .remove(
                            "mobile-open"
                        );


                    elements.menuButton
                        .classList
                        .remove(
                            "active"
                        );


                    elements.menuButton
                        .setAttribute(
                            "aria-expanded",
                            "false"
                        );

                }
            );

        }
    );

}


/* =========================================
   HEADER SCROLL
========================================= */

function setupHeaderScroll() {

    const elements =
        getHeaderElements();


    if (
        !elements.header
    ) {
        return;
    }


    if (
        elements.header
            .dataset
            .mfdcoScrollInitialized ===
        "true"
    ) {

        return;

    }


    elements.header
        .dataset
        .mfdcoScrollInitialized =
        "true";


    function updateScroll() {

        elements.header
            .classList
            .toggle(
                "scrolled",
                window.scrollY > 30
            );

    }


    window.addEventListener(
        "scroll",
        updateScroll,
        {
            passive: true
        }
    );


    updateScroll();

}


/* =========================================
   RESIZE
========================================= */

function setupHeaderResize() {

    const elements =
        getHeaderElements();


    if (
        !elements.menuButton ||
        !elements.navigation
    ) {
        return;
    }


    if (
        elements.navigation
            .dataset
            .mfdcoResizeInitialized ===
        "true"
    ) {

        return;

    }


    elements.navigation
        .dataset
        .mfdcoResizeInitialized =
        "true";


    window.addEventListener(
        "resize",
        function () {

            if (
                window.innerWidth >
                900
            ) {

                elements.navigation
                    .classList
                    .remove(
                        "mobile-open"
                    );


                elements.menuButton
                    .classList
                    .remove(
                        "active"
                    );


                elements.menuButton
                    .setAttribute(
                        "aria-expanded",
                        "false"
                    );

            }

        }
    );

}


/* =========================================
   INITIALIZE
========================================= */

function initializeHeader() {

    if (
        mfdcoHeaderInitialized
    ) {
        return;
    }


    if (
        !document.querySelector(
            ".site-header"
        )
    ) {
        return;
    }


    mfdcoHeaderInitialized =
        true;


    setupMobileMenu();

    setupHeaderScroll();

    setupHeaderResize();

    setupHeaderAuthListener();

    updateHeaderMember();


    console.log(
        "MFDCO HEADER: 初期化完了"
    );

}


/* =========================================
   PUBLIC
========================================= */

window.initializeHeader =
    initializeHeader;


window.updateHeaderMember =
    updateHeaderMember;


console.log(
    "MFDCO header.js loaded successfully."
);