"use strict";


let currentWork = null;

const elements = {};


/* =========================================
   DOM READY
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        cacheElements();

        setupEvents();

        await initializeWorkManagement();

    }
);


/* =========================================
   CACHE
========================================= */

function cacheElements() {

    const ids = [
        "review-loading",
        "review-error",
        "review-content",

        "work-image",
        "work-image-placeholder",
        "work-status",
        "work-title",
        "work-author",
        "work-date",
        "work-submission-type",
        "work-file-type",
        "work-description",
        "work-tags",

        "data-submission-type",
        "data-filename",
        "data-filesize",
        "data-file-path",

        "external-url-box",
        "external-url",

        "condition-commercial",
        "condition-modification",
        "condition-setting",
        "condition-destruction",
        "other-terms",

        "credit-type",
        "credit-text",

        "status-information",
        "admin-note",

        "public-page-button",
        "hide-button",
        "restore-button",

        "action-error",
        "action-success"
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

    elements.hideButton
        ?.addEventListener(
            "click",
            hideWork
        );


    elements.restoreButton
        ?.addEventListener(
            "click",
            restoreWork
        );

}


/* =========================================
   INITIALIZE
========================================= */

async function initializeWorkManagement() {

    try {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabase client が初期化されていません。"
            );

        }


        /* AUTH */

        const {
            data: authData,
            error: authError
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (
            authError ||
            !authData?.user
        ) {

            window.location.replace(
                "admin-login.html"
            );

            return;

        }


        /* ADMIN */

        const {
            data: isAdmin,
            error: adminError
        } =
            await window.supabaseClient
                .rpc(
                    "current_user_is_admin"
                );


        if (
            adminError ||
            isAdmin !== true
        ) {

            throw new Error(
                "管理者権限がありません。"
            );

        }


        /* PASSWORD */

        if (
            sessionStorage.getItem(
                "mfdco_admin_verified"
            ) !== "true"
        ) {

            window.location.replace(
                "admin-login.html"
            );

            return;

        }


        /* WORK ID */

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


        await loadWork(
            workId
        );

    }
    catch (error) {

        console.error(
            "ADMIN WORK INIT ERROR:",
            error
        );


        showPageError(
            error.message ||
            "作品の読み込みに失敗しました。"
        );

    }

}


/* =========================================
   LOAD WORK
========================================= */

async function loadWork(workId) {

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
            .maybeSingle();


    if (error) {

        throw error;

    }


    if (!data) {

        throw new Error(
            "作品が見つからないか、管理権限がありません。"
        );

    }


    currentWork =
        data;


    await loadAuthor();


    renderWork();


    elements.reviewLoading.hidden =
        true;


    elements.reviewContent.hidden =
        false;


    console.log(
        "MFDCO ADMIN WORK:",
        currentWork
    );

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
                .select(
                    "id, activity_name"
                )
                .eq(
                    "id",
                    currentWork.user_id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "AUTHOR LOAD ERROR:",
                error
            );

            return;

        }


        currentWork.author =
            data || null;

    }
    catch (error) {

        console.warn(
            "AUTHOR ERROR:",
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
        `${work.title || "作品"} | 作品管理 | MFDCO`;


    elements.workTitle.textContent =
        work.title ||
        "無題";


    elements.workAuthor.textContent =
        work.author?.activity_name ||
        "不明";


    elements.workDate.textContent =
        formatDate(
            work.created_at
        );


    const submissionLabel =
        work.submission_type === "url"
            ? "外部URL"
            : "直接ファイル";


    elements.workSubmissionType.textContent =
        submissionLabel;


    elements.dataSubmissionType.textContent =
        submissionLabel;


    elements.workFileType.textContent =
        work.file_type ||
        "-";


    elements.workDescription.textContent =
        work.description ||
        "説明はありません。";


    renderStatus();

    renderImage(work);

    renderTags(
        work.tags
    );


    /* FILE */

    elements.dataFilename.textContent =
        work.original_filename ||
        "-";


    elements.dataFilesize.textContent =
        formatFileSize(
            work.file_size
        );


    elements.dataFilePath.textContent =
        work.file_path ||
        "-";


    /* EXTERNAL URL */

    const safeExternalUrl =
        getSafeHttpUrl(
            work.external_url
        );


    if (
        work.submission_type === "url" &&
        safeExternalUrl
    ) {

        elements.externalUrlBox.hidden =
            false;


        elements.externalUrl.href =
            safeExternalUrl;

    }
    else {

        elements.externalUrlBox.hidden =
            true;


        elements.externalUrl.removeAttribute(
            "href"
        );

    }


    /* CONDITIONS */

    elements.conditionCommercial.textContent =
        getConditionLabel(
            work.commercial_use
        );


    elements.conditionModification.textContent =
        getConditionLabel(
            work.modification
        );


    elements.conditionSetting.textContent =
        getConditionLabel(
            work.setting_modification
        );


    elements.conditionDestruction.textContent =
        getConditionLabel(
            work.destruction_depiction
        );


    elements.otherTerms.textContent =
        work.other_terms ||
        "特になし";


    /* CREDIT */

    elements.creditType.textContent =
        getCreditLabel(
            work.credit_type
        );


    elements.creditText.textContent =
        work.credit_text ||
        "-";


    /* NOTE */

    elements.adminNote.value =
        work.admin_note ||
        "";


    /* PUBLIC PAGE */

    elements.publicPageButton.href =
        "work.html?id=" +
        encodeURIComponent(
            work.id
        );


    renderManagementControls();

}


/* =========================================
   STATUS
========================================= */

function renderStatus() {

    elements.workStatus.textContent =
        getStatusLabel(
            currentWork.status
        );


    elements.workStatus.className =
        "review-status " +
        getStatusClass(
            currentWork.status
        );

}


/* =========================================
   MANAGEMENT CONTROLS
========================================= */

function renderManagementControls() {

    elements.hideButton.hidden =
        true;


    elements.restoreButton.hidden =
        true;


    switch (
        currentWork.status
    ) {

        case "approved":

            elements.statusInformation.textContent =
                "現在この作品は一般公開されています。";

            elements.hideButton.hidden =
                false;

            break;


        case "hidden":

            elements.statusInformation.textContent =
                "現在この作品は管理者によって非公開になっています。";

            elements.restoreButton.hidden =
                false;

            break;


        case "pending":

            elements.statusInformation.textContent =
                "この作品は旧審査方式の「審査待ち」状態です。再公開すると通常の公開作品になります。";

            elements.restoreButton.hidden =
                false;

            break;


        case "rejected":

            elements.statusInformation.textContent =
                "この作品は旧審査方式の「却下」状態です。再公開できます。";

            elements.restoreButton.hidden =
                false;

            break;


        default:

            elements.statusInformation.textContent =
                "作品の公開状態を確認できませんでした。";

            break;

    }

}


/* =========================================
   IMAGE
========================================= */

function renderImage(work) {

    if (!work.image_url) {

        elements.workImage.hidden =
            true;


        elements.workImagePlaceholder.hidden =
            false;


        return;

    }


    elements.workImage.src =
        work.image_url;


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
   TAGS
========================================= */

function renderTags(tags) {

    elements.workTags.innerHTML =
        "";


    if (
        !Array.isArray(tags) ||
        !tags.length
    ) {

        elements.workTags.textContent =
            "タグなし";


        return;

    }


    for (const tag of tags) {

        const span =
            document.createElement(
                "span"
            );


        span.className =
            "review-tag";


        span.textContent =
            tag;


        elements.workTags.appendChild(
            span
        );

    }

}


/* =========================================
   HIDE
========================================= */

async function hideWork() {

    if (!currentWork) {

        return;

    }


    const confirmed =
        window.confirm(
            "この作品を非公開にしますか？\n\n一般ユーザーの作品一覧および作品詳細から表示されなくなります。"
        );


    if (!confirmed) {

        return;

    }


    await updateStatus(
        "hidden"
    );

}


/* =========================================
   RESTORE
========================================= */

async function restoreWork() {

    if (!currentWork) {

        return;

    }


    const confirmed =
        window.confirm(
            "この作品を公開状態に戻しますか？"
        );


    if (!confirmed) {

        return;

    }


    await updateStatus(
        "approved"
    );

}


/* =========================================
   UPDATE
========================================= */

async function updateStatus(
    newStatus
) {

    setActionLoading(
        true
    );


    hideActionMessages();


    try {

        const note =
            elements.adminNote.value
                .trim();


        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("works")
                .update({
                    status:
                        newStatus,

                    admin_note:
                        note || null,

                    updated_at:
                        new Date()
                            .toISOString()
                })
                .eq(
                    "id",
                    currentWork.id
                )
                .select(
                    "id, status, admin_note, updated_at"
                )
                .maybeSingle();


        if (error) {

            throw error;

        }


        if (!data) {

            throw new Error(
                "作品状態を更新できませんでした。"
            );

        }


        currentWork.status =
            data.status;


        currentWork.admin_note =
            data.admin_note;


        currentWork.updated_at =
            data.updated_at;


        renderStatus();

        renderManagementControls();


        if (
            newStatus === "hidden"
        ) {

            showActionSuccess(
                "作品を非公開にしました。"
            );

        }
        else {

            showActionSuccess(
                "作品を公開状態に戻しました。"
            );

        }


        console.log(
            "ADMIN WORK STATUS UPDATED:",
            data
        );

    }
    catch (error) {

        console.error(
            "ADMIN WORK UPDATE ERROR:",
            error
        );


        showActionError(
            error.message ||
            "作品状態の変更に失敗しました。"
        );

    }
    finally {

        setActionLoading(
            false
        );

    }

}


/* =========================================
   LABELS
========================================= */

function getStatusLabel(status) {

    switch (status) {

        case "approved":
            return "公開中";

        case "hidden":
            return "非公開";

        case "pending":
            return "旧・審査待ち";

        case "rejected":
            return "旧・却下";

        default:
            return status || "不明";

    }

}


function getStatusClass(status) {

    switch (status) {

        case "approved":
            return "status-approved";

        case "hidden":
            return "status-hidden";

        case "rejected":
            return "status-rejected";

        case "pending":
            return "status-pending";

        default:
            return "status-unknown";

    }

}


function getConditionLabel(value) {

    switch (value) {

        case "allow":
            return "可";

        case "consult":
            return "要相談";

        case "deny":
            return "不可";

        default:
            return "-";

    }

}


function getCreditLabel(value) {

    switch (value) {

        case "none":
            return "不要";

        case "free":
            return "任意の書式";

        case "profile":
            return "プロフィール";

        case "custom":
            return "指定";

        default:
            return "-";

    }

}


/* =========================================
   EXTERNAL URL SAFETY
========================================= */

function getSafeHttpUrl(value) {

    if (!value) {

        return null;

    }


    try {

        const url =
            new URL(value);


        if (
            url.protocol !== "http:" &&
            url.protocol !== "https:"
        ) {

            return null;

        }


        return url.href;

    }
    catch {

        return null;

    }

}


/* =========================================
   FORMAT
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


function formatFileSize(bytes) {

    const size =
        Number(bytes);


    if (
        !Number.isFinite(size) ||
        size <= 0
    ) {

        return "-";

    }


    const units = [
        "B",
        "KB",
        "MB",
        "GB"
    ];


    let value =
        size;


    let unitIndex =
        0;


    while (
        value >= 1024 &&
        unitIndex <
        units.length - 1
    ) {

        value /= 1024;

        unitIndex++;

    }


    return (
        value.toFixed(
            unitIndex === 0
                ? 0
                : 2
        ) +
        " " +
        units[unitIndex]
    );

}


/* =========================================
   UI
========================================= */

function showPageError(message) {

    elements.reviewLoading.hidden =
        true;


    elements.reviewContent.hidden =
        true;


    elements.reviewError.textContent =
        message;


    elements.reviewError.hidden =
        false;

}


function hideActionMessages() {

    elements.actionError.hidden =
        true;


    elements.actionSuccess.hidden =
        true;

}


function showActionError(message) {

    elements.actionError.textContent =
        message;


    elements.actionError.hidden =
        false;


    elements.actionSuccess.hidden =
        true;

}


function showActionSuccess(message) {

    elements.actionSuccess.textContent =
        message;


    elements.actionSuccess.hidden =
        false;


    elements.actionError.hidden =
        true;

}


function setActionLoading(value) {

    elements.hideButton.disabled =
        value;


    elements.restoreButton.disabled =
        value;


    if (value) {

        elements.hideButton.textContent =
            "処理中...";


        elements.restoreButton.textContent =
            "処理中...";

    }
    else {

        elements.hideButton.textContent =
            "作品を非公開にする";


        elements.restoreButton.textContent =
            "作品を再公開する";

    }

}


/* =========================================
   UTILITY
========================================= */

function camelCase(value) {

    return value.replace(
        /-([a-z])/g,
        function (
            _match,
            letter
        ) {

            return letter.toUpperCase();

        }
    );

}


console.log(
    "MFDCO admin-work.js loaded successfully."
);