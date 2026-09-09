"use strict";


/* =========================================================
   MFDCO
   EDIT WORK
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const MAX_IMAGE_SIZE =
    10 * 1024 * 1024;


const MAX_WORK_FILE_SIZE =
    500 * 1024 * 1024;



/* =========================================================
   STATE
========================================================= */

let currentUser =
    null;


let currentProfile =
    null;


let currentWork =
    null;


let currentWorkId =
    null;


let selectedPreviewImage =
    null;


let selectedWorkFile =
    null;



/* =========================================================
   ELEMENT CACHE
========================================================= */

const elements = {};



/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async function () {

        console.log(
            "MFDCO EDIT WORK: DOMContentLoaded"
        );


        cacheElements();

        setupEvents();

        renderTags();

        await initializeEditPage();

    }
);



/* =========================================================
   CACHE ELEMENTS
========================================================= */

function cacheElements() {

    elements.loading =
        document.getElementById(
            "edit-loading"
        );


    elements.loginRequired =
        document.getElementById(
            "login-required"
        );


    elements.forbidden =
        document.getElementById(
            "edit-forbidden"
        );


    elements.forbiddenText =
        document.getElementById(
            "edit-forbidden-text"
        );


    elements.form =
        document.getElementById(
            "edit-work-form"
        );


    elements.title =
        document.getElementById(
            "work-title"
        );


    elements.description =
        document.getElementById(
            "work-description"
        );


    elements.currentImage =
        document.getElementById(
            "current-work-image"
        );


    elements.currentImagePlaceholder =
        document.getElementById(
            "current-work-image-placeholder"
        );


    elements.imageInput =
        document.getElementById(
            "work-image"
        );


    elements.imagePreview =
        document.getElementById(
            "work-image-preview"
        );


    elements.tags =
        document.getElementById(
            "work-tags"
        );


    elements.directFileArea =
        document.getElementById(
            "direct-file-area"
        );


    elements.externalUrlArea =
        document.getElementById(
            "external-url-area"
        );


    elements.currentWorkFileInfo =
        document.getElementById(
            "current-work-file-info"
        );


    elements.workFile =
        document.getElementById(
            "work-file"
        );


    elements.workFileInfo =
        document.getElementById(
            "work-file-info"
        );


    elements.externalUrl =
        document.getElementById(
            "external-url"
        );


    elements.otherTerms =
        document.getElementById(
            "other-terms"
        );


    elements.profileCreditArea =
        document.getElementById(
            "profile-credit-area"
        );


    elements.profileCreditText =
        document.getElementById(
            "profile-credit-text"
        );


    elements.customCreditArea =
        document.getElementById(
            "custom-credit-area"
        );


    elements.customCreditText =
        document.getElementById(
            "custom-credit-text"
        );


    elements.error =
        document.getElementById(
            "submit-error"
        );


    elements.success =
        document.getElementById(
            "submit-success"
        );


    elements.submitButton =
        document.getElementById(
            "edit-work-button"
        );


    elements.cancelLink =
        document.getElementById(
            "cancel-edit-link"
        );

}



/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    elements.form
        ?.addEventListener(
            "submit",
            handleSave
        );


    document
        .querySelectorAll(
            'input[name="submission_type"]'
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    updateSubmissionType
                );

            }
        );


    document
        .querySelectorAll(
            'input[name="credit_type"]'
        )
        .forEach(
            function (input) {

                input.addEventListener(
                    "change",
                    updateCreditType
                );

            }
        );


    elements.imageInput
        ?.addEventListener(
            "change",
            handleImageSelection
        );


    elements.workFile
        ?.addEventListener(
            "change",
            handleWorkFileSelection
        );

}



/* =========================================================
   INITIALIZE
========================================================= */

async function initializeEditPage() {

    try {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabaseクライアントが初期化されていません。"
            );

        }


        /* -----------------------------------------
           WORK ID
        ----------------------------------------- */

        const params =
            new URLSearchParams(
                window.location.search
            );


        currentWorkId =
            params.get(
                "id"
            );


        if (!currentWorkId) {

            showForbidden(
                "作品IDが指定されていません。"
            );

            return;

        }


        /* -----------------------------------------
           AUTH
        ----------------------------------------- */

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (error) {

            throw error;

        }


        currentUser =
            data?.user ||
            null;


        if (!currentUser) {

            showLoggedOut();

            return;

        }


        /* -----------------------------------------
           PROFILE
        ----------------------------------------- */

        await loadCurrentProfile();


        /* -----------------------------------------
           WORK
        ----------------------------------------- */

        await loadCurrentWork();


        /* -----------------------------------------
           OWNER CHECK
        ----------------------------------------- */

        if (
            currentWork.user_id !==
            currentUser.id
        ) {

            showForbidden(
                "この作品は投稿者本人のみ編集できます。"
            );

            return;

        }


        /* -----------------------------------------
           RENDER
        ----------------------------------------- */

        populateForm();


        if (elements.cancelLink) {

            elements.cancelLink.href =
                `work.html?id=${encodeURIComponent(currentWorkId)}`;

        }


        document.title =
            `${currentWork.title || "作品"}を編集 | MFDCO`;


        showForm();


        console.log(
            "MFDCO EDIT WORK initialized:",
            {
                workId:
                    currentWorkId,

                userId:
                    currentUser.id
            }
        );

    }
    catch (error) {

        console.error(
            "EDIT WORK INIT ERROR:",
            error
        );


        showForbidden(
            getErrorMessage(
                error
            )
        );

    }

}



/* =========================================================
   PROFILE
========================================================= */

async function loadCurrentProfile() {

    currentProfile =
        null;


    if (!currentUser) {

        return;

    }


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from(
                    "profiles"
                )
                .select(
                    "activity_name"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.warn(
                "EDIT PROFILE LOAD ERROR:",
                error
            );

            return;

        }


        currentProfile =
            data ||
            null;

    }
    catch (error) {

        console.warn(
            "EDIT PROFILE LOAD ERROR:",
            error
        );

    }

}



/* =========================================================
   LOAD WORK
========================================================= */

async function loadCurrentWork() {

    const {
        data,
        error
    } =
        await window.supabaseClient
            .from(
                "works"
            )
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
                currentWorkId
            )
            .maybeSingle();


    if (error) {

        throw error;

    }


    if (!data) {

        throw new Error(
            "作品が見つかりません。"
        );

    }


    currentWork =
        data;

}



/* =========================================================
   TAGS
========================================================= */

function renderTags() {

    if (!elements.tags) {

        return;

    }


    if (
        typeof window.renderMfdcoWorkTags !==
        "function"
    ) {

        console.error(
            "tags.js の renderMfdcoWorkTags が見つかりません。"
        );

        return;

    }


    window.renderMfdcoWorkTags(
        elements.tags,
        {
            inputName:
                "work_tags"
        }
    );

}



/* =========================================================
   SELECT EXISTING TAGS
========================================================= */

function selectExistingTags() {

    if (!elements.tags) {

        return;

    }


    const selectedTags =
        Array.isArray(
            currentWork?.tags
        )
            ? currentWork.tags
            : [];


    elements.tags
        .querySelectorAll(
            'input[type="checkbox"]'
        )
        .forEach(
            function (input) {

                input.checked =
                    selectedTags.includes(
                        input.value
                    );

            }
        );

}



/* =========================================================
   GET SELECTED TAGS
========================================================= */

function getSelectedTags() {

    if (!elements.tags) {

        return [];

    }


    if (
        typeof window.getSelectedMfdcoWorkTags ===
        "function"
    ) {

        return window
            .getSelectedMfdcoWorkTags(
                elements.tags
            );

    }


    return Array.from(

        elements.tags.querySelectorAll(
            'input[type="checkbox"]:checked'
        )

    ).map(

        function (input) {

            return input.value;

        }

    );

}



/* =========================================================
   POPULATE FORM
========================================================= */

function populateForm() {

    if (!currentWork) {

        return;

    }


    /* -----------------------------------------
       BASIC
    ----------------------------------------- */

    elements.title.value =
        currentWork.title ||
        "";


    elements.description.value =
        currentWork.description ||
        "";


    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    renderCurrentImage();


    /* -----------------------------------------
       TAGS
    ----------------------------------------- */

    selectExistingTags();


    /* -----------------------------------------
       SUBMISSION TYPE
    ----------------------------------------- */

    setRadioValue(
        "submission_type",
        currentWork.submission_type ||
        "file"
    );


    elements.externalUrl.value =
        currentWork.external_url ||
        "";


    renderCurrentWorkFile();


    updateSubmissionType();


    /* -----------------------------------------
       CONDITIONS
    ----------------------------------------- */

    setRadioValue(
        "commercial_use",
        currentWork.commercial_use ||
        "consult"
    );


    setRadioValue(
        "modification",
        currentWork.modification ||
        "consult"
    );


    setRadioValue(
        "setting_modification",
        currentWork.setting_modification ||
        "consult"
    );


    setRadioValue(
        "destruction_depiction",
        currentWork.destruction_depiction ||
        "consult"
    );


    elements.otherTerms.value =
        currentWork.other_terms ||
        "";


    /* -----------------------------------------
       CREDIT
    ----------------------------------------- */

    setRadioValue(
        "credit_type",
        currentWork.credit_type ||
        "profile"
    );


    elements.customCreditText.value =
        currentWork.credit_type ===
        "custom"
            ? (
                currentWork.credit_text ||
                ""
            )
            : "";


    renderProfileCredit();

    updateCreditType();

}



/* =========================================================
   CURRENT IMAGE
========================================================= */

function renderCurrentImage() {

    const url =
        currentWork?.image_url;


    if (!url) {

        if (elements.currentImage) {

            elements.currentImage.hidden =
                true;

        }


        if (
            elements.currentImagePlaceholder
        ) {

            elements.currentImagePlaceholder.hidden =
                false;

        }


        return;

    }


    elements.currentImage.src =
        url;


    elements.currentImage.hidden =
        false;


    if (
        elements.currentImagePlaceholder
    ) {

        elements.currentImagePlaceholder.hidden =
            true;

    }


    elements.currentImage.onerror =
        function () {

            elements.currentImage.hidden =
                true;


            if (
                elements.currentImagePlaceholder
            ) {

                elements.currentImagePlaceholder.hidden =
                    false;

            }

        };

}



/* =========================================================
   CURRENT WORK FILE
========================================================= */

function renderCurrentWorkFile() {

    if (!elements.currentWorkFileInfo) {

        return;

    }


    if (
        currentWork.submission_type ===
        "url"
    ) {

        elements.currentWorkFileInfo.textContent =
            "現在は外部URLで提供されています。";

        return;

    }


    if (
        !currentWork.file_path
    ) {

        elements.currentWorkFileInfo.textContent =
            "現在の作品ファイル情報がありません。";

        return;

    }


    const name =
        currentWork.original_filename ||
        "作品ファイル";


    const size =
        formatFileSize(
            Number(
                currentWork.file_size
            )
        );


    const type =
        currentWork.file_type ||
        "FILE";


    elements.currentWorkFileInfo.textContent =
        `${name} / ${type} / ${size}`;

}



/* =========================================================
   PROFILE CREDIT
========================================================= */

function renderProfileCredit() {

    if (!elements.profileCreditText) {

        return;

    }


    const activityName =
        String(
            currentProfile?.activity_name ||
            ""
        ).trim();


    elements.profileCreditText.textContent =
        activityName ||
        "プロフィールの活動名を取得できません。";

}



/* =========================================================
   SUBMISSION TYPE
========================================================= */

function getSubmissionType() {

    const input =
        document.querySelector(
            'input[name="submission_type"]:checked'
        );


    return input
        ? input.value
        : "file";

}



function updateSubmissionType() {

    const type =
        getSubmissionType();


    const isFile =
        type ===
        "file";


    if (elements.directFileArea) {

        elements.directFileArea.hidden =
            !isFile;

    }


    if (elements.externalUrlArea) {

        elements.externalUrlArea.hidden =
            isFile;

    }


    /*
        編集画面では、
        既存ファイルがあれば
        新しいファイルは必須ではない。
    */

    if (elements.workFile) {

        elements.workFile.required =
            false;

    }


    if (elements.externalUrl) {

        elements.externalUrl.required =
            !isFile;

    }

}



/* =========================================================
   CREDIT TYPE
========================================================= */

function getCreditType() {

    const input =
        document.querySelector(
            'input[name="credit_type"]:checked'
        );


    return input
        ? input.value
        : "profile";

}



function updateCreditType() {

    const type =
        getCreditType();


    const useProfile =
        type ===
        "profile";


    const useCustom =
        type ===
        "custom";


    if (
        elements.profileCreditArea
    ) {

        elements.profileCreditArea.hidden =
            !useProfile;

    }


    if (
        elements.customCreditArea
    ) {

        elements.customCreditArea.hidden =
            !useCustom;

    }


    if (
        elements.customCreditText
    ) {

        elements.customCreditText.required =
            useCustom;

    }

}



/* =========================================================
   IMAGE SELECTION
========================================================= */

function handleImageSelection(
    event
) {

    clearMessages();


    selectedPreviewImage =
        null;


    const file =
        event.target.files?.[0] ||
        null;


    if (!file) {

        if (elements.imagePreview) {

            elements.imagePreview.src =
                "";

            elements.imagePreview.hidden =
                true;

        }

        return;

    }


    const allowedTypes = [
        "image/png",
        "image/jpeg",
        "image/webp"
    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        event.target.value =
            "";


        showError(
            "プレビュー画像はPNG、JPEG、WebPのみ使用できます。"
        );

        return;

    }


    if (
        file.size >
        MAX_IMAGE_SIZE
    ) {

        event.target.value =
            "";


        showError(
            "プレビュー画像は10MB以下にしてください。"
        );

        return;

    }


    selectedPreviewImage =
        file;


    const reader =
        new FileReader();


    reader.onload =
        function () {

            if (
                elements.imagePreview
            ) {

                elements.imagePreview.src =
                    reader.result;

                elements.imagePreview.hidden =
                    false;

            }

        };


    reader.readAsDataURL(
        file
    );

}



/* =========================================================
   WORK FILE SELECTION
========================================================= */

function handleWorkFileSelection(
    event
) {

    clearMessages();


    selectedWorkFile =
        null;


    const file =
        event.target.files?.[0] ||
        null;


    if (!file) {

        if (elements.workFileInfo) {

            elements.workFileInfo.textContent =
                "新しいファイルは選択されていません。";

        }

        return;

    }


    if (
        file.size >
        MAX_WORK_FILE_SIZE
    ) {

        event.target.value =
            "";


        if (elements.workFileInfo) {

            elements.workFileInfo.textContent =
                "新しいファイルは選択されていません。";

        }


        showError(
            "作品ファイルは500MB以下にしてください。"
        );

        return;

    }


    selectedWorkFile =
        file;


    const extension =
        getFileExtension(
            file.name
        );


    elements.workFileInfo.textContent =
        `${file.name} / ${extension ? extension.toUpperCase() : "FILE"} / ${formatFileSize(file.size)}`;

}



/* =========================================================
   VALIDATE
========================================================= */

function validateForm() {

    clearMessages();


    if (!currentUser) {

        showError(
            "ログイン情報を確認できません。"
        );

        return false;

    }


    if (!currentWork) {

        showError(
            "作品情報を確認できません。"
        );

        return false;

    }


    if (
        currentWork.user_id !==
        currentUser.id
    ) {

        showError(
            "この作品を編集する権限がありません。"
        );

        return false;

    }


    const title =
        String(
            elements.title?.value ||
            ""
        ).trim();


    if (!title) {

        showError(
            "作品名を入力してください。"
        );

        elements.title?.focus();

        return false;

    }


    const submissionType =
        getSubmissionType();


    if (
        submissionType ===
        "url"
    ) {

        const url =
            String(
                elements.externalUrl?.value ||
                ""
            ).trim();


        if (!url) {

            showError(
                "外部URLを入力してください。"
            );

            return false;

        }


        if (!isValidHttpUrl(url)) {

            showError(
                "外部URLには http:// または https:// で始まるURLを入力してください。"
            );

            return false;

        }

    }


    if (
        submissionType ===
        "file"
    ) {

        /*
            元々URL作品だった場合は、
            ファイルへ変更するには
            新規ファイルが必要。
        */

        const hasExistingFile =
            currentWork.submission_type ===
                "file" &&
            Boolean(
                currentWork.file_path
            );


        const hasNewFile =
            Boolean(
                selectedWorkFile ||
                elements.workFile
                    ?.files?.[0]
            );


        if (
            !hasExistingFile &&
            !hasNewFile
        ) {

            showError(
                "ファイル提供へ変更する場合は作品ファイルを選択してください。"
            );

            return false;

        }

    }


    const requiredTerms = [
        "commercial_use",
        "modification",
        "setting_modification",
        "destruction_depiction"
    ];


    for (
        const name
        of requiredTerms
    ) {

        if (
            !document.querySelector(
                `input[name="${name}"]:checked`
            )
        ) {

            showError(
                "すべての利用条件を選択してください。"
            );

            return false;

        }

    }


    if (
        getCreditType() ===
        "custom"
    ) {

        const text =
            String(
                elements.customCreditText
                    ?.value ||
                ""
            ).trim();


        if (!text) {

            showError(
                "クレジット書式を入力してください。"
            );

            return false;

        }

    }


    if (
        getCreditType() ===
        "profile" &&
        !getProfileCreditText()
    ) {

        showError(
            "プロフィールの活動名を取得できません。別のクレジット設定を選択してください。"
        );

        return false;

    }


    return true;

}



/* =========================================================
   SAVE
========================================================= */

async function handleSave(
    event
) {

    event.preventDefault();


    if (!validateForm()) {

        return;

    }


    setSubmitting(
        true
    );


    clearMessages();


    let newImagePath =
        null;


    let newWorkFilePath =
        null;


    try {

        /* -----------------------------------------
           AUTH RECHECK
        ----------------------------------------- */

        const {
            data,
            error: userError
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (userError) {

            throw userError;

        }


        const user =
            data?.user;


        if (
            !user ||
            user.id !==
            currentWork.user_id
        ) {

            throw new Error(
                "作品を編集する権限を確認できません。"
            );

        }


        /* -----------------------------------------
           IMAGE
        ----------------------------------------- */

        let imageUrl =
            currentWork.image_url ||
            null;


        const newImage =
            selectedPreviewImage ||
            elements.imageInput
                ?.files?.[0] ||
            null;


        if (newImage) {

            const result =
                await uploadPreviewImage(
                    currentWorkId,
                    newImage
                );


            newImagePath =
                result.path;


            imageUrl =
                result.url;

        }


        /* -----------------------------------------
           WORK DATA
        ----------------------------------------- */

        const submissionType =
            getSubmissionType();


        let filePath =
            currentWork.file_path ||
            null;


        let externalUrl =
            currentWork.external_url ||
            null;


        let originalFilename =
            currentWork.original_filename ||
            null;


        let fileSize =
            currentWork.file_size ??
            null;


        let fileType =
            currentWork.file_type ||
            null;


        /* -----------------------------------------
           FILE
        ----------------------------------------- */

        if (
            submissionType ===
            "file"
        ) {

            externalUrl =
                null;


            const newFile =
                selectedWorkFile ||
                elements.workFile
                    ?.files?.[0] ||
                null;


            if (newFile) {

                const result =
                    await uploadWorkFile(
                        currentWorkId,
                        newFile
                    );


                newWorkFilePath =
                    result.path;


                filePath =
                    result.path;


                originalFilename =
                    newFile.name;


                fileSize =
                    newFile.size;


                fileType =
                    getFileType(
                        newFile
                    );

            }

        }


        /* -----------------------------------------
           URL
        ----------------------------------------- */

        if (
            submissionType ===
            "url"
        ) {

            externalUrl =
                String(
                    elements.externalUrl
                        ?.value ||
                    ""
                ).trim();


            filePath =
                null;


            originalFilename =
                null;


            fileSize =
                null;


            fileType =
                "external";

        }


        /* -----------------------------------------
           PAYLOAD
        ----------------------------------------- */

        const payload = {

            title:
                String(
                    elements.title
                        ?.value ||
                    ""
                ).trim(),

            description:
                nullableText(
                    elements.description
                        ?.value
                ),

            image_url:
                imageUrl,

            tags:
                getSelectedTags(),

            submission_type:
                submissionType,

            file_path:
                filePath,

            external_url:
                externalUrl,

            original_filename:
                originalFilename,

            file_size:
                fileSize,

            file_type:
                fileType,

            commercial_use:
                getCheckedValue(
                    "commercial_use"
                ),

            modification:
                getCheckedValue(
                    "modification"
                ),

            setting_modification:
                getCheckedValue(
                    "setting_modification"
                ),

            destruction_depiction:
                getCheckedValue(
                    "destruction_depiction"
                ),

            other_terms:
                nullableText(
                    elements.otherTerms
                        ?.value
                ),

            credit_type:
                getCreditType(),

            credit_text:
                getCreditText()

        };


        /*
            IMPORTANT

            id
            user_id
            status

            は絶対にUPDATEしない。
        */


        console.log(
            "MFDCO EDIT PAYLOAD:",
            payload
        );


        /* -----------------------------------------
           UPDATE
        ----------------------------------------- */

        const {
            data: updatedWork,
            error: updateError
        } =
            await window.supabaseClient
                .from(
                    "works"
                )
                .update(
                    payload
                )
                .eq(
                    "id",
                    currentWorkId
                )
                .eq(
                    "user_id",
                    user.id
                )
                .select(
                    "id"
                )
                .maybeSingle();


        if (updateError) {

            throw updateError;

        }


        if (!updatedWork) {

            throw new Error(
                "作品を更新できませんでした。権限設定を確認してください。"
            );

        }


        /* -----------------------------------------
           OLD IMAGE CLEANUP
        ----------------------------------------- */

        if (
            newImagePath &&
            currentWork.image_url
        ) {

            const oldImagePath =
                getStoragePathFromPublicUrl(
                    currentWork.image_url,
                    "work-images"
                );


            if (
                oldImagePath &&
                oldImagePath !==
                newImagePath
            ) {

                await removeStorageFile(
                    "work-images",
                    oldImagePath
                );

            }

        }


        /* -----------------------------------------
           OLD WORK FILE CLEANUP
        ----------------------------------------- */

        const oldFilePath =
            currentWork.file_path;


        if (
            oldFilePath &&
            (
                submissionType ===
                    "url" ||
                (
                    newWorkFilePath &&
                    newWorkFilePath !==
                    oldFilePath
                )
            )
        ) {

            await removeStorageFile(
                "work-files",
                oldFilePath
            );

        }


        showSuccess(
            "作品情報を更新しました。"
        );


        setTimeout(
            function () {

                window.location.href =
                    `work.html?id=${encodeURIComponent(currentWorkId)}`;

            },
            700
        );

    }
    catch (error) {

        console.error(
            "EDIT WORK SAVE ERROR:",
            error
        );


        /*
            DB更新に失敗した場合は
            新しくアップロードしたファイルだけ削除する。
        */

        if (newImagePath) {

            await removeStorageFile(
                "work-images",
                newImagePath
            );

        }


        if (newWorkFilePath) {

            await removeStorageFile(
                "work-files",
                newWorkFilePath
            );

        }


        showError(
            getErrorMessage(
                error
            )
        );

    }
    finally {

        setSubmitting(
            false
        );

    }

}



/* =========================================================
   UPLOAD IMAGE
========================================================= */

async function uploadPreviewImage(
    workId,
    file
) {

    const extension =
        getImageExtension(
            file
        );


    /*
        既存画像と衝突しないよう
        毎回新しいUUIDを付ける。
    */

    const path =
        `${currentUser.id}/${workId}-${createUuid()}.${extension}`;


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                "work-images"
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type
                }
            );


    if (error) {

        throw new Error(
            `プレビュー画像のアップロードに失敗しました: ${error.message}`
        );

    }


    const {
        data
    } =
        window.supabaseClient
            .storage
            .from(
                "work-images"
            )
            .getPublicUrl(
                path
            );


    if (!data?.publicUrl) {

        throw new Error(
            "プレビュー画像のURLを取得できませんでした。"
        );

    }


    return {

        path:
            path,

        url:
            data.publicUrl

    };

}



/* =========================================================
   UPLOAD WORK FILE
========================================================= */

async function uploadWorkFile(
    workId,
    file
) {

    const safeFilename =
        getSafeStorageFilename(
            file
        );


    const path =
        `${currentUser.id}/${workId}/${safeFilename}`;


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                "work-files"
            )
            .upload(
                path,
                file,
                {
                    cacheControl:
                        "3600",

                    upsert:
                        false,

                    contentType:
                        file.type ||
                        "application/octet-stream"
                }
            );


    if (error) {

        throw new Error(
            `作品ファイルのアップロードに失敗しました: ${error.message}`
        );

    }


    return {

        path:
            path

    };

}



/* =========================================================
   REMOVE STORAGE FILE
========================================================= */

async function removeStorageFile(
    bucket,
    path
) {

    if (!path) {

        return;

    }


    try {

        const {
            error
        } =
            await window.supabaseClient
                .storage
                .from(
                    bucket
                )
                .remove([
                    path
                ]);


        if (error) {

            /*
                古いファイル削除失敗は
                DB更新成功を取り消さない。
            */

            console.warn(
                `STORAGE REMOVE ERROR (${bucket}):`,
                error
            );

        }

    }
    catch (error) {

        console.warn(
            `STORAGE REMOVE ERROR (${bucket}):`,
            error
        );

    }

}



/* =========================================================
   STORAGE PATH FROM PUBLIC URL
========================================================= */

function getStoragePathFromPublicUrl(
    publicUrl,
    bucket
) {

    if (
        !publicUrl ||
        !bucket
    ) {

        return null;

    }


    try {

        const url =
            new URL(
                publicUrl
            );


        const marker =
            `/storage/v1/object/public/${bucket}/`;


        const index =
            url.pathname.indexOf(
                marker
            );


        if (
            index ===
            -1
        ) {

            return null;

        }


        return decodeURIComponent(
            url.pathname.slice(
                index +
                marker.length
            )
        );

    }
    catch {

        return null;

    }

}



/* =========================================================
   CREDIT
========================================================= */

function getProfileCreditText() {

    const activityName =
        String(
            currentProfile?.activity_name ||
            ""
        ).trim();


    return activityName ||
        null;

}



function getCreditText() {

    const type =
        getCreditType();


    switch (type) {

        case "none":

            return null;


        case "free":

            return null;


        case "profile":

            return getProfileCreditText();


        case "custom":

            return nullableText(
                elements.customCreditText
                    ?.value
            );


        default:

            return null;

    }

}



/* =========================================================
   RADIO
========================================================= */

function setRadioValue(
    name,
    value
) {

    const input =
        document.querySelector(
            `input[name="${name}"][value="${value}"]`
        );


    if (input) {

        input.checked =
            true;

    }

}



function getCheckedValue(
    name
) {

    const input =
        document.querySelector(
            `input[name="${name}"]:checked`
        );


    return input
        ? input.value
        : null;

}



/* =========================================================
   UI
========================================================= */

function showForm() {

    if (elements.loading) {

        elements.loading.hidden =
            true;

    }


    if (elements.loginRequired) {

        elements.loginRequired.hidden =
            true;

    }


    if (elements.forbidden) {

        elements.forbidden.hidden =
            true;

    }


    if (elements.form) {

        elements.form.hidden =
            false;

    }

}



function showLoggedOut() {

    if (elements.loading) {

        elements.loading.hidden =
            true;

    }


    if (elements.form) {

        elements.form.hidden =
            true;

    }


    if (elements.forbidden) {

        elements.forbidden.hidden =
            true;

    }


    if (elements.loginRequired) {

        elements.loginRequired.hidden =
            false;

    }

}



function showForbidden(
    message
) {

    if (elements.loading) {

        elements.loading.hidden =
            true;

    }


    if (elements.form) {

        elements.form.hidden =
            true;

    }


    if (elements.loginRequired) {

        elements.loginRequired.hidden =
            true;

    }


    if (elements.forbiddenText) {

        elements.forbiddenText.textContent =
            message;

    }


    if (elements.forbidden) {

        elements.forbidden.hidden =
            false;

    }

}



/* =========================================================
   SUBMIT STATE
========================================================= */

function setSubmitting(
    value
) {

    if (!elements.submitButton) {

        return;

    }


    elements.submitButton.disabled =
        value;


    elements.submitButton.textContent =
        value
            ? "保存しています..."
            : "変更を保存する";

}



/* =========================================================
   MESSAGES
========================================================= */

function clearMessages() {

    if (elements.error) {

        elements.error.hidden =
            true;

        elements.error.textContent =
            "";

    }


    if (elements.success) {

        elements.success.hidden =
            true;

        elements.success.textContent =
            "";

    }

}



function showError(
    message
) {

    if (!elements.error) {

        console.error(
            message
        );

        return;

    }


    elements.error.textContent =
        message;


    elements.error.hidden =
        false;


    if (elements.success) {

        elements.success.hidden =
            true;

    }

}



function showSuccess(
    message
) {

    if (!elements.success) {

        return;

    }


    elements.success.textContent =
        message;


    elements.success.hidden =
        false;


    if (elements.error) {

        elements.error.hidden =
            true;

    }

}



/* =========================================================
   URL VALIDATION
========================================================= */

function isValidHttpUrl(
    value
) {

    try {

        const url =
            new URL(
                value
            );


        return (
            url.protocol ===
                "http:" ||
            url.protocol ===
                "https:"
        );

    }
    catch {

        return false;

    }

}



/* =========================================================
   FILE HELPERS
========================================================= */

function getFileExtension(
    filename
) {

    if (!filename) {

        return "";

    }


    const index =
        filename.lastIndexOf(
            "."
        );


    if (
        index <= 0 ||
        index ===
            filename.length - 1
    ) {

        return "";

    }


    return filename
        .slice(
            index + 1
        )
        .toLowerCase();

}



function getImageExtension(
    file
) {

    const extension =
        getFileExtension(
            file.name
        );


    if (
        [
            "png",
            "jpg",
            "jpeg",
            "webp"
        ].includes(
            extension
        )
    ) {

        return extension ===
            "jpeg"
                ? "jpg"
                : extension;

    }


    switch (
        file.type
    ) {

        case "image/png":

            return "png";


        case "image/webp":

            return "webp";


        default:

            return "jpg";

    }

}



function getFileType(
    file
) {

    const extension =
        getFileExtension(
            file.name
        );


    return extension ||
        file.type ||
        "unknown";

}



function getSafeStorageFilename(
    file
) {

    const extension =
        getFileExtension(
            file?.name ||
            ""
        )
            .replace(
                /[^a-z0-9]/gi,
                ""
            )
            .slice(
                0,
                20
            );


    const id =
        createUuid();


    return extension
        ? `${id}.${extension}`
        : id;

}



/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(
    bytes
) {

    const value =
        Number(
            bytes
        );


    if (
        !Number.isFinite(
            value
        ) ||
        value < 0
    ) {

        return "-";

    }


    if (
        value <
        1024
    ) {

        return `${value} B`;

    }


    const kb =
        value /
        1024;


    if (
        kb <
        1024
    ) {

        return `${kb.toFixed(1)} KB`;

    }


    const mb =
        kb /
        1024;


    if (
        mb <
        1024
    ) {

        return `${mb.toFixed(1)} MB`;

    }


    return `${(
        mb /
        1024
    ).toFixed(2)} GB`;

}



/* =========================================================
   NULLABLE
========================================================= */

function nullableText(
    value
) {

    const text =
        String(
            value ??
            ""
        ).trim();


    return text ||
        null;

}



/* =========================================================
   UUID
========================================================= */

function createUuid() {

    if (
        window.crypto &&
        typeof window.crypto.randomUUID ===
        "function"
    ) {

        return window.crypto
            .randomUUID();

    }


    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(
            /[xy]/g,
            function (character) {

                const random =
                    Math.random() *
                    16 |
                    0;


                const value =
                    character ===
                    "x"
                        ? random
                        : (
                            random &
                            0x3 |
                            0x8
                        );


                return value
                    .toString(
                        16
                    );

            }
        );

}



/* =========================================================
   ERROR MESSAGE
========================================================= */

function getErrorMessage(
    error
) {

    const message =
        String(
            error?.message ||
            error?.details ||
            ""
        ).trim();


    if (!message) {

        return "作品の編集処理中にエラーが発生しました。";

    }


    if (
        message.includes(
            "row-level security"
        )
    ) {

        return "Supabaseのアクセス権限により編集が拒否されました。worksまたはStorageのRLSポリシーを確認してください。";

    }


    if (
        message.includes(
            "Bucket not found"
        )
    ) {

        return "必要なStorageバケットが見つかりません。";

    }


    return message;

}



console.log(
    "MFDCO edit-work.js loaded successfully."
);