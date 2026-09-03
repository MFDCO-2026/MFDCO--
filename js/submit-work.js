"use strict";


/* =========================================================
   MFDCO
   SUBMIT WORK
========================================================= */


/* =========================================================
   CONSTANTS
========================================================= */

const MAX_IMAGE_SIZE =
    10 * 1024 * 1024;


/*
    Supabase側のStorage上限より大きい値には
    設定しないでください。

    現在は500MB。
*/
const MAX_WORK_FILE_SIZE =
    500 * 1024 * 1024;


const DEFAULT_IMAGE =
    "assets/noimage.png";



/* =========================================================
   STATE
========================================================= */

let currentUser =
    null;


let currentProfile =
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
            "MFDCO SUBMIT: DOMContentLoaded"
        );


        /* -----------------------------------------
           ELEMENTS
        ----------------------------------------- */

        cacheElements();


        /* -----------------------------------------
           EVENTS
        ----------------------------------------- */

        setupEvents();


        /* -----------------------------------------
           TAGS
        ----------------------------------------- */

        renderTags();


        /* -----------------------------------------
           INITIAL UI
        ----------------------------------------- */

        updateSubmissionType();

        updateCreditType();


        /* -----------------------------------------
           AUTH
        ----------------------------------------- */

        await initializeSubmissionPage();

    }
);



/* =========================================================
   CACHE ELEMENTS
========================================================= */

function cacheElements() {

    /* -----------------------------------------
       PAGE
    ----------------------------------------- */

    elements.loginRequired =
        document.getElementById(
            "login-required"
        );


    elements.form =
        document.getElementById(
            "submit-work-form"
        );



    /* -----------------------------------------
       BASIC
    ----------------------------------------- */

    elements.title =
        document.getElementById(
            "work-title"
        );


    elements.description =
        document.getElementById(
            "work-description"
        );



    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    elements.imageInput =
        document.getElementById(
            "work-image"
        );


    elements.imagePreview =
        document.getElementById(
            "work-image-preview"
        );



    /* -----------------------------------------
       TAGS
    ----------------------------------------- */

    elements.tags =
        document.getElementById(
            "work-tags"
        );



    /* -----------------------------------------
       WORK DATA
    ----------------------------------------- */

    elements.directFileArea =
        document.getElementById(
            "direct-file-area"
        );


    elements.externalUrlArea =
        document.getElementById(
            "external-url-area"
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



    /* -----------------------------------------
       TERMS
    ----------------------------------------- */

    elements.otherTerms =
        document.getElementById(
            "other-terms"
        );



    /* -----------------------------------------
       CREDIT
    ----------------------------------------- */

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



    /* -----------------------------------------
       SUBMIT
    ----------------------------------------- */

    elements.agreement =
        document.getElementById(
            "submit-agreement"
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
            "submit-work-button"
        );


    console.log(
        "MFDCO SUBMIT: elements cached"
    );

}



/* =========================================================
   SETUP EVENTS
========================================================= */

function setupEvents() {

    /* -----------------------------------------
       FORM
    ----------------------------------------- */

    if (elements.form) {

        elements.form.addEventListener(
            "submit",
            handleSubmit
        );

    }



    /* -----------------------------------------
       SUBMISSION TYPE
    ----------------------------------------- */

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



    /* -----------------------------------------
       CREDIT TYPE
    ----------------------------------------- */

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



    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    if (elements.imageInput) {

        elements.imageInput.addEventListener(
            "change",
            handleImageSelection
        );

    }



    /* -----------------------------------------
       WORK FILE
    ----------------------------------------- */

    if (elements.workFile) {

        elements.workFile.addEventListener(
            "change",
            handleWorkFileSelection
        );

    }

}



/* =========================================================
   INITIALIZE
========================================================= */

async function initializeSubmissionPage() {

    try {

        if (!window.supabaseClient) {

            throw new Error(
                "Supabaseクライアントが初期化されていません。"
            );

        }


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


        const user =
            data?.user || null;


        if (!user) {

            currentUser =
                null;


            currentProfile =
                null;


            showLoggedOut();

            return;

        }


        currentUser =
            user;


        /*
            プロフィール読み込み失敗だけで
            投稿画面全体をログアウト扱いにはしない。
        */
        await loadCurrentProfile();


        showLoggedIn();


        console.log(
            "MFDCO SUBMIT: initialized",
            {
                userId:
                    currentUser.id,

                profile:
                    currentProfile
            }
        );

    }
    catch (error) {

        console.error(
            "SUBMIT INIT ERROR:",
            error
        );


        currentUser =
            null;


        currentProfile =
            null;


        showLoggedOut();


        showError(
            "ログイン状態を確認できませんでした。ページを再読み込みしてください。"
        );

    }

}



/* =========================================================
   LOGIN DISPLAY
========================================================= */

function showLoggedOut() {

    if (elements.loginRequired) {

        elements.loginRequired.hidden =
            false;

    }


    if (elements.form) {

        elements.form.hidden =
            true;

    }

}



function showLoggedIn() {

    if (elements.loginRequired) {

        elements.loginRequired.hidden =
            true;

    }


    if (elements.form) {

        elements.form.hidden =
            false;

    }

}



/* =========================================================
   PROFILE
========================================================= */

async function loadCurrentProfile() {

    currentProfile =
        null;


    if (!currentUser) {

        renderProfileCredit();

        return;

    }


    try {

        /*
            IMPORTANT

            現在確認できているカラムだけを取得する。

            credit_preference
            credit_custom_text

            は実DBのカラム名が未確認なので
            ここでは取得しない。

            これにより以前のHTTP 400を防止する。
        */

        const {
            data,
            error
        } =
            await window.supabaseClient
                .from("profiles")
                .select(
                    "activity_name"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (error) {

            console.error(
                "PROFILE LOAD ERROR:",
                error
            );


            currentProfile =
                null;


            renderProfileCredit();

            return;

        }


        currentProfile =
            data || null;


        renderProfileCredit();

    }
    catch (error) {

        console.error(
            "PROFILE LOAD ERROR:",
            error
        );


        currentProfile =
            null;


        renderProfileCredit();

    }

}



/* =========================================================
   PROFILE CREDIT
========================================================= */

function renderProfileCredit() {

    if (!elements.profileCreditText) {

        return;

    }


    /*
        現段階ではプロフィールの
        正式なクレジット設定カラムが不明。

        メールアドレスをクレジットとして
        使用することはしない。
    */


    if (!currentProfile) {

        elements.profileCreditText.textContent =
            "プロフィールのクレジット設定を取得できません。";

        return;

    }


    const activityName =
        String(
            currentProfile.activity_name ||
            ""
        ).trim();


    if (!activityName) {

        elements.profileCreditText.textContent =
            "プロフィールに活動名が設定されていません。";

        return;

    }


    /*
        暫定表示。

        profilesのクレジット設定カラム確認後、
        ここを正式な設定内容へ変更する。
    */

    elements.profileCreditText.textContent =
        activityName;

}



/* =========================================================
   TAGS
========================================================= */

function renderTags() {

    if (!elements.tags) {

        console.warn(
            "SUBMIT TAGS: #work-tags がありません。"
        );

        return;

    }


    if (
        typeof window.renderMfdcoWorkTags !==
        "function"
    ) {

        console.error(
            "SUBMIT TAGS: renderMfdcoWorkTags が見つかりません。tags.jsを確認してください。"
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


    console.log(
        "MFDCO SUBMIT: work tags rendered"
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


    /*
        tags.jsの関数が無い場合の
        フォールバック。
    */

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
   SUBMISSION TYPE
========================================================= */

function getSubmissionType() {

    const selected =
        document.querySelector(
            'input[name="submission_type"]:checked'
        );


    if (!selected) {

        return "file";

    }


    return selected.value;

}



function updateSubmissionType() {

    const type =
        getSubmissionType();


    const isFile =
        type === "file";


    /* -----------------------------------------
       DISPLAY
    ----------------------------------------- */

    if (elements.directFileArea) {

        elements.directFileArea.hidden =
            !isFile;

    }


    if (elements.externalUrlArea) {

        elements.externalUrlArea.hidden =
            isFile;

    }



    /* -----------------------------------------
       REQUIRED
    ----------------------------------------- */

    if (elements.workFile) {

        elements.workFile.required =
            isFile;

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

    const selected =
        document.querySelector(
            'input[name="credit_type"]:checked'
        );


    if (!selected) {

        return "profile";

    }


    return selected.value;

}



function updateCreditType() {

    const type =
        getCreditType();


    const useProfile =
        type === "profile";


    const useCustom =
        type === "custom";


    if (elements.profileCreditArea) {

        elements.profileCreditArea.hidden =
            !useProfile;

    }


    if (elements.customCreditArea) {

        elements.customCreditArea.hidden =
            !useCustom;

    }


    if (elements.customCreditText) {

        elements.customCreditText.required =
            useCustom;

    }

}



/* =========================================================
   IMAGE SELECTION
========================================================= */

function handleImageSelection(event) {

    clearMessages();


    const file =
        event.target.files?.[0] ||
        null;


    selectedPreviewImage =
        null;


    if (!file) {

        resetImagePreview();

        return;

    }


    /* -----------------------------------------
       TYPE
    ----------------------------------------- */

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


        resetImagePreview();


        showError(
            "プレビュー画像はPNG、JPEG、WebPのみ使用できます。"
        );

        return;

    }



    /* -----------------------------------------
       SIZE
    ----------------------------------------- */

    if (
        file.size >
        MAX_IMAGE_SIZE
    ) {

        event.target.value =
            "";


        resetImagePreview();


        showError(
            "プレビュー画像は10MB以下にしてください。"
        );

        return;

    }


    selectedPreviewImage =
        file;



    /* -----------------------------------------
       PREVIEW
    ----------------------------------------- */

    const reader =
        new FileReader();


    reader.onload =
        function () {

            if (
                elements.imagePreview
            ) {

                elements.imagePreview.src =
                    reader.result;

            }

        };


    reader.onerror =
        function () {

            resetImagePreview();

        };


    reader.readAsDataURL(
        file
    );

}



/* =========================================================
   RESET IMAGE
========================================================= */

function resetImagePreview() {

    if (elements.imagePreview) {

        elements.imagePreview.src =
            DEFAULT_IMAGE;

    }

}



/* =========================================================
   WORK FILE SELECTION
========================================================= */

function handleWorkFileSelection(
    event
) {

    clearMessages();


    const file =
        event.target.files?.[0] ||
        null;


    selectedWorkFile =
        null;


    if (!file) {

        if (
            elements.workFileInfo
        ) {

            elements.workFileInfo.textContent =
                "ファイルを選択してください。";

        }


        return;

    }



    /* -----------------------------------------
       SIZE
    ----------------------------------------- */

    if (
        file.size >
        MAX_WORK_FILE_SIZE
    ) {

        event.target.value =
            "";


        showError(
            "作品ファイルが大きすぎます。500MB以下のファイルを選択してください。"
        );


        if (
            elements.workFileInfo
        ) {

            elements.workFileInfo.textContent =
                "ファイルを選択してください。";

        }


        return;

    }


    selectedWorkFile =
        file;



    /* -----------------------------------------
       INFO
    ----------------------------------------- */

    if (
        elements.workFileInfo
    ) {

        const extension =
            getFileExtension(
                file.name
            );


        const typeText =
            extension
                ? extension.toUpperCase()
                : "FILE";


        elements.workFileInfo.textContent =
            `${file.name} / ${typeText} / ${formatFileSize(file.size)}`;

    }

}



/* =========================================================
   VALIDATE FORM
========================================================= */

function validateForm() {

    clearMessages();


    /* -----------------------------------------
       USER
    ----------------------------------------- */

    if (!currentUser) {

        showError(
            "作品を提出するにはログインが必要です。"
        );

        return false;

    }



    /* -----------------------------------------
       TITLE
    ----------------------------------------- */

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



    /* -----------------------------------------
       SUBMISSION TYPE
    ----------------------------------------- */

    const submissionType =
        getSubmissionType();


    if (
        submissionType ===
        "file"
    ) {

        const file =
            selectedWorkFile ||
            elements.workFile
                ?.files?.[0] ||
            null;


        if (!file) {

            showError(
                "作品ファイルを選択してください。"
            );

            return false;

        }

    }
    else if (
        submissionType ===
        "url"
    ) {

        const url =
            String(
                elements.externalUrl
                    ?.value ||
                ""
            ).trim();


        if (!url) {

            showError(
                "外部URLを入力してください。"
            );

            elements.externalUrl
                ?.focus();

            return false;

        }


        if (
            !isValidHttpUrl(url)
        ) {

            showError(
                "外部URLには http:// または https:// で始まるURLを入力してください。"
            );

            elements.externalUrl
                ?.focus();

            return false;

        }

    }
    else {

        showError(
            "作品データの提出方法を選択してください。"
        );

        return false;

    }



    /* -----------------------------------------
       USAGE TERMS
    ----------------------------------------- */

    const requiredTermNames = [

        "commercial_use",

        "modification",

        "setting_modification",

        "destruction_depiction"

    ];


    for (
        const name
        of requiredTermNames
    ) {

        const selected =
            document.querySelector(
                `input[name="${name}"]:checked`
            );


        if (!selected) {

            showError(
                "すべての利用条件を選択してください。"
            );

            return false;

        }

    }



    /* -----------------------------------------
       CREDIT
    ----------------------------------------- */

    const creditType =
        getCreditType();


    if (
        creditType ===
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
                "この作品専用のクレジット表記を入力してください。"
            );

            elements.customCreditText
                ?.focus();

            return false;

        }

    }


    /*
        profileの場合。

        現段階では活動名を暫定値として使用。
    */

    if (
        creditType ===
        "profile"
    ) {

        const creditText =
            getProfileCreditText();


        if (!creditText) {

            showError(
                "プロフィールからクレジット表記を取得できません。別のクレジット設定を選択してください。"
            );

            return false;

        }

    }



    /* -----------------------------------------
       AGREEMENT
    ----------------------------------------- */

    if (
        !elements.agreement
        ?.checked
    ) {

        showError(
            "確認事項に同意してください。"
        );

        return false;

    }


    return true;

}



/* =========================================================
   HANDLE SUBMIT
========================================================= */

async function handleSubmit(
    event
) {

    event.preventDefault();


    if (
        !validateForm()
    ) {

        return;

    }


    setSubmitting(
        true
    );


    clearMessages();


    let uploadedImagePath =
        null;


    let uploadedWorkFilePath =
        null;


    try {

        /* -----------------------------------------
           RECHECK USER
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


        if (!user) {

            throw new Error(
                "ログイン情報を確認できません。"
            );

        }


        currentUser =
            user;



        /* -----------------------------------------
           WORK ID
        ----------------------------------------- */

        const workId =
            createUuid();



        /* -----------------------------------------
           PREVIEW IMAGE
        ----------------------------------------- */

        let imageUrl =
            null;


        const previewFile =
            selectedPreviewImage ||
            elements.imageInput
                ?.files?.[0] ||
            null;


        if (previewFile) {

            const imageResult =
                await uploadPreviewImage(
                    workId,
                    previewFile
                );


            imageUrl =
                imageResult.url;


            uploadedImagePath =
                imageResult.path;

        }



        /* -----------------------------------------
           SUBMISSION DATA
        ----------------------------------------- */

        const submissionType =
            getSubmissionType();


        let filePath =
            null;


        let externalUrl =
            null;


        let originalFilename =
            null;


        let fileSize =
            null;


        let fileType =
            null;



        /* -----------------------------------------
           DIRECT FILE
        ----------------------------------------- */

        if (
            submissionType ===
            "file"
        ) {

            const file =
                selectedWorkFile ||
                elements.workFile
                    ?.files?.[0];


            if (!file) {

                throw new Error(
                    "作品ファイルが選択されていません。"
                );

            }


            const fileResult =
                await uploadWorkFile(
                    workId,
                    file
                );


            filePath =
                fileResult.path;


            uploadedWorkFilePath =
                fileResult.path;


            originalFilename =
                file.name;


            fileSize =
                file.size;


            fileType =
                getFileType(
                    file
                );

        }



        /* -----------------------------------------
           EXTERNAL URL
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


            fileType =
                "external";

        }



        /* -----------------------------------------
           TERMS
        ----------------------------------------- */

        const commercialUse =
            getCheckedValue(
                "commercial_use"
            );


        const modification =
            getCheckedValue(
                "modification"
            );


        const settingModification =
            getCheckedValue(
                "setting_modification"
            );


        const destructionDepiction =
            getCheckedValue(
                "destruction_depiction"
            );



        /* -----------------------------------------
           CREDIT
        ----------------------------------------- */

        const creditType =
            getCreditType();


        const creditText =
            getCreditText();



        /* -----------------------------------------
           PAYLOAD
        ----------------------------------------- */

        const payload = {

            id:
                workId,

            user_id:
                user.id,

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

            status:
                "pending",


            /* DATA */

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


            /* TERMS */

            commercial_use:
                commercialUse,

            modification:
                modification,

            setting_modification:
                settingModification,

            destruction_depiction:
                destructionDepiction,

            other_terms:
                nullableText(
                    elements.otherTerms
                        ?.value
                ),


            /* CREDIT */

            credit_type:
                creditType,

            credit_text:
                creditText

        };


        console.log(
            "MFDCO SUBMIT PAYLOAD:",
            payload
        );



        /* -----------------------------------------
           INSERT
        ----------------------------------------- */

        const {
            error: insertError
        } =
            await window.supabaseClient
                .from("works")
                .insert(
                    payload
                );


        if (insertError) {

            throw insertError;

        }



        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        showSuccess(
            "作品を提出しました。審査完了までお待ちください。"
        );


        resetForm();


        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });


        console.log(
            "MFDCO SUBMIT: completed",
            workId
        );

    }
    catch (error) {

        console.error(
            "WORK SUBMIT ERROR:",
            error
        );


        /*
            DB登録前にStorageだけ成功していた場合、
            アップロード済みデータを削除する。
        */

        await cleanupUploadedFiles(
            uploadedImagePath,
            uploadedWorkFilePath
        );


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
   UPLOAD PREVIEW IMAGE
========================================================= */

async function uploadPreviewImage(
    workId,
    file
) {

    if (!currentUser) {

        throw new Error(
            "ログイン情報がありません。"
        );

    }


    const extension =
        getImageExtension(
            file
        );


    const path =
        `${currentUser.id}/${workId}.${extension}`;


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



    /* -----------------------------------------
       PUBLIC URL
    ----------------------------------------- */

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


    const url =
        data?.publicUrl ||
        null;


    if (!url) {

        throw new Error(
            "プレビュー画像のURLを取得できませんでした。"
        );

    }


    return {
        path,
        url
    };

}



/* =========================================================
   UPLOAD WORK FILE
========================================================= */

async function uploadWorkFile(
    workId,
    file
) {

    if (!currentUser) {

        throw new Error(
            "ログイン情報がありません。"
        );

    }


    const safeFilename =
        sanitizeFilename(
            file.name
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


    /*
        work-files はPRIVATE想定。

        public URLは作らず、
        works.file_path にpathだけ保存する。
    */

    return {
        path
    };

}



/* =========================================================
   CLEANUP
========================================================= */

async function cleanupUploadedFiles(
    imagePath,
    workFilePath
) {

    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    if (imagePath) {

        try {

            const {
                error
            } =
                await window.supabaseClient
                    .storage
                    .from(
                        "work-images"
                    )
                    .remove([
                        imagePath
                    ]);


            if (error) {

                console.error(
                    "IMAGE CLEANUP ERROR:",
                    error
                );

            }

        }
        catch (error) {

            console.error(
                "IMAGE CLEANUP ERROR:",
                error
            );

        }

    }



    /* -----------------------------------------
       WORK FILE
    ----------------------------------------- */

    if (workFilePath) {

        try {

            const {
                error
            } =
                await window.supabaseClient
                    .storage
                    .from(
                        "work-files"
                    )
                    .remove([
                        workFilePath
                    ]);


            if (error) {

                console.error(
                    "WORK FILE CLEANUP ERROR:",
                    error
                );

            }

        }
        catch (error) {

            console.error(
                "WORK FILE CLEANUP ERROR:",
                error
            );

        }

    }

}



/* =========================================================
   CREDIT
========================================================= */

function getProfileCreditText() {

    if (!currentProfile) {

        return null;

    }


    const activityName =
        String(
            currentProfile.activity_name ||
            ""
        ).trim();


    if (!activityName) {

        return null;

    }


    /*
        暫定。

        profilesの正式なクレジットカラムが
        判明したらここを変更する。
    */

    return activityName;

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
   GET CHECKED VALUE
========================================================= */

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
   RESET FORM
========================================================= */

function resetForm() {

    if (!elements.form) {

        return;

    }


    elements.form.reset();


    selectedPreviewImage =
        null;


    selectedWorkFile =
        null;



    /* -----------------------------------------
       DEFAULT SUBMISSION
    ----------------------------------------- */

    const fileRadio =
        document.querySelector(
            'input[name="submission_type"][value="file"]'
        );


    if (fileRadio) {

        fileRadio.checked =
            true;

    }



    /* -----------------------------------------
       DEFAULT CREDIT
    ----------------------------------------- */

    const profileRadio =
        document.querySelector(
            'input[name="credit_type"][value="profile"]'
        );


    if (profileRadio) {

        profileRadio.checked =
            true;

    }



    /* -----------------------------------------
       DEFAULT TERMS
    ----------------------------------------- */

    [
        "commercial_use",
        "modification",
        "setting_modification",
        "destruction_depiction"

    ].forEach(

        function (name) {

            const input =
                document.querySelector(
                    `input[name="${name}"][value="consult"]`
                );


            if (input) {

                input.checked =
                    true;

            }

        }

    );



    /* -----------------------------------------
       IMAGE
    ----------------------------------------- */

    resetImagePreview();



    /* -----------------------------------------
       FILE INFO
    ----------------------------------------- */

    if (
        elements.workFileInfo
    ) {

        elements.workFileInfo.textContent =
            "ファイルを選択してください。";

    }



    /* -----------------------------------------
       UI
    ----------------------------------------- */

    updateSubmissionType();

    updateCreditType();


    /*
        form.reset()でタグも解除されるが、
        明示的に解除。
    */

    if (elements.tags) {

        elements.tags
            .querySelectorAll(
                'input[type="checkbox"]'
            )
            .forEach(
                function (input) {

                    input.checked =
                        false;

                }
            );

    }

}



/* =========================================================
   SUBMITTING STATE
========================================================= */

function setSubmitting(
    isSubmitting
) {

    if (
        !elements.submitButton
    ) {

        return;

    }


    elements.submitButton.disabled =
        isSubmitting;


    elements.submitButton.textContent =
        isSubmitting
            ? "提出中..."
            : "作品を提出する";

}



/* =========================================================
   MESSAGE
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
            "SUBMIT ERROR:",
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

        console.log(
            "SUBMIT SUCCESS:",
            message
        );

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
   FILE EXTENSION
========================================================= */

function getFileExtension(
    filename
) {

    if (!filename) {

        return "";

    }


    const lastDot =
        filename.lastIndexOf(
            "."
        );


    if (
        lastDot === -1 ||
        lastDot === 0 ||
        lastDot ===
            filename.length - 1
    ) {

        return "";

    }


    return filename
        .slice(
            lastDot + 1
        )
        .toLowerCase();

}



/* =========================================================
   IMAGE EXTENSION
========================================================= */

function getImageExtension(
    file
) {

    const fromName =
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
            fromName
        )
    ) {

        if (
            fromName ===
            "jpeg"
        ) {

            return "jpg";

        }


        return fromName;

    }


    switch (
        file.type
    ) {

        case "image/png":

            return "png";


        case "image/webp":

            return "webp";


        case "image/jpeg":

            return "jpg";


        default:

            return "jpg";

    }

}



/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(
    file
) {

    const extension =
        getFileExtension(
            file.name
        );


    if (extension) {

        return extension;

    }


    if (file.type) {

        return file.type;

    }


    return "unknown";

}



/* =========================================================
   SAFE FILENAME
========================================================= */

function sanitizeFilename(
    filename
) {

    const original =
        String(
            filename ||
            "work-file"
        );


    const extension =
        getFileExtension(
            original
        );


    let basename =
        original;


    if (extension) {

        basename =
            original.slice(
                0,
                -(
                    extension.length +
                    1
                )
            );

    }


    basename =
        basename
            .normalize("NFKC")
            .replace(
                /[\\/:*?"<>|]/g,
                "_"
            )
            .replace(
                /\s+/g,
                "_"
            )
            .replace(
                /_+/g,
                "_"
            )
            .replace(
                /^\.+|\.+$/g,
                ""
            )
            .slice(
                0,
                100
            );


    if (!basename) {

        basename =
            "work-file";

    }


    if (extension) {

        const safeExtension =
            extension
                .replace(
                    /[^a-zA-Z0-9]/g,
                    ""
                )
                .slice(
                    0,
                    20
                );


        if (safeExtension) {

            return (
                basename +
                "." +
                safeExtension
            );

        }

    }


    return basename;

}



/* =========================================================
   FILE SIZE
========================================================= */

function formatFileSize(
    bytes
) {

    if (
        !Number.isFinite(
            bytes
        ) ||
        bytes < 0
    ) {

        return "";

    }


    if (
        bytes <
        1024
    ) {

        return `${bytes} B`;

    }


    const kb =
        bytes /
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


    const gb =
        mb /
        1024;


    return `${gb.toFixed(2)} GB`;

}



/* =========================================================
   NULLABLE TEXT
========================================================= */

function nullableText(
    value
) {

    const text =
        String(
            value ?? ""
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


    /*
        古いブラウザ向けフォールバック
    */

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

    if (!error) {

        return "作品の提出中にエラーが発生しました。";

    }


    const message =
        String(
            error.message ||
            error.error_description ||
            error.details ||
            ""
        ).trim();


    if (!message) {

        return "作品の提出中にエラーが発生しました。";

    }


    /*
        Supabaseの代表的なエラーを
        少し分かりやすくする。
    */

    if (
        message.includes(
            "Bucket not found"
        )
    ) {

        return "Storageバケットが見つかりません。Supabaseの work-images / work-files バケットを確認してください。";

    }


    if (
        message.includes(
            "row-level security"
        )
    ) {

        return "Supabaseのアクセス権限により処理が拒否されました。RLSポリシーを確認してください。";

    }


    if (
        message.includes(
            "duplicate key"
        )
    ) {

        return "同じデータがすでに存在しています。もう一度提出してください。";

    }


    if (
        message.includes(
            "column"
        ) &&
        message.includes(
            "does not exist"
        )
    ) {

        return `worksテーブルのカラム構成が現在の投稿フォームと一致していません。Supabaseを確認してください。詳細: ${message}`;

    }


    return message;

}



/* =========================================================
   AUTH STATE CHANGE
========================================================= */

function setupAuthListener() {

    if (
        !window.supabaseClient
    ) {

        return;

    }


    window.supabaseClient
        .auth
        .onAuthStateChange(
            function (
                event,
                session
            ) {

                console.log(
                    "MFDCO SUBMIT AUTH:",
                    event
                );


                /*
                    SIGNED_OUT
                */

                if (
                    event ===
                    "SIGNED_OUT"
                ) {

                    currentUser =
                        null;


                    currentProfile =
                        null;


                    showLoggedOut();

                    return;

                }


                /*
                    SIGNED_IN / USER_UPDATED
                */

                if (
                    event ===
                        "SIGNED_IN" ||
                    event ===
                        "USER_UPDATED"
                ) {

                    currentUser =
                        session?.user ||
                        null;


                    if (
                        currentUser
                    ) {

                        setTimeout(
                            async function () {

                                await loadCurrentProfile();

                                showLoggedIn();

                            },
                            0
                        );

                    }

                }

            }
        );

}



/* =========================================================
   START AUTH LISTENER

   DOMに依存しないため、ここで登録してよい。
   updateSubmissionType() 等はここでは絶対に呼ばない。
========================================================= */

setupAuthListener();



/* =========================================================
   READY
========================================================= */

console.log(
    "MFDCO submit-work.js loaded successfully."
);