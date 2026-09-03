"use strict";


let currentWork = null;

const elements = {};


/* =========================================
   READY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        cacheElements();

        setupEvents();

        await loadWork();

    }
);


/* =========================================
   CACHE
========================================= */

function cacheElements() {

    const ids = [
        "work-loading",
        "work-error",
        "work-error-text",
        "work-content",

        "work-image",
        "work-image-placeholder",

        "work-title",
        "author-icon",
        "author-name",

        "work-date",
        "work-type",
        "work-tags",
        "work-description",

        "commercial-use",
        "modification",
        "setting-modification",
        "destruction-depiction",
        "other-terms",

        "credit-type",
        "credit-text",

        "download-type",

        "filename-row",
        "filename",

        "filesize-row",
        "filesize",

        "filetype-row",
        "filetype",

        "download-button",
        "external-button",
        "download-error"
    ];


    for (const id of ids) {

        elements[
            camelCase(id)
        ] =
            document.getElementById(id);

    }

}


/* =========================================
   EVENTS
========================================= */

function setupEvents() {

    elements.downloadButton
        ?.addEventListener(
            "click",
            async function () {

                await downloadWork();

            }
        );

}


/* =========================================
   LOAD
========================================= */

async function loadWork() {

    try {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabaseへ接続できませんでした。"
            );

        }


        const params =
            new URLSearchParams(
                window.location.search
            );


        const workId =
            params.get("id");


        if (!workId) {

            throw new Error(
                "作品IDが指定されていません。"
            );

        }


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
                    created_at,

                    submission_type,
                    file_path,
                    external_url,
                    original_filename,
                    file_size,
                    file_type,

                    commercial_use,
                    modification,
                    setting_modification,
                    destruction_depiction,
                    other_terms,

                    credit_type,
                    credit_text
                `)
                .eq(
                    "id",
                    workId
                )
                .eq(
                    "status",
                    "approved"
                )
                .maybeSingle();


        if (error) {

            console.error(
                "WORK LOAD ERROR:",
                error
            );

            throw error;

        }


        if (!data) {

            throw new Error(
                "作品が見つからないか、まだ公開されていません。"
            );

        }


        currentWork =
            data;


        await loadAuthor();


        renderWork();


        elements.workLoading.hidden =
            true;


        elements.workContent.hidden =
            false;


        console.log(
            "MFDCO WORK:",
            currentWork
        );

    }
    catch (error) {

        console.error(
            "WORK INIT ERROR:",
            error
        );


        showError(
            error.message ||
            "作品情報の取得に失敗しました。"
        );

    }

}


/* =========================================
   AUTHOR
========================================= */

async function loadAuthor() {

    if (!currentWork?.user_id) {

        return;

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
                    icon_url
                `)
                .eq(
                    "id",
                    currentWork.user_id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "PROFILE LOAD ERROR:",
                error
            );

            return;

        }


        currentWork.profile =
            data || null;

    }
    catch (error) {

        console.warn(
            "PROFILE ERROR:",
            error
        );

    }

}


/* =========================================
   RENDER
========================================= */

function renderWork() {

    const work =
        currentWork;


    document.title =
        `${work.title} | MFDCO`;


    elements.workTitle.textContent =
        work.title ||
        "無題";


    elements.authorName.textContent =
        work.profile?.activity_name ||
        "MFDCO MEMBER";


    renderAuthorIcon();


    renderImage();


    elements.workDate.textContent =
        formatDate(
            work.created_at
        );


    const submissionType =
        work.submission_type === "url"
            ? "外部URL"
            : "直接ダウンロード";


    elements.workType.textContent =
        submissionType;


    elements.downloadType.textContent =
        submissionType;


    renderTags();


    elements.workDescription.textContent =
        work.description ||
        "作品説明はありません。";


    elements.commercialUse.textContent =
        getConditionLabel(
            work.commercial_use
        );


    elements.modification.textContent =
        getConditionLabel(
            work.modification
        );


    elements.settingModification.textContent =
        getConditionLabel(
            work.setting_modification
        );


    elements.destructionDepiction.textContent =
        getConditionLabel(
            work.destruction_depiction
        );


    elements.otherTerms.textContent =
        work.other_terms ||
        "特になし";


    elements.creditType.textContent =
        getCreditLabel(
            work.credit_type
        );


    elements.creditText.textContent =
        work.credit_text ||
        getDefaultCreditText(
            work.credit_type
        );


    renderDownloadArea();

}


/* =========================================
   IMAGE
========================================= */

function renderImage() {

    const url =
        currentWork.image_url;


    if (!url) {

        elements.workImage.hidden =
            true;


        elements.workImagePlaceholder.hidden =
            false;


        return;

    }


    elements.workImage.src =
        url;


    elements.workImage.alt =
        `${currentWork.title} の作品画像`;


    elements.workImage.hidden =
        false;


    elements.workImagePlaceholder.hidden =
        true;


    elements.workImage.onerror =
        function () {

            elements.workImage.hidden =
                true;


            elements.workImagePlaceholder.hidden =
                false;

        };

}


/* =========================================
   AUTHOR ICON
========================================= */

function renderAuthorIcon() {

    const url =
        currentWork.profile?.icon_url;


    if (!url) {

        elements.authorIcon.hidden =
            true;

        return;

    }


    elements.authorIcon.src =
        url;


    elements.authorIcon.alt =
        "";


    elements.authorIcon.hidden =
        false;


    elements.authorIcon.onerror =
        function () {

            elements.authorIcon.hidden =
                true;

        };

}


/* =========================================
   TAGS
========================================= */

function renderTags() {

    elements.workTags.innerHTML =
        "";


    const tags =
        Array.isArray(
            currentWork.tags
        )
            ? currentWork.tags
            : [];


    if (!tags.length) {

        return;

    }


    for (const tag of tags) {

        const item =
            document.createElement(
                "span"
            );


        item.className =
            "work-tag";


        item.textContent =
            tag;


        elements.workTags.appendChild(
            item
        );

    }

}


/* =========================================
   DOWNLOAD AREA
========================================= */

function renderDownloadArea() {

    const work =
        currentWork;


    if (
        work.submission_type === "url"
    ) {

        elements.filenameRow.hidden =
            true;


        elements.filesizeRow.hidden =
            true;


        elements.filetypeRow.hidden =
            true;


        elements.downloadButton.hidden =
            true;


        if (work.external_url) {

            elements.externalButton.href =
                work.external_url;


            elements.externalButton.hidden =
                false;

        }
        else {

            elements.externalButton.hidden =
                true;


            showDownloadError(
                "外部配布URLが登録されていません。"
            );

        }


        return;

    }


    elements.externalButton.hidden =
        true;


    elements.filenameRow.hidden =
        false;


    elements.filesizeRow.hidden =
        false;


    elements.filetypeRow.hidden =
        false;


    elements.filename.textContent =
        work.original_filename ||
        "-";


    elements.filesize.textContent =
        formatFileSize(
            work.file_size
        );


    elements.filetype.textContent =
        work.file_type ||
        "-";


    if (work.file_path) {

        elements.downloadButton.hidden =
            false;

    }
    else {

        elements.downloadButton.hidden =
            true;


        showDownloadError(
            "作品ファイルが登録されていません。"
        );

    }

}


/* =========================================
   DOWNLOAD
========================================= */

async function downloadWork() {

    if (
        !currentWork ||
        !currentWork.file_path
    ) {

        showDownloadError(
            "ダウンロード可能なファイルがありません。"
        );

        return;

    }


    hideDownloadError();


    elements.downloadButton.disabled =
        true;


    const originalText =
        elements.downloadButton.innerHTML;


    elements.downloadButton.innerHTML =
        `
            <span class="download-button-small">
                PREPARING
            </span>

            <strong>
                ダウンロードを準備しています...
            </strong>

            <span>
                …
            </span>
        `;


    try {

        /*
         * Private Bucket なので、
         * 一時的なSigned URLを発行します。
         *
         * 60秒だけ有効。
         */

        const {
            data,
            error
        } =
            await window.supabaseClient
                .storage
                .from("work-files")
                .createSignedUrl(
                    currentWork.file_path,
                    60,
                    {
                        download:
                            currentWork.original_filename ||
                            true
                    }
                );


        if (error) {

            console.error(
                "SIGNED URL ERROR:",
                error
            );

            throw error;

        }


        if (!data?.signedUrl) {

            throw new Error(
                "ダウンロードURLを発行できませんでした。"
            );

        }


        const link =
            document.createElement(
                "a"
            );


        link.href =
            data.signedUrl;


        link.download =
            currentWork.original_filename ||
            "";


        link.style.display =
            "none";


        document.body.appendChild(
            link
        );


        link.click();


        link.remove();

    }
    catch (error) {

        console.error(
            "DOWNLOAD ERROR:",
            error
        );


        showDownloadError(
            error.message ||
            "ダウンロードに失敗しました。"
        );

    }
    finally {

        elements.downloadButton.disabled =
            false;


        elements.downloadButton.innerHTML =
            originalText;

    }

}


/* =========================================
   CONDITION
========================================= */

function getConditionLabel(value) {

    switch (value) {

        case "allow":
            return "利用可";

        case "consult":
            return "要相談";

        case "deny":
            return "利用不可";

        default:
            return "-";

    }

}


/* =========================================
   CREDIT
========================================= */

function getCreditLabel(value) {

    switch (value) {

        case "none":
            return "クレジット不要";

        case "free":
            return "任意";

        case "profile":
            return "指定表記";

        case "custom":
            return "指定表記";

        default:
            return "-";

    }

}


function getDefaultCreditText(type) {

    switch (type) {

        case "none":
            return "クレジット表記は必要ありません。";

        case "free":
            return "クレジット表記は任意です。";

        default:
            return "-";

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
            day: "2-digit"
        }
    ).format(date);

}


/* =========================================
   FILE SIZE
========================================= */

function formatFileSize(bytes) {

    const value =
        Number(bytes);


    if (
        !Number.isFinite(value) ||
        value < 0
    ) {

        return "-";

    }


    if (value === 0) {

        return "0 B";

    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB",
        "TB"
    ];


    const index =
        Math.min(
            Math.floor(
                Math.log(value) /
                Math.log(1024)
            ),
            units.length - 1
        );


    const size =
        value /
        Math.pow(
            1024,
            index
        );


    return (
        size.toFixed(
            index === 0
                ? 0
                : 2
        ) +
        " " +
        units[index]
    );

}


/* =========================================
   ERROR
========================================= */

function showError(message) {

    elements.workLoading.hidden =
        true;


    elements.workContent.hidden =
        true;


    elements.workErrorText.textContent =
        message;


    elements.workError.hidden =
        false;

}


/* =========================================
   DOWNLOAD ERROR
========================================= */

function showDownloadError(message) {

    elements.downloadError.textContent =
        message;


    elements.downloadError.hidden =
        false;

}


function hideDownloadError() {

    elements.downloadError.hidden =
        true;

}


/* =========================================
   UTILITY
========================================= */

function camelCase(value) {

    return value.replace(
        /-([a-z])/g,
        function (_match, letter) {

            return letter.toUpperCase();

        }
    );

}


console.log(
    "MFDCO work.js loaded successfully."
);