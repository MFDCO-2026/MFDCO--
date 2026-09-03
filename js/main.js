/* =========================================
   MFDCO MAIN JAVASCRIPT
   Common HTML / Hero
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
            await fetch(file);


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

    } catch (error) {

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

    } else {

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
            once: true
        }
    );

} else {

    initializeMain();

}


/* =========================================
   LOG
   ========================================= */

console.log(
    "MFDCO main.js loaded successfully."
);