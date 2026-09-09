"use strict";


/* =========================================
   MFDCO TOOLS
========================================= */


/* =========================================
   TOOL DATA

   ツールを追加するときは、
   この配列へデータを追加します。
========================================= */

const MFDCO_TOOLS = [

    {
        id: "mfdco-morse",

        title: "モールス符号変換機",

        description:
            "和文・英文モールス符号の符号化・翻訳、速度指定による音声再生・WAV生成に対応しています。",

        href:
            "tools/MFDCO_morse/index.html",

        status:
            "beta"
    }

];


/* =========================================
   STATUS
========================================= */

const MFDCO_TOOL_STATUS = {

    available: {
        label: "利用可能",
        className: "available"
    },

    beta: {
        label: "ベータ版",
        className: "beta"
    },

    coming: {
        label: "開発予定",
        className: "coming"
    }

};


/* =========================================
   GET ELEMENTS
========================================= */

function getToolsElements() {

    return {
        grid:
            document.getElementById(
                "tools-grid"
            ),

        empty:
            document.getElementById(
                "tools-empty"
            )
    };

}


/* =========================================
   STATUS INFO
========================================= */

function getToolStatus(status) {

    return (
        MFDCO_TOOL_STATUS[status] ||
        MFDCO_TOOL_STATUS.coming
    );

}


/* =========================================
   CREATE CARD
========================================= */

function createToolCard(tool, index) {

    const article =
        document.createElement(
            "article"
        );

    article.className =
        "tool-card";


    const status =
        getToolStatus(
            tool.status
        );


    if (tool.status === "coming") {

        article.classList.add(
            "is-coming-soon"
        );

    }


    /* =====================================
       TOP
    ====================================== */

    const top =
        document.createElement(
            "div"
        );

    top.className =
        "tool-card-top";


    const statusElement =
        document.createElement(
            "p"
        );

    statusElement.className =
        "tool-status " +
        status.className;

    statusElement.textContent =
        status.label;


    const number =
        document.createElement(
            "p"
        );

    number.className =
        "tool-number";

    number.textContent =
        "TOOL " +
        String(index + 1).padStart(
            2,
            "0"
        );


    top.appendChild(
        statusElement
    );

    top.appendChild(
        number
    );


    /* =====================================
       BODY
    ====================================== */

    const body =
        document.createElement(
            "div"
        );

    body.className =
        "tool-card-body";


    const title =
        document.createElement(
            "h3"
        );

    title.textContent =
        tool.title ||
        "名称未設定";


    const description =
        document.createElement(
            "p"
        );

    description.textContent =
        tool.description ||
        "説明はありません。";


    body.appendChild(
        title
    );

    body.appendChild(
        description
    );


    /* =====================================
       FOOTER
    ====================================== */

    const footer =
        document.createElement(
            "div"
        );

    footer.className =
        "tool-card-footer";


    if (
        tool.href &&
        tool.status !== "coming"
    ) {

        const link =
            document.createElement(
                "a"
            );

        link.className =
            "tool-open-button";

        link.href =
            tool.href;


        const label =
            document.createElement(
                "span"
            );

        label.textContent =
            tool.status === "beta"
                ? "ベータ版を開く"
                : "ツールを開く";


        const arrow =
            document.createElement(
                "span"
            );

        arrow.setAttribute(
            "aria-hidden",
            "true"
        );

        arrow.textContent =
            "→";


        link.appendChild(
            label
        );

        link.appendChild(
            arrow
        );

        footer.appendChild(
            link
        );

    }
    else {

        const disabled =
            document.createElement(
                "span"
            );

        disabled.className =
            "tool-disabled-button";

        disabled.textContent =
            "準備中";


        footer.appendChild(
            disabled
        );

    }


    /* =====================================
       BUILD
    ====================================== */

    article.appendChild(
        top
    );

    article.appendChild(
        body
    );

    article.appendChild(
        footer
    );


    return article;

}


/* =========================================
   RENDER
========================================= */

function renderTools() {

    const {
        grid,
        empty
    } = getToolsElements();


    if (!grid) {

        console.warn(
            "TOOLS: #tools-grid がありません"
        );

        return;

    }


    grid.innerHTML = "";


    if (
        MFDCO_TOOLS.length === 0
    ) {

        if (empty) {
            empty.hidden = false;
        }

        return;

    }


    if (empty) {
        empty.hidden = true;
    }


    MFDCO_TOOLS.forEach(
        function (tool, index) {

            const card =
                createToolCard(
                    tool,
                    index
                );

            grid.appendChild(
                card
            );

        }
    );


    console.log(
        "MFDCO TOOLS:",
        MFDCO_TOOLS.length,
        "件読み込み完了"
    );

}


/* =========================================
   START
========================================= */

function initializeTools() {

    renderTools();

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
        initializeTools,
        {
            once: true
        }
    );

}
else {

    initializeTools();

}