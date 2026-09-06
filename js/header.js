/* =========================================
   MFDCO HEADER
   Navigation / Authentication / Discord
========================================= */

"use strict";


/* =========================================
   DISCORD SETTINGS
========================================= */

const MFDCO_DISCORD_INVITE_URL =
    "https://discord.gg/rhnJyuWnV";



/* =========================================
   GLOBAL STATE
========================================= */

let mfdcoHeaderAuthListenerRegistered =
    false;


let mfdcoHeaderCurrentUser =
    null;



/* =========================================
   LOAD HEADER HTML
========================================= */

async function loadHeaderHtmlIfNeeded() {

    const container =
        document.getElementById(
            "header-container"
        );


    if (!container) {
        return false;
    }


    if (
        container.querySelector(
            ".site-header"
        )
    ) {
        return true;
    }


    try {

        const response =
            await fetch(
                "header.html"
            );


        if (!response.ok) {

            throw new Error(
                "header.html HTTP " +
                response.status
            );

        }


        const html =
            await response.text();


        container.innerHTML =
            html;


        console.log(
            "HEADER: header.html 読み込み完了"
        );


        return true;

    }
    catch (error) {

        console.error(
            "HEADER: header.html 読み込み失敗",
            error
        );


        return false;

    }

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

        navigation:
            document.getElementById(
                "main-navigation"
            ),

        menuButton:
            document.querySelector(
                ".menu-button"
            ),

        memberLink:
            document.getElementById(
                "header-member-link"
            ),

        loginText:
            document.getElementById(
                "header-login-text"
            ),

        userIconWrap:
            document.getElementById(
                "header-user-icon-wrap"
            ),

        userIcon:
            document.getElementById(
                "header-user-icon"
            ),

        discordLink:
            document.getElementById(
                "header-discord-link"
            )

    };

}



/* =========================================
   MOBILE MENU
========================================= */

function setupMobileMenu() {

    const {
        navigation,
        menuButton
    } =
        getHeaderElements();


    if (
        !navigation ||
        !menuButton
    ) {
        return;
    }


    if (
        menuButton.dataset
            .mfdcoMenuInitialized ===
        "true"
    ) {
        return;
    }


    menuButton.dataset
        .mfdcoMenuInitialized =
        "true";


    menuButton.addEventListener(
        "click",
        function () {

            const opened =
                navigation.classList.toggle(
                    "mobile-open"
                );


            menuButton.classList.toggle(
                "active",
                opened
            );


            menuButton.setAttribute(
                "aria-expanded",
                opened
                    ? "true"
                    : "false"
            );


            menuButton.setAttribute(
                "aria-label",
                opened
                    ? "メニューを閉じる"
                    : "メニューを開く"
            );

        }
    );


    navigation
        .querySelectorAll("a")
        .forEach(
            function (link) {

                if (
                    link.dataset
                        .mfdcoMenuCloseInitialized ===
                    "true"
                ) {
                    return;
                }


                link.dataset
                    .mfdcoMenuCloseInitialized =
                    "true";


                link.addEventListener(
                    "click",
                    function () {

                        navigation.classList.remove(
                            "mobile-open"
                        );


                        menuButton.classList.remove(
                            "active"
                        );


                        menuButton.setAttribute(
                            "aria-expanded",
                            "false"
                        );


                        menuButton.setAttribute(
                            "aria-label",
                            "メニューを開く"
                        );

                    }
                );

            }
        );

}



/* =========================================
   SAFE IMAGE URL
========================================= */

function isSafeHeaderImageUrl(
    value
) {

    if (!value) {
        return false;
    }


    try {

        const url =
            new URL(
                value,
                window.location.href
            );


        return (
            url.protocol === "https:" ||
            url.protocol === "http:"
        );

    }
    catch {

        return false;

    }

}



/* =========================================
   LOGGED OUT
========================================= */

function showLoggedOutHeader() {

    const {
        memberLink,
        loginText,
        userIconWrap,
        userIcon,
        discordLink
    } =
        getHeaderElements();


    mfdcoHeaderCurrentUser =
        null;


    if (memberLink) {

        memberLink.href =
            "join.html";

    }


    if (loginText) {

        loginText.textContent =
            "参加 / ログイン";

    }


    if (userIconWrap) {

        userIconWrap.hidden =
            true;

    }


    if (userIcon) {

        userIcon.removeAttribute(
            "src"
        );


        userIcon.alt =
            "";

    }


    if (discordLink) {

        discordLink.hidden =
            true;


        discordLink.removeAttribute(
            "href"
        );

    }


    console.log(
        "HEADER DISPLAY:",
        {
            loggedIn: false,
            discord: false
        }
    );

}



/* =========================================
   LOGGED IN
========================================= */

function showLoggedInHeader(
    user,
    profile
) {

    const {
        memberLink,
        loginText,
        userIconWrap,
        userIcon,
        discordLink
    } =
        getHeaderElements();


    mfdcoHeaderCurrentUser =
        user;


    const activityName =
        String(
            profile?.activity_name ||
            user?.email?.split("@")[0] ||
            "マイページ"
        ).trim();



    /* =====================================
       USER
    ====================================== */

    if (memberLink) {

        memberLink.href =
            "mypage.html";


        /*
         * ログイン時のユーザー表示
         */

        memberLink.classList.remove(
            "header-join"
        );


        memberLink.classList.add(
            "header-member-profile"
        );

    }


    if (loginText) {

        loginText.textContent =
            activityName;


        loginText.classList.add(
            "header-member-name"
        );

    }



    /* =====================================
       USER ICON
    ====================================== */

    const iconUrl =
        String(
            profile?.icon_url ||
            ""
        ).trim();


    if (
        userIcon &&
        userIconWrap &&
        isSafeHeaderImageUrl(
            iconUrl
        )
    ) {

        userIcon.src =
            iconUrl;


        userIcon.alt =
            activityName;


        userIcon.classList.add(
            "header-member-icon"
        );


        userIconWrap.hidden =
            false;


        userIcon.onerror =
            function () {

                userIcon.removeAttribute(
                    "src"
                );


                userIconWrap.hidden =
                    true;

            };

    }
    else {

        if (userIcon) {

            userIcon.removeAttribute(
                "src"
            );

        }


        if (userIconWrap) {

            userIconWrap.hidden =
                true;

        }

    }



    /* =====================================
       DISCORD
    ====================================== */

    if (discordLink) {

        discordLink.href =
            MFDCO_DISCORD_INVITE_URL;


        discordLink.hidden =
            false;

    }


    console.log(
        "HEADER DISPLAY:",
        {
            loggedIn: true,
            userId: user?.id,
            activityName: activityName,
            discord: true
        }
    );

}



/* =========================================
   LOAD PROFILE
========================================= */

async function loadHeaderProfile(
    user
) {

    if (
        !user ||
        !window.supabaseClient
    ) {
        return null;
    }


    try {

        const {
            data: profile,
            error
        } =
            await window.supabaseClient
                .from("profiles")
                .select(`
                    id,
                    activity_name,
                    icon_url,
                    status,
                    permanent_member,
                    admin
                `)
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "HEADER PROFILE ERROR:",
                error
            );


            return null;

        }


        return profile || null;

    }
    catch (error) {

        console.error(
            "HEADER PROFILE LOAD ERROR:",
            error
        );


        return null;

    }

}



/* =========================================
   UPDATE HEADER AUTH DISPLAY
========================================= */

async function updateHeaderAuthDisplay(
    user
) {

    if (!user) {

        showLoggedOutHeader();

        return;

    }


    const profile =
        await loadHeaderProfile(
            user
        );


    showLoggedInHeader(
        user,
        profile
    );

}



/* =========================================
   INITIAL SESSION
========================================= */

async function loadInitialHeaderSession() {

    if (!window.supabaseClient) {

        console.warn(
            "HEADER: Supabase client がありません。"
        );


        showLoggedOutHeader();

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getSession();


        if (error) {
            throw error;
        }


        const user =
            data?.session?.user ||
            null;


        await updateHeaderAuthDisplay(
            user
        );

    }
    catch (error) {

        console.error(
            "HEADER SESSION ERROR:",
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
        mfdcoHeaderAuthListenerRegistered
    ) {
        return;
    }


    if (!window.supabaseClient) {
        return;
    }


    mfdcoHeaderAuthListenerRegistered =
        true;


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


                setTimeout(
                    function () {

                        updateHeaderAuthDisplay(
                            session?.user ||
                            null
                        );

                    },
                    0
                );

            }
        );

}



/* =========================================
   ACTIVE NAVIGATION
========================================= */

function setupActiveNavigation() {

    const navigation =
        document.getElementById(
            "main-navigation"
        );


    if (!navigation) {
        return;
    }


    let currentFile =
        window.location.pathname
            .split("/")
            .pop();


    if (!currentFile) {

        currentFile =
            "index.html";

    }


    navigation
        .querySelectorAll(
            "a[href]"
        )
        .forEach(
            function (link) {

                const href =
                    link.getAttribute(
                        "href"
                    );


                if (
                    !href ||
                    href.startsWith("http") ||
                    href === "#"
                ) {
                    return;
                }


                const targetFile =
                    href
                        .split("?")[0]
                        .split("#")[0]
                        .split("/")
                        .pop();


                if (
                    targetFile ===
                    currentFile
                ) {

                    link.classList.add(
                        "active"
                    );

                }

            }
        );

}



/* =========================================
   INITIALIZE HEADER
========================================= */

async function initializeHeader() {

    const header =
        document.querySelector(
            ".site-header"
        );


    if (!header) {
        return;
    }


    setupMobileMenu();


    setupActiveNavigation();


    const discordLink =
        document.getElementById(
            "header-discord-link"
        );


    /*
     * 認証完了までは表示しない
     */

    if (
        discordLink &&
        !mfdcoHeaderCurrentUser
    ) {

        discordLink.hidden =
            true;

    }


    await loadInitialHeaderSession();


    setupHeaderAuthListener();


    console.log(
        "MFDCO HEADER: 初期化完了"
    );

}



/* =========================================
   EXPOSE
========================================= */

window.initializeHeader =
    initializeHeader;



/* =========================================
   START
========================================= */

async function startHeader() {

    const loaded =
        await loadHeaderHtmlIfNeeded();


    if (!loaded) {
        return;
    }


    await initializeHeader();

}



/* =========================================
   DOM READY
========================================= */

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        startHeader,
        {
            once: true
        }
    );

}
else {

    startHeader();

}



/* =========================================
   LOG
========================================= */

console.log(
    "MFDCO header.js loaded successfully."
);