"use strict";


/* =========================================
   MFDCO HEADER
========================================= */


/* =========================================
   SETTINGS
========================================= */

const MFDCO_DISCORD_INVITE_URL =
    "https://discord.gg/rhnJyuWnV";


/* =========================================
   MENU DEFINITION
========================================= */

const MFDCO_HEADER_MENU = [

    {
        type: "link",
        label: "ホーム",
        href: "index.html"
    },


    {
        type: "group",
        title: "知る",

        items: [

            {
                label: "MFDCOとは",
                href: "about.html"
            },

            {
                label: "映像作品",
                href: "movies.html"
            },

            {
                label: "お知らせ",
                href: "news.html"
            },

            {
                label: "規約",
                href: "site.html"
            },

            {
                label: "プライバシーポリシー",
                href: "privacy.html"
            }

        ]
    },


    {
        type: "group",
        title: "利用する",

        items: [

            {
                label: "提供作品",
                href: "works.html"
            },

            {
                label: "ツールを利用",
                disabled: true,
                note: "追加予定"
            }

        ]
    },


    {
        type: "group",
        title: "参加する",

        items: [

            {
                label: "作品を提供",
                href: "submit-work.html",
                authOnly: true
            },

            {
                label: "加盟国一覧",
                href: "members.html"
            },

            {
                label: "独自テクスチャ",
                disabled: true,
                note: "追加予定"
            },

            {
                label: "制作依頼",
                disabled: true,
                note: "追加予定"
            },

            {
                label: "国家運営",
                disabled: true,
                note: "追加予定"
            },

            {
                label: "Discord",
                href: MFDCO_DISCORD_INVITE_URL,
                external: true,
                authOnly: true
            }

        ]
    },


    {
        type: "account",
        title: "アカウント"
    },


    {
        type: "group",
        title: "サポート",

        items: [

            {
                label: "フィードバック",
                disabled: true,
                note: "追加予定"
            }

        ]
    }

];



/* =========================================
   STATE
========================================= */

let mfdcoHeaderInitialized =
    false;

let mfdcoHeaderGlobalEventsRegistered =
    false;

let mfdcoHeaderAuthListenerRegistered =
    false;

let mfdcoHeaderScrollRegistered =
    false;

let mfdcoHeaderCurrentUser =
    null;

let mfdcoHeaderCurrentProfile =
    null;

let mfdcoHeaderMenuOpen =
    false;



/* =========================================
   LOAD HEADER HTML
========================================= */

async function loadHeaderHtmlIfNeeded() {

    const container =
        document.getElementById(
            "header-container"
        );


    if (!container) {

        console.warn(
            "HEADER: #header-container がありません"
        );

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
                "header.html",
                {
                    cache: "no-cache"
                }
            );


        if (!response.ok) {

            throw new Error(
                "header.html HTTP " +
                response.status
            );

        }


        container.innerHTML =
            await response.text();


        console.log(
            "HEADER: header.html 読み込み完了"
        );


        return Boolean(
            container.querySelector(
                ".site-header"
            )
        );

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

        accountButton:
            document.getElementById(
                "header-account-button"
            ),

        accountIconWrap:
            document.getElementById(
                "header-account-icon-wrap"
            ),

        accountIcon:
            document.getElementById(
                "header-account-icon"
            ),

        accountName:
            document.getElementById(
                "header-account-name"
            ),

        menuButton:
            document.getElementById(
                "header-menu-button"
            ),

        menuClose:
            document.getElementById(
                "header-menu-close"
            ),

        overlay:
            document.getElementById(
                "header-menu-overlay"
            ),

        sideMenu:
            document.getElementById(
                "header-side-menu"
            ),

        menuContent:
            document.getElementById(
                "header-menu-content"
            )

    };

}



/* =========================================
   CURRENT PAGE
========================================= */

function getCurrentPageFile() {

    let file =
        window.location.pathname
            .split("/")
            .pop();


    if (!file) {
        file = "index.html";
    }


    return file;

}


function isCurrentPage(href) {

    if (
        !href ||
        href === "#" ||
        href.startsWith("http")
    ) {
        return false;
    }


    const target =
        href
            .split("?")[0]
            .split("#")[0]
            .split("/")
            .pop();


    return (
        target ===
        getCurrentPageFile()
    );

}



/* =========================================
   DESKTOP ACTIVE NAV
========================================= */

function updatePrimaryNavigation() {

    const links =
        document.querySelectorAll(
            ".header-primary-nav a"
        );


    links.forEach(
        function (link) {

            link.classList.toggle(
                "active",
                isCurrentPage(
                    link.getAttribute("href")
                )
            );

        }
    );

}



/* =========================================
   IMAGE URL
========================================= */

function isSafeHeaderImageUrl(value) {

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
   PROFILE
========================================= */

async function loadHeaderProfile(user) {

    if (
        !user ||
        !window.supabaseClient
    ) {
        return null;
    }


    try {

        const {
            data,
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


        return data || null;

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
   ACCOUNT NAME
========================================= */

function getHeaderAccountName() {

    if (!mfdcoHeaderCurrentUser) {
        return "ログイン";
    }


    return String(
        mfdcoHeaderCurrentProfile?.activity_name ||
        mfdcoHeaderCurrentUser?.email?.split("@")[0] ||
        "マイページ"
    ).trim();

}



/* =========================================
   ACCOUNT BUTTON
========================================= */

function renderHeaderAccountButton() {

    const {
        accountButton,
        accountIconWrap,
        accountIcon,
        accountName
    } =
        getHeaderElements();


    if (!accountButton) {
        return;
    }


    if (!mfdcoHeaderCurrentUser) {

        accountButton.href =
            "join.html";


        if (accountName) {

            accountName.textContent =
                "ログイン";

        }


        if (accountIconWrap) {

            accountIconWrap.hidden =
                true;

        }


        if (accountIcon) {

            accountIcon.removeAttribute(
                "src"
            );

        }


        return;

    }


    const activityName =
        getHeaderAccountName();


    accountButton.href =
        "mypage.html";


    if (accountName) {

        accountName.textContent =
            activityName;

    }


    const iconUrl =
        String(
            mfdcoHeaderCurrentProfile?.icon_url ||
            ""
        ).trim();


    if (
        accountIcon &&
        accountIconWrap &&
        isSafeHeaderImageUrl(iconUrl)
    ) {

        accountIcon.src =
            iconUrl;

        accountIcon.alt =
            activityName;

        accountIconWrap.hidden =
            false;


        accountIcon.onerror =
            function () {

                accountIcon.removeAttribute(
                    "src"
                );

                accountIconWrap.hidden =
                    true;

            };

    }
    else {

        if (accountIcon) {

            accountIcon.removeAttribute(
                "src"
            );

        }


        if (accountIconWrap) {

            accountIconWrap.hidden =
                true;

        }

    }

}



/* =========================================
   CREATE MENU LINK
========================================= */

function createMenuLink(item) {

    if (!item) {
        return null;
    }


    const loggedIn =
        Boolean(
            mfdcoHeaderCurrentUser
        );


    if (
        item.authOnly &&
        !loggedIn
    ) {
        return null;
    }


    if (
        item.guestOnly &&
        loggedIn
    ) {
        return null;
    }


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "header-menu-item";


    /* =====================================
       DISABLED
    ====================================== */

    if (item.disabled) {

        wrapper.classList.add(
            "is-disabled"
        );


        const row =
            document.createElement(
                "div"
            );


        row.className =
            "header-menu-link header-menu-link-disabled";


        const label =
            document.createElement(
                "span"
            );


        label.textContent =
            item.label || "";


        row.appendChild(label);


        if (item.note) {

            const note =
                document.createElement(
                    "span"
                );


            note.className =
                "header-menu-note";


            note.textContent =
                item.note;


            row.appendChild(note);

        }


        wrapper.appendChild(row);


        return wrapper;

    }


    /* =====================================
       NORMAL LINK
    ====================================== */

    const link =
        document.createElement(
            "a"
        );


    link.className =
        "header-menu-link";


    link.href =
        item.href || "#";


    const label =
        document.createElement(
            "span"
        );


    label.textContent =
        item.label || "";


    link.appendChild(label);


    if (
        isCurrentPage(item.href)
    ) {

        link.classList.add(
            "active"
        );

    }


    if (item.external) {

        link.target =
            "_blank";

        link.rel =
            "noopener noreferrer";

    }


    wrapper.appendChild(link);


    return wrapper;

}



/* =========================================
   ACCOUNT MENU SECTION
========================================= */

function createAccountMenuSection(title) {

    const section =
        document.createElement(
            "section"
        );


    section.className =
        "header-menu-section";


    const heading =
        document.createElement(
            "h2"
        );


    heading.className =
        "header-menu-section-title";


    heading.textContent =
        title;


    section.appendChild(heading);


    const wrapper =
        document.createElement(
            "div"
        );


    wrapper.className =
        "header-menu-item";


    const link =
        document.createElement(
            "a"
        );


    link.className =
        "header-menu-link header-menu-account-link";


    if (mfdcoHeaderCurrentUser) {

        link.href =
            "mypage.html";


        const iconUrl =
            String(
                mfdcoHeaderCurrentProfile?.icon_url ||
                ""
            ).trim();


        if (
            isSafeHeaderImageUrl(
                iconUrl
            )
        ) {

            const image =
                document.createElement(
                    "img"
                );


            image.src =
                iconUrl;

            image.alt =
                "";

            image.className =
                "header-menu-account-icon";


            link.appendChild(image);

        }


        const name =
            document.createElement(
                "span"
            );


        name.textContent =
            getHeaderAccountName();


        link.appendChild(name);

    }
    else {

        link.href =
            "join.html";


        const name =
            document.createElement(
                "span"
            );


        name.textContent =
            "ログイン";


        link.appendChild(name);

    }


    wrapper.appendChild(link);

    section.appendChild(wrapper);


    return section;

}



/* =========================================
   RENDER SIDE MENU
========================================= */

function renderHeaderMenu() {

    const {
        menuContent
    } =
        getHeaderElements();


    if (!menuContent) {
        return;
    }


    menuContent.innerHTML =
        "";


    MFDCO_HEADER_MENU.forEach(
        function (entry) {

            if (!entry) {
                return;
            }


            /* =================================
               SINGLE LINK
            ================================= */

            if (
                entry.type === "link"
            ) {

                const section =
                    document.createElement(
                        "section"
                    );


                section.className =
                    "header-menu-section header-menu-home-section";


                const item =
                    createMenuLink(entry);


                if (item) {

                    section.appendChild(
                        item
                    );

                    menuContent.appendChild(
                        section
                    );

                }


                return;

            }


            /* =================================
               ACCOUNT
            ================================= */

            if (
                entry.type === "account"
            ) {

                menuContent.appendChild(
                    createAccountMenuSection(
                        entry.title ||
                        "アカウント"
                    )
                );


                return;

            }


            /* =================================
               GROUP
            ================================= */

            if (
                entry.type === "group"
            ) {

                const section =
                    document.createElement(
                        "section"
                    );


                section.className =
                    "header-menu-section";


                const heading =
                    document.createElement(
                        "h2"
                    );


                heading.className =
                    "header-menu-section-title";


                heading.textContent =
                    entry.title || "";


                section.appendChild(
                    heading
                );


                let count = 0;


                (
                    entry.items || []
                ).forEach(
                    function (item) {

                        const element =
                            createMenuLink(
                                item
                            );


                        if (!element) {
                            return;
                        }


                        section.appendChild(
                            element
                        );


                        count++;

                    }
                );


                if (count > 0) {

                    menuContent.appendChild(
                        section
                    );

                }

            }

        }
    );

}



/* =========================================
   OPEN MENU
========================================= */

function openHeaderMenu() {

    const {
        menuButton,
        overlay,
        sideMenu
    } =
        getHeaderElements();


    if (
        !sideMenu ||
        !overlay
    ) {

        console.warn(
            "HEADER: メニュー要素が見つかりません"
        );

        return;

    }


    mfdcoHeaderMenuOpen =
        true;


    renderHeaderMenu();


    overlay.hidden =
        false;


    requestAnimationFrame(
        function () {

            overlay.classList.add(
                "is-visible"
            );

            sideMenu.classList.add(
                "is-open"
            );

        }
    );


    sideMenu.setAttribute(
        "aria-hidden",
        "false"
    );


    if (menuButton) {

        menuButton.classList.add(
            "active"
        );

        menuButton.setAttribute(
            "aria-expanded",
            "true"
        );

        menuButton.setAttribute(
            "aria-label",
            "メニューを閉じる"
        );

    }


    document.body.classList.add(
        "header-menu-open"
    );

}



/* =========================================
   CLOSE MENU
========================================= */

function closeHeaderMenu() {

    const {
        menuButton,
        overlay,
        sideMenu
    } =
        getHeaderElements();


    mfdcoHeaderMenuOpen =
        false;


    if (sideMenu) {

        sideMenu.classList.remove(
            "is-open"
        );

        sideMenu.setAttribute(
            "aria-hidden",
            "true"
        );

    }


    if (overlay) {

        overlay.classList.remove(
            "is-visible"
        );


        window.setTimeout(
            function () {

                if (
                    !mfdcoHeaderMenuOpen
                ) {

                    overlay.hidden =
                        true;

                }

            },
            280
        );

    }


    if (menuButton) {

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


    document.body.classList.remove(
        "header-menu-open"
    );

}



/* =========================================
   TOGGLE MENU
========================================= */

function toggleHeaderMenu() {

    if (mfdcoHeaderMenuOpen) {

        closeHeaderMenu();

    }
    else {

        openHeaderMenu();

    }

}



/* =========================================
   GLOBAL CLICK EVENT
========================================= */

function handleHeaderDocumentClick(event) {

    const target =
        event.target;


    if (!(target instanceof Element)) {
        return;
    }


    /* =====================================
       MENU BUTTON
    ====================================== */

    const menuButton =
        target.closest(
            "#header-menu-button"
        );


    if (menuButton) {

        event.preventDefault();

        event.stopPropagation();

        toggleHeaderMenu();

        return;

    }


    /* =====================================
       CLOSE BUTTON
    ====================================== */

    const menuClose =
        target.closest(
            "#header-menu-close"
        );


    if (menuClose) {

        event.preventDefault();

        event.stopPropagation();

        closeHeaderMenu();

        return;

    }


    /* =====================================
       OVERLAY
    ====================================== */

    const overlay =
        target.closest(
            "#header-menu-overlay"
        );


    if (
        overlay &&
        target === overlay
    ) {

        event.preventDefault();

        closeHeaderMenu();

        return;

    }


    /* =====================================
       MENU LINK
    ====================================== */

    const menuLink =
        target.closest(
            ".header-menu-link"
        );


    if (
        menuLink &&
        menuLink.tagName === "A"
    ) {

        closeHeaderMenu();

    }

}



/* =========================================
   KEYDOWN EVENT
========================================= */

function handleHeaderKeydown(event) {

    if (
        event.key === "Escape" &&
        mfdcoHeaderMenuOpen
    ) {

        closeHeaderMenu();

    }

}



/* =========================================
   REGISTER GLOBAL EVENTS
========================================= */

function setupHeaderGlobalEvents() {

    if (
        mfdcoHeaderGlobalEventsRegistered
    ) {
        return;
    }


    mfdcoHeaderGlobalEventsRegistered =
        true;


    document.addEventListener(
        "click",
        handleHeaderDocumentClick
    );


    document.addEventListener(
        "keydown",
        handleHeaderKeydown
    );


    console.log(
        "HEADER: グローバルイベント登録完了"
    );

}



/* =========================================
   AUTH DISPLAY
========================================= */

async function updateHeaderAuthDisplay(user) {

    mfdcoHeaderCurrentUser =
        user || null;


    mfdcoHeaderCurrentProfile =
        null;


    if (mfdcoHeaderCurrentUser) {

        mfdcoHeaderCurrentProfile =
            await loadHeaderProfile(
                mfdcoHeaderCurrentUser
            );

    }


    renderHeaderAccountButton();

    renderHeaderMenu();


    console.log(
        "HEADER DISPLAY:",
        {
            loggedIn:
                Boolean(
                    mfdcoHeaderCurrentUser
                ),

            activityName:
                mfdcoHeaderCurrentProfile
                    ?.activity_name ||
                null
        }
    );

}



/* =========================================
   INITIAL SESSION
========================================= */

async function loadInitialHeaderSession() {

    if (!window.supabaseClient) {

        await updateHeaderAuthDisplay(
            null
        );

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


        await updateHeaderAuthDisplay(
            data?.session?.user ||
            null
        );

    }
    catch (error) {

        console.error(
            "HEADER SESSION ERROR:",
            error
        );


        await updateHeaderAuthDisplay(
            null
        );

    }

}



/* =========================================
   AUTH LISTENER
========================================= */

function setupHeaderAuthListener() {

    if (
        mfdcoHeaderAuthListenerRegistered ||
        !window.supabaseClient
    ) {
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


                window.setTimeout(
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
   SCROLL
========================================= */

function updateHeaderScrollState() {

    const {
        header
    } =
        getHeaderElements();


    if (!header) {
        return;
    }


    header.classList.toggle(
        "scrolled",
        window.scrollY > 10
    );

}


function setupHeaderScrollState() {

    updateHeaderScrollState();


    if (
        mfdcoHeaderScrollRegistered
    ) {
        return;
    }


    mfdcoHeaderScrollRegistered =
        true;


    window.addEventListener(
        "scroll",
        updateHeaderScrollState,
        {
            passive: true
        }
    );

}



/* =========================================
   INITIALIZE
========================================= */

async function initializeHeader() {

    const {
        header
    } =
        getHeaderElements();


    if (!header) {

        console.warn(
            "HEADER: .site-header がありません"
        );

        return false;

    }


    setupHeaderGlobalEvents();

    updatePrimaryNavigation();

    setupHeaderScrollState();

    renderHeaderMenu();


    if (
        !mfdcoHeaderInitialized
    ) {

        mfdcoHeaderInitialized =
            true;


        await loadInitialHeaderSession();


        setupHeaderAuthListener();

    }
    else {

        renderHeaderAccountButton();

        renderHeaderMenu();

    }


    console.log(
        "MFDCO HEADER: 初期化完了"
    );


    return true;

}



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
   GLOBAL
========================================= */

window.initializeHeader =
    initializeHeader;

window.openMfdcoHeaderMenu =
    openHeaderMenu;

window.closeMfdcoHeaderMenu =
    closeHeaderMenu;

window.refreshMfdcoHeader =
    startHeader;



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


console.log(
    "MFDCO header.js stable navigation version loaded."
);