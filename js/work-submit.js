"use strict";

/* =========================================================
   MFDCO - SUBMIT WORK
========================================================= */

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_WORK_FILE_SIZE = 500 * 1024 * 1024;

const WORK_IMAGE_BUCKET = "work-images";
const PRIVATE_WORK_BUCKET = "work-files";
const PUBLIC_WORK_BUCKET = "work-files-public";

let currentUser = null;
let currentProfile = null;
let selectedPreviewImage = null;
let selectedWorkFile = null;

const elements = {};


/* =========================================================
   DOM READY
========================================================= */

document.addEventListener(
    "DOMContentLoaded",
    async () => {

        cacheElements();

        setupEvents();

        renderTags();

        updateSubmissionType();

        updateDownloadAccessHelp();

        updateCreditType();

        await initializePage();

    }
);


/* =========================================================
   CACHE ELEMENTS
========================================================= */

function cacheElements() {

    elements.loading =
        document.getElementById(
            "submit-loading"
        );

    elements.loginRequired =
        document.getElementById(
            "login-required"
        );

    elements.form =
        document.getElementById(
            "work-form"
        );

    elements.providerName =
        document.getElementById(
            "provider-name"
        );


    elements.title =
        document.getElementById(
            "work-title"
        );

    elements.description =
        document.getElementById(
            "work-description"
        );


    elements.previewImageInput =
        document.getElementById(
            "preview-image"
        );

    elements.imagePreview =
        document.getElementById(
            "image-preview"
        );

    elements.removeImageButton =
        document.getElementById(
            "remove-image"
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


    elements.downloadAccessHelp =
        document.getElementById(
            "download-access-help"
        );

    elements.downloadAccessHelpTitle =
        document.getElementById(
            "download-access-help-title"
        );

    elements.downloadAccessHelpText =
        document.getElementById(
            "download-access-help-text"
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


    elements.agreement =
        document.getElementById(
            "work-agreement"
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
            "submit-button"
        );

    elements.submitButtonText =
        document.getElementById(
            "submit-button-text"
        );

}


/* =========================================================
   EVENTS
========================================================= */

function setupEvents() {

    elements.form
        ?.addEventListener(
            "submit",
            handleSubmit
        );


    document
        .querySelectorAll(
            'input[name="submission_type"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateSubmissionType
                );

            }
        );


    document
        .querySelectorAll(
            'input[name="download_access"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateDownloadAccessHelp
                );

            }
        );


    document
        .querySelectorAll(
            'input[name="credit_type"]'
        )
        .forEach(
            input => {

                input.addEventListener(
                    "change",
                    updateCreditType
                );

            }
        );


    elements.previewImageInput
        ?.addEventListener(
            "change",
            handleImageSelection
        );


    elements.removeImageButton
        ?.addEventListener(
            "click",
            clearSelectedImage
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

async function initializePage() {

    try {

        if (
            !window.supabaseClient
        ) {

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


        if (
            error
        ) {

            console.warn(
                "AUTH CHECK:",
                error
            );

        }


        currentUser =
            data?.user ||
            null;


        if (
            !currentUser
        ) {

            showLoggedOut();

            return;

        }


        await loadCurrentProfile();


        showForm();

    }
    catch (
        error
    ) {

        console.error(
            "SUBMIT WORK INIT ERROR:",
            error
        );


        showLoggedOut();


        showError(
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


    if (
        !currentUser
    ) {

        return;

    }


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


    if (
        error
    ) {

        console.warn(
            "PROFILE LOAD ERROR:",
            error
        );

    }


    currentProfile =
        data ||
        null;


    if (
        elements.providerName
    ) {

        elements.providerName.textContent =
            currentProfile?.activity_name ||
            currentUser.email ||
            "MFDCO MEMBER";

    }


    renderProfileCredit();

}


/* =========================================================
   TAGS
========================================================= */

function renderTags() {

    if (
        !elements.tags
    ) {

        return;

    }


    if (
        typeof window.renderMfdcoWorkTags ===
        "function"
    ) {

        window.renderMfdcoWorkTags(
            elements.tags,
            {
                inputName:
                    "work_tags"
            }
        );

        return;

    }


    if (
        typeof window.MFDCO_TAGS !==
            "undefined" &&
        Array.isArray(
            window.MFDCO_TAGS
        )
    ) {

        elements.tags.innerHTML =
            "";


        for (
            const tag
            of window.MFDCO_TAGS
        ) {

            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "work-tag-option";


            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "checkbox";

            input.name =
                "work_tags";

            input.value =
                tag;


            const text =
                document.createElement(
                    "span"
                );


            text.textContent =
                tag;


            label.append(
                input,
                text
            );


            elements.tags
                .appendChild(
                    label
                );

        }


        return;

    }


    console.warn(
        "タグ描画関数またはMFDCO_TAGSが見つかりません。"
    );

}


/* =========================================================
   GET SELECTED TAGS
========================================================= */

function getSelectedTags() {

    if (
        !elements.tags
    ) {

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

        elements.tags
            .querySelectorAll(
                'input[type="checkbox"]:checked'
            )

    ).map(
        input =>
            input.value
    );

}


/* =========================================================
   IMAGE
========================================================= */

function handleImageSelection(
    event
) {

    clearMessages();


    const file =
        event.target
            .files?.[0] ||
        null;


    selectedPreviewImage =
        null;


    if (
        !file
    ) {

        setNoImage();

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


        setNoImage();


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


        setNoImage();


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
        () => {

            if (
                elements.imagePreview
            ) {

                elements.imagePreview.src =
                    String(
                        reader.result
                    );

            }

        };


    reader.readAsDataURL(
        file
    );

}


/* =========================================================
   CLEAR IMAGE
========================================================= */

function clearSelectedImage() {

    selectedPreviewImage =
        null;


    if (
        elements.previewImageInput
    ) {

        elements.previewImageInput.value =
            "";

    }


    setNoImage();

}


/* =========================================================
   NO IMAGE
========================================================= */

function setNoImage() {

    if (
        elements.imagePreview
    ) {

        elements.imagePreview.src =
            "assets/noimage.png";

    }

}


/* =========================================================
   WORK FILE
========================================================= */

function handleWorkFileSelection(
    event
) {

    clearMessages();


    const file =
        event.target
            .files?.[0] ||
        null;


    selectedWorkFile =
        null;


    if (
        !file
    ) {

        if (
            elements.workFileInfo
        ) {

            elements.workFileInfo.textContent =
                "ファイルは選択されていません。";

        }


        return;

    }


    if (
        file.size >
        MAX_WORK_FILE_SIZE
    ) {

        event.target.value =
            "";


        showError(
            "作品ファイルは500MB以下にしてください。"
        );


        if (
            elements.workFileInfo
        ) {

            elements.workFileInfo.textContent =
                "ファイルは選択されていません。";

        }


        return;

    }


    selectedWorkFile =
        file;


    if (
        elements.workFileInfo
    ) {

        elements.workFileInfo.textContent =
            `${file.name} / ${getFileType(file)} / ${formatFileSize(file.size)}`;

    }

}


/* =========================================================
   SUBMISSION TYPE
========================================================= */

function getSubmissionType() {

    return (
        getCheckedValue(
            "submission_type"
        ) ||
        "file"
    );

}


function updateSubmissionType() {

    const type =
        getSubmissionType();


    const isFile =
        type ===
        "file";


    if (
        elements.directFileArea
    ) {

        elements.directFileArea.hidden =
            !isFile;

    }


    if (
        elements.externalUrlArea
    ) {

        elements.externalUrlArea.hidden =
            isFile;

    }


    if (
        elements.workFile
    ) {

        elements.workFile.required =
            isFile;

    }


    if (
        elements.externalUrl
    ) {

        elements.externalUrl.required =
            !isFile;

    }

}


/* =========================================================
   DOWNLOAD ACCESS
========================================================= */

function getDownloadAccess() {

    return (
        getCheckedValue(
            "download_access"
        ) ||
        "user"
    );

}


function updateDownloadAccessHelp() {

    if (
        !elements.downloadAccessHelpTitle ||
        !elements.downloadAccessHelpText
    ) {

        return;

    }


    const access =
        getDownloadAccess();


    const descriptions = {

        public: {

            title:
                "🌐 ログイン不要",

            text:
                "MFDCOへログインしていない人でも、この作品を取得できます。"

        },


        user: {

            title:
                "🔐 ログインユーザー",

            text:
                "MFDCOへログインしているユーザーが、この作品を取得できます。"

        },


        member: {

            title:
                "🔒 加盟国・許可ユーザー",

            text:
                "MFDCOから許可されたユーザーのみ、この作品を取得できます。"

        },


        private: {

            title:
                "非公開",

            text:
                "作品ページを公開していても、作品データ自体はダウンロードできません。"

        }

    };


    const info =
        descriptions[
            access
        ] ||
        descriptions.user;


    elements.downloadAccessHelpTitle.textContent =
        info.title;


    elements.downloadAccessHelpText.textContent =
        info.text;

}


/* =========================================================
   CREDIT
========================================================= */

function getCreditType() {

    return (
        getCheckedValue(
            "credit_type"
        ) ||
        "none"
    );

}


function updateCreditType() {

    const type =
        getCreditType();


    if (
        elements.profileCreditArea
    ) {

        elements.profileCreditArea.hidden =
            type !==
            "profile";

    }


    if (
        elements.customCreditArea
    ) {

        elements.customCreditArea.hidden =
            type !==
            "custom";

    }


    if (
        elements.customCreditText
    ) {

        elements.customCreditText.required =
            type ===
            "custom";

    }


    renderProfileCredit();

}


/* =========================================================
   PROFILE CREDIT
========================================================= */

function renderProfileCredit() {

    if (
        !elements.profileCreditText
    ) {

        return;

    }


    elements.profileCreditText.textContent =
        String(
            currentProfile
                ?.activity_name ||
            ""
        ).trim() ||
        "プロフィールの活動名を取得できません。";

}


/* =========================================================
   CREDIT TEXT
========================================================= */

function getCreditText() {

    switch (
        getCreditType()
    ) {

        case "profile":

            return nullableText(
                currentProfile
                    ?.activity_name
            );


        case "custom":

            return nullableText(
                elements.customCreditText
                    ?.value
            );


        case "none":

        case "free":

        default:

            return null;

    }

}


/* =========================================================
   VALIDATION
========================================================= */

function validateForm() {

    clearMessages();


    if (
        !currentUser
    ) {

        showError(
            "ログインが必要です。"
        );

        return false;

    }


    const title =
        String(
            elements.title
                ?.value ||
            ""
        ).trim();


    if (
        !title
    ) {

        showError(
            "作品名を入力してください。"
        );


        elements.title
            ?.focus();


        return false;

    }


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


        if (
            !file
        ) {

            showError(
                "作品ファイルを選択してください。"
            );

            return false;

        }


        if (
            file.size >
            MAX_WORK_FILE_SIZE
        ) {

            showError(
                "作品ファイルは500MB以下にしてください。"
            );

            return false;

        }

    }


    if (
        submissionType ===
        "url"
    ) {

        const url =
            String(
                elements.externalUrl
                    ?.value ||
                ""
            ).trim();


        if (
            !url
        ) {

            showError(
                "外部URLを入力してください。"
            );

            return false;

        }


        if (
            !isValidHttpUrl(
                url
            )
        ) {

            showError(
                "外部URLには http:// または https:// で始まるURLを入力してください。"
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
            !getCheckedValue(
                name
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
            "custom" &&
        !nullableText(
            elements.customCreditText
                ?.value
        )
    ) {

        showError(
            "クレジット書式を入力してください。"
        );

        return false;

    }


    if (
        getCreditType() ===
            "profile" &&
        !nullableText(
            currentProfile
                ?.activity_name
        )
    ) {

        showError(
            "プロフィールの活動名を取得できません。別のクレジット設定を選択してください。"
        );

        return false;

    }


    if (
        !elements.agreement
            ?.checked
    ) {

        showError(
            "作品掲載への同意が必要です。"
        );

        return false;

    }


    return true;

}


/* =========================================================
   SUBMIT
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


    const workId =
        createUuid();


    let uploadedImagePath =
        null;


    let uploadedWorkFilePath =
        null;


    let uploadedWorkFileBucket =
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


        if (
            userError
        ) {

            throw userError;

        }


        const user =
            data?.user;


        if (
            !user ||
            user.id !==
                currentUser?.id
        ) {

            throw new Error(
                "ログイン情報を確認できませんでした。"
            );

        }


        /* -----------------------------------------
           IMAGE
        ----------------------------------------- */

        let imageUrl =
            null;


        const imageFile =
            selectedPreviewImage ||
            elements.previewImageInput
                ?.files?.[0] ||
            null;


        if (
            imageFile
        ) {

            const result =
                await uploadPreviewImage(
                    workId,
                    imageFile
                );


            uploadedImagePath =
                result.path;


            imageUrl =
                result.url;

        }


        /* -----------------------------------------
           WORK DATA
        ----------------------------------------- */

        const submissionType =
            getSubmissionType();


        const downloadAccess =
            getDownloadAccess();


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
           FILE
        ----------------------------------------- */

        if (
            submissionType ===
            "file"
        ) {

            const file =
                selectedWorkFile ||
                elements.workFile
                    ?.files?.[0] ||
                null;


            if (
                !file
            ) {

                throw new Error(
                    "作品ファイルを選択してください。"
                );

            }


            const bucket =
                getWorkBucket(
                    downloadAccess
                );


            const result =
                await uploadWorkFile(
                    workId,
                    file,
                    bucket
                );


            uploadedWorkFilePath =
                result.path;


            uploadedWorkFileBucket =
                bucket;


            filePath =
                result.path;


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
           URL
        ----------------------------------------- */

        else {

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
           DATABASE PAYLOAD
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


            download_access:
                downloadAccess,


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


        console.log(
            "MFDCO SUBMIT PAYLOAD:",
            payload
        );


        /* -----------------------------------------
           DATABASE INSERT
        ----------------------------------------- */

        const {
            error: insertError
        } =
            await window.supabaseClient
                .from(
                    "works"
                )
                .insert(
                    payload
                );


        if (
            insertError
        ) {

            throw insertError;

        }


        /* -----------------------------------------
           SUCCESS
        ----------------------------------------- */

        resetForm();


        showSuccess(
            "作品を受け付けました。管理者による確認後、提供作品一覧へ掲載されます。"
        );


        window.scrollTo({

            top:
                Math.max(
                    (
                        elements.success
                            ?.offsetTop ||
                        0
                    ) -
                    120,
                    0
                ),

            behavior:
                "smooth"

        });

    }
    catch (
        error
    ) {

        console.error(
            "SUBMIT WORK ERROR:",
            error
        );


        /*
         * DB登録に失敗した場合、
         * 新しくアップロードしたファイルだけ削除。
         */

        if (
            uploadedImagePath
        ) {

            await removeStorageFile(
                WORK_IMAGE_BUCKET,
                uploadedImagePath
            );

        }


        if (
            uploadedWorkFilePath &&
            uploadedWorkFileBucket
        ) {

            await removeStorageFile(
                uploadedWorkFileBucket,
                uploadedWorkFilePath
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
   UPLOAD PREVIEW IMAGE
========================================================= */

async function uploadPreviewImage(
    workId,
    file
) {

    const extension =
        getImageExtension(
            file
        );


    const path =
        `${currentUser.id}/${workId}-${createUuid()}.${extension}`;


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                WORK_IMAGE_BUCKET
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


    if (
        error
    ) {

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
                WORK_IMAGE_BUCKET
            )
            .getPublicUrl(
                path
            );


    if (
        !data?.publicUrl
    ) {

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
    file,
    bucket
) {

    const filename =
        getSafeStorageFilename(
            file
        );


    const path =
        `${currentUser.id}/${workId}/${createUuid()}-${filename}`;


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(
                bucket
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


    if (
        error
    ) {

        throw new Error(
            `作品ファイルのアップロードに失敗しました: ${error.message}`
        );

    }


    return {

        path:
            path,

        bucket:
            bucket

    };

}


/* =========================================================
   WORK BUCKET
========================================================= */

function getWorkBucket(
    access
) {

    return (
        access ===
        "public"
    )
        ? PUBLIC_WORK_BUCKET
        : PRIVATE_WORK_BUCKET;

}


/* =========================================================
   REMOVE STORAGE FILE
========================================================= */

async function removeStorageFile(
    bucket,
    path
) {

    if (
        !bucket ||
        !path
    ) {

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


        if (
            error
        ) {

            console.warn(
                `STORAGE REMOVE ERROR (${bucket}):`,
                error
            );

        }

    }
    catch (
        error
    ) {

        console.warn(
            `STORAGE REMOVE ERROR (${bucket}):`,
            error
        );

    }

}


/* =========================================================
   RESET FORM
========================================================= */

function resetForm() {

    elements.form
        ?.reset();


    selectedPreviewImage =
        null;


    selectedWorkFile =
        null;


    setNoImage();


    if (
        elements.workFileInfo
    ) {

        elements.workFileInfo.textContent =
            "ファイルは選択されていません。";

    }


    elements.tags
        ?.querySelectorAll(
            'input[type="checkbox"]'
        )
        .forEach(
            input => {

                input.checked =
                    false;

            }
        );


    setRadioValue(
        "submission_type",
        "file"
    );


    setRadioValue(
        "download_access",
        "user"
    );


    setRadioValue(
        "commercial_use",
        "allow"
    );


    setRadioValue(
        "modification",
        "allow"
    );


    setRadioValue(
        "setting_modification",
        "allow"
    );


    setRadioValue(
        "destruction_depiction",
        "allow"
    );


    setRadioValue(
        "credit_type",
        "none"
    );


    updateSubmissionType();

    updateDownloadAccessHelp();

    updateCreditType();

}


/* =========================================================
   SHOW FORM
========================================================= */

function showForm() {

    if (
        elements.loading
    ) {

        elements.loading.hidden =
            true;

    }


    if (
        elements.loginRequired
    ) {

        elements.loginRequired.hidden =
            true;

    }


    if (
        elements.form
    ) {

        elements.form.hidden =
            false;

    }

}


/* =========================================================
   SHOW LOGGED OUT
========================================================= */

function showLoggedOut() {

    if (
        elements.loading
    ) {

        elements.loading.hidden =
            true;

    }


    if (
        elements.form
    ) {

        elements.form.hidden =
            true;

    }


    if (
        elements.loginRequired
    ) {

        elements.loginRequired.hidden =
            false;

    }

}


/* =========================================================
   SUBMIT STATE
========================================================= */

function setSubmitting(
    value
) {

    if (
        elements.submitButton
    ) {

        elements.submitButton.disabled =
            value;

    }


    if (
        elements.submitButtonText
    ) {

        elements.submitButtonText.textContent =
            value
                ? "送信中..."
                : "作品を提出する";

    }

}


/* =========================================================
   MESSAGES
========================================================= */

function clearMessages() {

    if (
        elements.error
    ) {

        elements.error.hidden =
            true;


        elements.error.textContent =
            "";

    }


    if (
        elements.success
    ) {

        elements.success.hidden =
            true;


        elements.success.textContent =
            "";

    }

}


function showError(
    message
) {

    if (
        !elements.error
    ) {

        console.error(
            message
        );

        return;

    }


    elements.error.textContent =
        message;


    elements.error.hidden =
        false;


    if (
        elements.success
    ) {

        elements.success.hidden =
            true;

    }

}


function showSuccess(
    message
) {

    if (
        !elements.success
    ) {

        return;

    }


    elements.success.textContent =
        message;


    elements.success.hidden =
        false;


    if (
        elements.error
    ) {

        elements.error.hidden =
            true;

    }

}


/* =========================================================
   RADIO HELPERS
========================================================= */

function setRadioValue(
    name,
    value
) {

    const input =
        document.querySelector(
            `input[name="${name}"][value="${value}"]`
        );


    if (
        input
    ) {

        input.checked =
            true;

    }

}


function getCheckedValue(
    name
) {

    return (
        document.querySelector(
            `input[name="${name}"]:checked`
        )
            ?.value ||
        null
    );

}


/* =========================================================
   TEXT HELPERS
========================================================= */

function nullableText(
    value
) {

    const text =
        String(
            value ??
            ""
        ).trim();


    return (
        text ||
        null
    );

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
        ]
            .includes(
                fromName
            )
    ) {

        return (
            fromName ===
            "jpeg"
        )
            ? "jpg"
            : fromName;

    }


    switch (
        file.type
    ) {

        case "image/jpeg":

            return "jpg";


        case "image/webp":

            return "webp";


        default:

            return "png";

    }

}


/* =========================================================
   FILE EXTENSION
========================================================= */

function getFileExtension(
    filename
) {

    const parts =
        String(
            filename ||
            ""
        )
            .split(
                "."
            );


    return (
        parts.length >
        1
    )
        ? String(
            parts.pop()
        ).toLowerCase()
        : "";

}


/* =========================================================
   FILE TYPE
========================================================= */

function getFileType(
    file
) {

    const extension =
        getFileExtension(
            file?.name
        );


    if (
        extension
    ) {

        return extension
            .toUpperCase();

    }


    return (
        file?.type ||
        "FILE"
    );

}


/* =========================================================
   SAFE STORAGE FILENAME
========================================================= */

function getSafeStorageFilename(
    file
) {

    const original =
        String(
            file?.name ||
            "file"
        );


    const normalized =
        original
            .normalize(
                "NFKC"
            )
            .replace(
                /[\\/:*?"<>|#%{}[\]`~&+]/g,
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
                /^_+|_+$/g,
                ""
            );


    return (
        normalized ||
        "file"
    );

}


/* =========================================================
   FORMAT FILE SIZE
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
        value <
        0
    ) {

        return "-";

    }


    if (
        value ===
        0
    ) {

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
                Math.log(
                    value
                ) /
                Math.log(
                    1024
                )
            ),

            units.length -
            1

        );


    const size =
        value /
        Math.pow(
            1024,
            index
        );


    return (
        `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
    );

}


/* =========================================================
   UUID
========================================================= */

function createUuid() {

    if (
        crypto
            ?.randomUUID
    ) {

        return crypto
            .randomUUID();

    }


    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
        .replace(

            /[xy]/g,

            char => {

                const random =
                    Math.random() *
                    16 |
                    0;


                const value =
                    char ===
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

    if (
        !error
    ) {

        return "不明なエラーが発生しました。";

    }


    if (
        typeof error ===
        "string"
    ) {

        return error;

    }


    return (
        error.message ||
        error.error_description ||
        "処理中にエラーが発生しました。"
    );

}


console.log(
    "MFDCO submit-work.js loaded."
);