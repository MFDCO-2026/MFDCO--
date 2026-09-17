"use strict";


/* =========================================
   STATE
========================================= */

let currentWork = null;

const elements = {};


/* =========================================
   CONFIG
========================================= */

/*
 * 既存の非公開作品ファイル用Bucket
 */
const PRIVATE_WORK_BUCKET = "work-files";


/*
 * ログイン不要作品用の公開Bucket
 *
 * Supabase Storage側で
 * この名前のPublic Bucketを作成してください。
 */
const PUBLIC_WORK_BUCKET = "work-files-public";


/*
 * ダウンロード権限
 *
 * public
 *     ログイン不要
 *
 * user
 *     ログイン済みユーザー
 *
 * member
 *     加盟国・許可ユーザー
 *
 * private
 *     ダウンロード不可
 */
const DOWNLOAD_ACCESS = {

    PUBLIC: "public",

    USER: "user",

    MEMBER: "member",

    PRIVATE: "private"

};


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


        "work-access",

        "work-access-badge",

        "work-access-text",


        "commercial-use",

        "modification",

        "setting-modification",

        "destruction-depiction",

        "other-terms",


        "credit-type",

        "credit-text",


        "download-type",

        "download-access",


        "filename-row",

        "filename",


        "filesize-row",

        "filesize",


        "filetype-row",

        "filetype",


        "download-access-message",

        "download-access-title",

        "download-access-description",


        "download-confirmation",

        "download-terms-confirm",


        "download-button",

        "download-button-text",


        "external-button",

        "login-button",


        "download-error",

        "download-status",


        "work-owner-actions",

        "edit-work-button",

        "delete-work-button"

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


    elements.downloadTermsConfirm
        ?.addEventListener(
            "change",
            function () {

                updateDownloadButtonState();

            }
        );

    elements.deleteWorkButton
        ?.addEventListener(
            "click",
            deleteCurrentWork
        );

}


/* =========================================
   LOAD WORK
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

                    download_access,

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


        /*
         * 既存作品にdownload_accessが存在しない場合、
         * 安全側としてuser扱いにします。
         */

        if (!currentWork.download_access) {

            currentWork.download_access =
                DOWNLOAD_ACCESS.USER;

        }


        await loadAuthor();


        renderWork();


        await setupOwnerActions();


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
   OWNER ACTIONS
========================================= */

async function setupOwnerActions() {

    if (
        !elements.workOwnerActions ||
        !elements.editWorkButton ||
        !elements.deleteWorkButton ||
        !currentWork
    ) {

        return;

    }


    /*
     * 初期状態では必ず非表示
     */

    elements.workOwnerActions.hidden =
        true;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (error) {

            console.warn(
                "OWNER AUTH CHECK ERROR:",
                error
            );

            return;

        }


        const user =
            data?.user ||
            null;


        /*
         * ログアウト中
         */

        if (!user) {

            return;

        }


        /*
         * 投稿者本人ではない
         */

        if (
            user.id !==
            currentWork.user_id
        ) {

            return;

        }


        /*
         * 投稿者本人
         */

        elements.editWorkButton.href =
            `edit-work.html?id=${encodeURIComponent(currentWork.id)}`;


        elements.workOwnerActions.hidden =
            false;


        console.log(
            "MFDCO WORK OWNER:",
            user.id
        );

    }
    catch (error) {

        console.warn(
            "OWNER ACTION ERROR:",
            error
        );

    }

}


/* =========================================
   DELETE WORK (OWNER ONLY)
========================================= */

async function deleteCurrentWork() {

    if (!currentWork || !window.supabaseClient) {
        return;
    }

    const confirmed = window.confirm(
        `「${currentWork.title}」を削除します。\nこの操作は元に戻せません。よろしいですか？`
    );

    if (!confirmed) {
        return;
    }

    elements.deleteWorkButton.disabled = true;
    elements.deleteWorkButton.textContent = "削除中...";
    hideDownloadError();

    try {

        const { data: authData, error: authError } =
            await window.supabaseClient.auth.getUser();

        if (authError || !authData?.user) {
            throw new Error("削除するにはログインが必要です。");
        }

        if (authData.user.id !== currentWork.user_id) {
            throw new Error("この作品を削除できるのは提供者本人のみです。");
        }

        const { error: deleteError } =
            await window.supabaseClient
                .from("works")
                .delete()
                .eq("id", currentWork.id)
                .eq("user_id", authData.user.id);

        if (deleteError) {
            throw deleteError;
        }

        await removeDeletedWorkFiles();

        window.alert("作品を削除しました。作品一覧へ移動します。");
        window.location.assign("works.html");

    }
    catch (error) {

        console.error("WORK DELETE ERROR:", error);
        showDownloadError(
            error?.message || "作品を削除できませんでした。"
        );
        elements.deleteWorkButton.disabled = false;
        elements.deleteWorkButton.textContent = "作品を削除する";

    }

}


async function removeDeletedWorkFiles() {

    const removals = [];

    if (currentWork.file_path) {

        const bucket = currentWork.download_access === DOWNLOAD_ACCESS.PUBLIC
            ? PUBLIC_WORK_BUCKET
            : PRIVATE_WORK_BUCKET;

        removals.push(
            window.supabaseClient.storage
                .from(bucket)
                .remove([currentWork.file_path])
        );

    }

    const imagePath = getStorageObjectPath(
        currentWork.image_url,
        "work-images"
    );

    if (imagePath) {

        removals.push(
            window.supabaseClient.storage
                .from("work-images")
                .remove([imagePath])
        );

    }

    const results = await Promise.allSettled(removals);

    results.forEach(result => {
        if (result.status === "rejected" || result.value?.error) {
            console.warn("WORK FILE CLEANUP WARNING:", result);
        }
    });

}


function getStorageObjectPath(url, bucket) {

    if (!url || !bucket) {
        return "";
    }

    try {

        const parsed = new URL(url, window.location.href);
        const marker = `/object/public/${bucket}/`;
        const index = parsed.pathname.indexOf(marker);

        if (index < 0) {
            return "";
        }

        return decodeURIComponent(
            parsed.pathname.slice(index + marker.length)
        );

    }
    catch (_error) {
        return "";
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


    renderAccess();


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
   ACCESS DISPLAY
========================================= */

function renderAccess() {

    const access =
        currentWork.download_access;


    const info =
        getAccessInfo(
            access
        );


    if (!info) {

        elements.workAccess.hidden =
            true;

        return;

    }


    elements.workAccess.hidden =
        false;


    elements.workAccessBadge.textContent =
        info.badge;


    elements.workAccessText.textContent =
        info.heroText;


    elements.workAccessBadge.className =
        `work-access-badge ${info.className}`;


    elements.downloadAccess.textContent =
        info.downloadLabel;

}


/* =========================================
   ACCESS INFO
========================================= */

function getAccessInfo(access) {

    switch (access) {

        case DOWNLOAD_ACCESS.PUBLIC:

            return {

                badge:
                    "🌐 ログイン不要",

                heroText:
                    "この作品はログインせずにダウンロードできます。",

                downloadLabel:
                    "誰でもダウンロード可能",

                className:
                    "work-access-public"

            };


        case DOWNLOAD_ACCESS.USER:

            return {

                badge:
                    "🔐 ログインが必要",

                heroText:
                    "MFDCOアカウントへのログインが必要です。",

                downloadLabel:
                    "ログインユーザー",

                className:
                    "work-access-user"

            };


        case DOWNLOAD_ACCESS.MEMBER:

            return {

                badge:
                    "🔒 加盟国限定",

                heroText:
                    "この作品は許可された加盟国ユーザーのみダウンロードできます。",

                downloadLabel:
                    "加盟国・許可ユーザー",

                className:
                    "work-access-member"

            };


        case DOWNLOAD_ACCESS.PRIVATE:

            return {

                badge:
                    "非公開",

                heroText:
                    "この作品データは公開されていません。",

                downloadLabel:
                    "ダウンロード不可",

                className:
                    "work-access-private"

            };


        default:

            return null;

    }

}


/* =========================================
   DOWNLOAD AREA
========================================= */

function renderDownloadArea() {

    const work =
        currentWork;


    /*
     * 初期化
     */

    hideDownloadError();


    setDownloadStatus(
        ""
    );


    elements.downloadButton.hidden =
        true;


    elements.externalButton.hidden =
        true;


    elements.loginButton.hidden =
        true;


    elements.downloadConfirmation.hidden =
        true;


    elements.downloadTermsConfirm.checked =
        false;


    elements.downloadAccessMessage.hidden =
        true;


    /*
     * 外部URL作品
     */

    if (
        work.submission_type === "url"
    ) {

        renderExternalDownloadArea();

        return;

    }


    /*
     * 直接ダウンロード作品
     */

    renderDirectDownloadArea();

}


/* =========================================
   EXTERNAL DOWNLOAD
========================================= */

function renderExternalDownloadArea() {

    const work =
        currentWork;


    elements.filenameRow.hidden =
        true;


    elements.filesizeRow.hidden =
        true;


    elements.filetypeRow.hidden =
        true;


    /*
     * privateなら外部URLも開けない
     */

    if (
        work.download_access ===
        DOWNLOAD_ACCESS.PRIVATE
    ) {

        showAccessMessage(
            "ダウンロードできません",
            "この作品データは現在公開されていません。"
        );


        return;

    }


    if (!work.external_url) {

        showDownloadError(
            "外部配布URLが登録されていません。"
        );

        return;

    }


    /*
     * public
     *
     * 外部URLについてはログイン不要で開く
     */

    if (
        work.download_access ===
        DOWNLOAD_ACCESS.PUBLIC
    ) {

        showAccessMessage(
            "ログイン不要",
            "この作品の外部配布ページはログインせずに開くことができます。"
        );


        elements.downloadConfirmation.hidden =
            false;


        elements.externalButton.href =
            work.external_url;


        elements.externalButton.hidden =
            false;


        updateDownloadButtonState();


        return;

    }


    /*
     * user / member
     *
     * ここでは認証状態を確認してから表示
     */

    checkExternalAccess();

}


/* =========================================
   CHECK EXTERNAL ACCESS
========================================= */

async function checkExternalAccess() {

    const access =
        currentWork.download_access;


    const user =
        await getCurrentUser();


    /*
     * ログアウト
     */

    if (!user) {

        showAccessMessage(
            "ログインが必要です",
            "この作品の配布ページを開くにはMFDCOアカウントへのログインが必要です。"
        );


        setupLoginButton();


        return;

    }


    /*
     * MEMBER
     */

    if (
        access ===
        DOWNLOAD_ACCESS.MEMBER
    ) {

        const allowed =
            await checkMemberAccess(
                user
            );


        if (!allowed) {

            showAccessMessage(
                "加盟国限定作品",
                "現在のアカウントには、この作品を取得する権限がありません。"
            );


            return;

        }

    }


    showAccessMessage(
        "ダウンロード可能",
        "利用条件を確認すると配布ページを開くことができます。"
    );


    elements.downloadConfirmation.hidden =
        false;


    elements.externalButton.href =
        currentWork.external_url;


    elements.externalButton.hidden =
        false;


    updateDownloadButtonState();

}


/* =========================================
   DIRECT DOWNLOAD
========================================= */

function renderDirectDownloadArea() {

    const work =
        currentWork;


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


    /*
     * ファイルなし
     */

    if (!work.file_path) {

        showDownloadError(
            "作品ファイルが登録されていません。"
        );

        return;

    }


    /*
     * private
     */

    if (
        work.download_access ===
        DOWNLOAD_ACCESS.PRIVATE
    ) {

        showAccessMessage(
            "ダウンロードできません",
            "この作品データは現在公開されていません。"
        );


        return;

    }


    /*
     * public
     */

    if (
        work.download_access ===
        DOWNLOAD_ACCESS.PUBLIC
    ) {

        showAccessMessage(
            "ログイン不要",
            "利用条件を確認すると、ログインせずに作品をダウンロードできます。"
        );


        elements.downloadConfirmation.hidden =
            false;


        elements.downloadButton.hidden =
            false;


        updateDownloadButtonState();


        return;

    }


    /*
     * user / member
     */

    checkDirectAccess();

}


/* =========================================
   CHECK DIRECT ACCESS
========================================= */

async function checkDirectAccess() {

    const access =
        currentWork.download_access;


    const user =
        await getCurrentUser();


    /*
     * ログアウト中
     */

    if (!user) {

        showAccessMessage(
            "ログインが必要です",
            "この作品をダウンロードするにはMFDCOアカウントへのログインが必要です。"
        );


        setupLoginButton();


        return;

    }


    /*
     * member
     */

    if (
        access ===
        DOWNLOAD_ACCESS.MEMBER
    ) {

        const allowed =
            await checkMemberAccess(
                user
            );


        if (!allowed) {

            showAccessMessage(
                "加盟国限定作品",
                "現在のアカウントには、この作品をダウンロードする権限がありません。"
            );


            return;

        }

    }


    /*
     * ダウンロード許可
     */

    showAccessMessage(
        "ダウンロード可能",
        "利用条件を確認すると作品をダウンロードできます。"
    );


    elements.downloadConfirmation.hidden =
        false;


    elements.downloadButton.hidden =
        false;


    updateDownloadButtonState();

}


/* =========================================
   CURRENT USER
========================================= */

async function getCurrentUser() {

    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (error) {

            console.warn(
                "AUTH USER ERROR:",
                error
            );

            return null;

        }


        return (
            data?.user ||
            null
        );

    }
    catch (error) {

        console.warn(
            "AUTH USER ERROR:",
            error
        );


        return null;

    }

}


/* =========================================
   MEMBER ACCESS
========================================= */

async function checkMemberAccess(user) {

    if (!user?.id) {

        return false;

    }


    try {

        /*
         * 現段階ではprofiles側の
         * membership_status を確認する設計です。
         *
         * DB側の実際の列名が違う場合は、
         * 後でここだけ変更できます。
         */

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("profiles")
                .select(`
                    id,
                    membership_status
                `)
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "MEMBER ACCESS ERROR:",
                error
            );


            return false;

        }


        if (!data) {

            return false;

        }


        /*
         * 加盟国として許可する値
         *
         * 後でMFDCO側の正式な会員状態に合わせて
         * 調整できます。
         */

        return [
            "member",
            "approved",
            "active"
        ].includes(
            data.membership_status
        );

    }
    catch (error) {

        console.warn(
            "MEMBER ACCESS CHECK ERROR:",
            error
        );


        return false;

    }

}


/* =========================================
   LOGIN BUTTON
========================================= */

function setupLoginButton() {

    const returnUrl =
        window.location.pathname +
        window.location.search;


    elements.loginButton.href =
        `login.html?redirect=${encodeURIComponent(returnUrl)}`;


    elements.loginButton.hidden =
        false;

}


/* =========================================
   DOWNLOAD BUTTON STATE
========================================= */

function updateDownloadButtonState() {

    const confirmed =
        Boolean(
            elements.downloadTermsConfirm?.checked
        );


    /*
     * 直接DLボタン
     */

    if (
        elements.downloadButton &&
        !elements.downloadButton.hidden
    ) {

        elements.downloadButton.disabled =
            !confirmed;

    }


    /*
     * 外部リンク
     *
     * aタグにはdisabledがないため、
     * pointer-eventsを制御します。
     */

    if (
        elements.externalButton &&
        !elements.externalButton.hidden
    ) {

        if (confirmed) {

            elements.externalButton.style.pointerEvents =
                "";


            elements.externalButton.style.opacity =
                "";

            elements.externalButton.removeAttribute(
                "aria-disabled"
            );

        }
        else {

            elements.externalButton.style.pointerEvents =
                "none";


            elements.externalButton.style.opacity =
                "0.5";


            elements.externalButton.setAttribute(
                "aria-disabled",
                "true"
            );

        }

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


    /*
     * 利用条件未確認
     */

    if (
        !elements.downloadTermsConfirm?.checked
    ) {

        showDownloadError(
            "利用条件を確認し、チェックを入れてください。"
        );

        return;

    }


    hideDownloadError();


    setDownloadStatus(
        ""
    );


    /*
     * public
     */

    if (
        currentWork.download_access ===
        DOWNLOAD_ACCESS.PUBLIC
    ) {

        await downloadPublicWork();

        return;

    }


    /*
     * private
     */

    if (
        currentWork.download_access ===
        DOWNLOAD_ACCESS.PRIVATE
    ) {

        showDownloadError(
            "この作品はダウンロードできません。"
        );

        return;

    }


    /*
     * user / member
     */

    const user =
        await getCurrentUser();


    if (!user) {

        showDownloadError(
            "この作品のダウンロードにはログインが必要です。"
        );


        setupLoginButton();


        return;

    }


    /*
     * member再確認
     */

    if (
        currentWork.download_access ===
        DOWNLOAD_ACCESS.MEMBER
    ) {

        const allowed =
            await checkMemberAccess(
                user
            );


        if (!allowed) {

            showDownloadError(
                "現在のアカウントには、この作品をダウンロードする権限がありません。"
            );

            return;

        }

    }


    await downloadPrivateWork();

}


/* =========================================
   PUBLIC DOWNLOAD
========================================= */

async function downloadPublicWork() {

    setDownloadPreparing(
        true
    );


    try {

        /*
         * Public Bucketなので
         * Signed URLは発行しません。
         */

        const {
            data
        } =
            window.supabaseClient
                .storage
                .from(
                    PUBLIC_WORK_BUCKET
                )
                .getPublicUrl(
                    currentWork.file_path
                );


        const publicUrl =
            data?.publicUrl;


        if (!publicUrl) {

            throw new Error(
                "公開ダウンロードURLを取得できませんでした。"
            );

        }


        triggerDownload(
            publicUrl,
            currentWork.original_filename
        );


        setDownloadStatus(
            "ダウンロードを開始しました。"
        );

    }
    catch (error) {

        console.error(
            "PUBLIC DOWNLOAD ERROR:",
            error
        );


        showDownloadError(
            error.message ||
            "ダウンロードに失敗しました。"
        );

    }
    finally {

        setDownloadPreparing(
            false
        );

    }

}


/* =========================================
   PRIVATE DOWNLOAD
========================================= */

async function downloadPrivateWork() {

    setDownloadPreparing(
        true
    );


    try {

        /*
         * Private Bucketなので
         * 一時的なSigned URLを発行します。
         *
         * 60秒のみ有効です。
         */

        const {
            data,
            error
        } =
            await window.supabaseClient
                .storage
                .from(
                    PRIVATE_WORK_BUCKET
                )
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


        triggerDownload(
            data.signedUrl,
            currentWork.original_filename
        );


        setDownloadStatus(
            "ダウンロードを開始しました。"
        );

    }
    catch (error) {

        console.error(
            "PRIVATE DOWNLOAD ERROR:",
            error
        );


        showDownloadError(
            error.message ||
            "ダウンロードに失敗しました。"
        );

    }
    finally {

        setDownloadPreparing(
            false
        );

    }

}


/* =========================================
   TRIGGER DOWNLOAD
========================================= */

function triggerDownload(
    url,
    filename
) {

    const link =
        document.createElement(
            "a"
        );


    link.href =
        url;


    link.download =
        filename ||
        "";


    link.style.display =
        "none";


    document.body.appendChild(
        link
    );


    link.click();


    link.remove();

}


/* =========================================
   DOWNLOAD PREPARING
========================================= */

function setDownloadPreparing(
    preparing
) {

    if (!elements.downloadButton) {

        return;

    }


    if (preparing) {

        elements.downloadButton.disabled =
            true;


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


        return;

    }


    elements.downloadButton.innerHTML =
        `
            <span class="download-button-small">
                DOWNLOAD
            </span>

            <strong id="download-button-text">
                作品をダウンロード
            </strong>

            <span>
                ↓
            </span>
        `;


    /*
     * innerHTMLを書き換えたので
     * button text要素を再取得
     */

    elements.downloadButtonText =
        document.getElementById(
            "download-button-text"
        );


    updateDownloadButtonState();

}


/* =========================================
   ACCESS MESSAGE
========================================= */

function showAccessMessage(
    title,
    description
) {

    elements.downloadAccessTitle.textContent =
        title;


    elements.downloadAccessDescription.textContent =
        description;


    elements.downloadAccessMessage.hidden =
        false;

}


/* =========================================
   DOWNLOAD STATUS
========================================= */

function setDownloadStatus(
    message
) {

    if (!elements.downloadStatus) {

        return;

    }


    elements.downloadStatus.textContent =
        message || "";

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


/* =========================================
   DEFAULT CREDIT TEXT
========================================= */

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
    ).format(
        date
    );

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
   PAGE ERROR
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


/* =========================================
   HIDE DOWNLOAD ERROR
========================================= */

function hideDownloadError() {

    elements.downloadError.hidden =
        true;


    elements.downloadError.textContent =
        "";

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


/* =========================================
   READY LOG
========================================= */

console.log(
    "MFDCO work.js loaded successfully."
);
