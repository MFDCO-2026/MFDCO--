/* =========================================
   MFDCO PROFILE EDIT
   ========================================= */

"use strict";


/* =========================================
   ELEMENTS
   ========================================= */

const loading =
    document.querySelector("#profile-edit-loading");

const errorPanel =
    document.querySelector("#profile-edit-error");

const errorMessage =
    document.querySelector("#profile-edit-error-text");

const successPanel =
    document.querySelector("#profile-edit-success");

const form =
    document.querySelector("#profile-edit-form");

const saveButton =
    document.querySelector("#save-profile-button");


/* =========================================
   FORM ELEMENTS
   ========================================= */

const activityNameInput =
    document.querySelector("#activity-name");


/* =========================================
   ICON
   ========================================= */

const iconFileInput =
    document.querySelector("#icon-file");

const iconPreview =
    document.querySelector("#icon-preview");


/* =========================================
   COUNTRY
   ========================================= */

const fictionalCountryInput =
    document.querySelector("#fictional-country");

const flagFileInput =
    document.querySelector("#flag-file");

const flagPreviewWrap =
    document.querySelector("#flag-preview-wrap");

const flagPreview =
    document.querySelector("#flag-preview");


/* =========================================
   CREDIT
   ========================================= */

const creditTypeInput =
    document.querySelector("#credit-type");

const creditTextGroup =
    document.querySelector("#credit-text-group");

const creditTextInput =
    document.querySelector("#credit-text");


/* =========================================
   TAGS
   ========================================= */

const tagsInput =
    document.querySelector("#tags");


/* =========================================
   BIO
   ========================================= */

const bioInput =
    document.querySelector("#bio");


/* =========================================
   ACCOUNT
   ========================================= */

const accountEmail =
    document.querySelector("#account-email");


/* =========================================
   CONSTANTS
   ========================================= */

const STORAGE_BUCKET =
    "profile-images";

const DEFAULT_ICON =
    "assets/default-icon.png";

const MAX_FILE_SIZE =
    5 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/png",
    "image/jpeg",
    "image/webp"
];


/* =========================================
   SUPABASE CHECK
   ========================================= */

function isSupabaseReady() {

    if (
        typeof window.supabaseClient ===
        "undefined"
    ) {

        console.error(
            "PROFILE EDIT ERROR: supabaseClient がありません。"
        );

        return false;

    }

    return true;

}


/* =========================================
   ERROR
   ========================================= */

function showError(message) {

    console.error(
        "PROFILE EDIT ERROR:",
        message
    );


    if (loading) {

        loading.hidden = true;

    }


    if (form) {

        form.hidden = false;

    }


    if (successPanel) {

        successPanel.hidden = true;

    }


    if (errorPanel) {

        errorPanel.hidden = false;

    }


    if (errorMessage) {

        errorMessage.textContent =
            message ||
            "エラーが発生しました。";

    }

}


/* =========================================
   SUCCESS
   ========================================= */

function showSuccess() {

    if (errorPanel) {

        errorPanel.hidden = true;

    }


    if (successPanel) {

        successPanel.hidden = false;

    }


    setTimeout(
        function () {

            if (successPanel) {

                successPanel.hidden = true;

            }

        },
        3000
    );

}


/* =========================================
   SAVE LOADING
   ========================================= */

function setSaveLoading(isLoading) {

    if (!saveButton) {

        return;

    }


    saveButton.disabled =
        isLoading;


    if (isLoading) {

        saveButton.dataset.originalText =
            saveButton.innerHTML;

        saveButton.innerHTML =
            "保存しています...";

    } else {

        saveButton.innerHTML =
            saveButton.dataset.originalText ||
            "プロフィールを保存 <span>→</span>";

    }

}


/* =========================================
   FILE VALIDATION
   ========================================= */

function validateImageFile(file) {

    if (!file) {

        return true;

    }


    if (
        !ALLOWED_TYPES.includes(
            file.type
        )
    ) {

        throw new Error(
            "画像はPNG・JPEG・WebPのみアップロードできます。"
        );

    }


    if (
        file.size >
        MAX_FILE_SIZE
    ) {

        throw new Error(
            "画像サイズは5MB以下にしてください。"
        );

    }


    return true;

}


/* =========================================
   IMAGE PREVIEW
   ========================================= */

function previewImage(
    file,
    previewElement,
    defaultImage
) {

    if (!previewElement) {

        return;

    }


    if (!file) {

        if (defaultImage) {

            previewElement.src =
                defaultImage;

        } else {

            previewElement.removeAttribute(
                "src"
            );

        }

        return;

    }


    const objectUrl =
        URL.createObjectURL(file);


    previewElement.src =
        objectUrl;


    previewElement.onload =
        function () {

            URL.revokeObjectURL(
                objectUrl
            );

        };

}


/* =========================================
   ICON PREVIEW
   ========================================= */

if (iconFileInput) {

    iconFileInput.addEventListener(
        "change",
        function () {

            const file =
                iconFileInput.files[0];

            try {

                validateImageFile(
                    file
                );

                previewImage(
                    file,
                    iconPreview,
                    DEFAULT_ICON
                );

            } catch (error) {

                alert(
                    error.message
                );

                iconFileInput.value =
                    "";

                if (iconPreview) {

                    iconPreview.src =
                        DEFAULT_ICON;

                }

            }

        }
    );

}


/* =========================================
   FLAG PREVIEW
   ========================================= */

if (flagFileInput) {

    flagFileInput.addEventListener(
        "change",
        function () {

            const file =
                flagFileInput.files[0];

            try {

                validateImageFile(
                    file
                );

                if (!file) {

                    if (flagPreviewWrap) {

                        flagPreviewWrap.hidden =
                            true;

                    }

                    return;

                }


                previewImage(
                    file,
                    flagPreview,
                    null
                );


                if (flagPreviewWrap) {

                    flagPreviewWrap.hidden =
                        false;

                }

            } catch (error) {

                alert(
                    error.message
                );

                flagFileInput.value =
                    "";

                if (flagPreviewWrap) {

                    flagPreviewWrap.hidden =
                        true;

                }

            }

        }
    );

}


/* =========================================
   CREDIT UI
   ========================================= */

function updateCreditUI() {

    if (
        !creditTypeInput ||
        !creditTextGroup
    ) {

        return;

    }


    if (
        creditTypeInput.value ===
        "custom"
    ) {

        creditTextGroup.hidden =
            false;

    } else {

        creditTextGroup.hidden =
            true;

        if (creditTextInput) {

            creditTextInput.value =
                "";

        }

    }

}


if (creditTypeInput) {

    creditTypeInput.addEventListener(
        "change",
        updateCreditUI
    );

}


/* =========================================
   TAGS
   ========================================= */

function tagsToInput(tags) {

    if (
        !Array.isArray(tags)
    ) {

        return "";

    }


    return tags
        .map(
            function (tag) {

                return String(
                    tag
                ).trim();

            }
        )
        .filter(
            function (tag) {

                return tag.length > 0;

            }
        )
        .join(",");

}


function inputToTags(value) {

    if (!value) {

        return [];

    }


    return value
        .split(",")
        .map(
            function (tag) {

                return tag.trim();

            }
        )
        .filter(
            function (tag) {

                return tag.length > 0;

            }
        )
        .slice(0, 20);

}


/* =========================================
   CURRENT USER
   ========================================= */

async function getCurrentUser() {

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


    if (
        !data ||
        !data.user
    ) {

        throw new Error(
            "ログインしてください。"
        );

    }


    return data.user;

}


/* =========================================
   LOAD PROFILE
   ========================================= */

async function loadProfile(user) {

    console.log(
        "プロフィールを取得中..."
    );


    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("profiles")
            .select(
                `
                id,
                activity_name,
                icon_url,
                fictional_country,
                flag_url,
                credit_type,
                credit_text,
                tags,
                bio,
                status,
                created_at
                `
            )
            .eq(
                "id",
                user.id
            )
            .maybeSingle();


    if (error) {

        throw error;

    }


    if (!data) {

        throw new Error(
            "プロフィール情報が見つかりません。"
        );

    }


    return data;

}


/* =========================================
   RENDER FORM
   ========================================= */

function renderForm(
    profile,
    user
) {

    if (!profile) {

        throw new Error(
            "プロフィール情報がありません。"
        );

    }


    /* =====================================
       ACTIVITY NAME
    ====================================== */

    if (activityNameInput) {

        activityNameInput.value =
            profile.activity_name ||
            "";

    }


    /* =====================================
       ICON
    ====================================== */

    if (iconPreview) {

        iconPreview.src =
            profile.icon_url ||
            DEFAULT_ICON;

        iconPreview.alt =
            profile.activity_name ||
            "";

    }


    /* =====================================
       COUNTRY
    ====================================== */

    if (fictionalCountryInput) {

        fictionalCountryInput.value =
            profile.fictional_country ||
            "";

    }


    /* =====================================
       FLAG
    ====================================== */

    if (flagPreviewWrap) {

        if (profile.flag_url) {

            flagPreview.src =
                profile.flag_url;

            flagPreview.alt =
                profile.fictional_country ||
                "";

            flagPreviewWrap.hidden =
                false;

        } else {

            flagPreviewWrap.hidden =
                true;

        }

    }


    /* =====================================
       CREDIT
    ====================================== */

    if (creditTypeInput) {

        creditTypeInput.value =
            profile.credit_type ||
            "none";

    }


    if (creditTextInput) {

        creditTextInput.value =
            profile.credit_text ||
            "";

    }


    updateCreditUI();


    /* =====================================
       TAGS
    ====================================== */

    if (tagsInput) {

        tagsInput.value =
            tagsToInput(
                profile.tags
            );

    }


    /* =====================================
       BIO
    ====================================== */

    if (bioInput) {

        bioInput.value =
            profile.bio ||
            "";

    }


    /* =====================================
       EMAIL
    ====================================== */

    if (accountEmail) {

        accountEmail.textContent =
            user.email ||
            "-";

    }


    /* =====================================
       SHOW
    ====================================== */

    if (loading) {

        loading.hidden =
            true;

    }


    if (form) {

        form.hidden =
            false;

    }


    console.log(
        "プロフィール編集フォーム表示完了"
    );

}


/* =========================================
   VALIDATION
   ========================================= */

function validateForm() {

    if (!activityNameInput) {

        return false;

    }


    const activityName =
        activityNameInput.value.trim();


    if (!activityName) {

        alert(
            "活動名を入力してください。"
        );

        activityNameInput.focus();

        return false;

    }


    if (
        activityName.length >
        100
    ) {

        alert(
            "活動名は100文字以内で入力してください。"
        );

        activityNameInput.focus();

        return false;

    }


    try {

        if (
            iconFileInput &&
            iconFileInput.files[0]
        ) {

            validateImageFile(
                iconFileInput.files[0]
            );

        }


        if (
            flagFileInput &&
            flagFileInput.files[0]
        ) {

            validateImageFile(
                flagFileInput.files[0]
            );

        }

    } catch (error) {

        alert(
            error.message
        );

        return false;

    }


    /* =====================================
       CREDIT
    ====================================== */

    if (
        creditTypeInput &&
        creditTypeInput.value ===
        "custom"
    ) {

        if (
            !creditTextInput ||
            !creditTextInput.value.trim()
        ) {

            alert(
                "クレジット表記を入力してください。"
            );

            if (creditTextInput) {

                creditTextInput.focus();

            }

            return false;

        }

    }


    return true;

}


/* =========================================
   UPLOAD IMAGE
   ========================================= */

async function uploadProfileImage(
    file,
    userId,
    type
) {

    if (!file) {

        return null;

    }


    validateImageFile(
        file
    );


    const extensionMap = {

        "image/png":
            "png",

        "image/jpeg":
            "jpg",

        "image/webp":
            "webp"

    };


    const extension =
        extensionMap[file.type];


    if (!extension) {

        throw new Error(
            "対応していない画像形式です。"
        );

    }


    const fileName =
        `${type}-${Date.now()}.${extension}`;


    const filePath =
        `${userId}/${fileName}`;


    console.log(
        "画像アップロード:",
        filePath
    );


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .upload(
                filePath,
                file,
                {
                    cacheControl:
                        "3600",

                    contentType:
                        file.type,

                    upsert:
                        false
                }
            );


    if (error) {

        throw error;

    }


    const {
        data
    } =
        window.supabaseClient
            .storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(
                filePath
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "画像URLを取得できませんでした。"
        );

    }


    console.log(
        "画像アップロード成功:",
        data.publicUrl
    );


    return data.publicUrl;

}


/* =========================================
   SAVE PROFILE
   ========================================= */

async function saveProfile() {

    if (!isSupabaseReady()) {

        throw new Error(
            "Supabaseが初期化されていません。"
        );

    }


    const user =
        await getCurrentUser();


    /* =====================================
       BASIC
    ====================================== */

    const activityName =
        activityNameInput
            ? activityNameInput.value.trim()
            : "";


    /* =====================================
       IMAGE FILES
    ====================================== */

    const iconFile =
        iconFileInput &&
        iconFileInput.files[0]
            ? iconFileInput.files[0]
            : null;


    const flagFile =
        flagFileInput &&
        flagFileInput.files[0]
            ? flagFileInput.files[0]
            : null;


    /* =====================================
       UPLOAD
    ====================================== */

    let iconUrl =
        null;

    let flagUrl =
        null;


    if (iconFile) {

        iconUrl =
            await uploadProfileImage(
                iconFile,
                user.id,
                "icon"
            );

    }


    if (flagFile) {

        flagUrl =
            await uploadProfileImage(
                flagFile,
                user.id,
                "flag"
            );

    }


    /* =====================================
       COUNTRY
    ====================================== */

    const fictionalCountry =
        fictionalCountryInput
            ? fictionalCountryInput.value.trim()
            : "";


    /* =====================================
       CREDIT
    ====================================== */

    const creditType =
        creditTypeInput
            ? creditTypeInput.value
            : "none";


    const creditText =
        creditType === "custom" &&
        creditTextInput
            ? creditTextInput.value.trim()
            : null;


    /* =====================================
       TAGS
    ====================================== */

    const tags =
        tagsInput
            ? inputToTags(
                tagsInput.value
            )
            : [];


    /* =====================================
       BIO
    ====================================== */

    const bio =
        bioInput
            ? bioInput.value.trim()
            : "";


    /* =====================================
       UPDATE DATA
    ====================================== */

    const profileUpdate = {

        activity_name:
            activityName,

        fictional_country:
            fictionalCountry || null,

        credit_type:
            creditType,

        credit_text:
            creditText,

        tags:
            tags,

        bio:
            bio || null

    };


    /*
     * 新しい画像がある場合のみ
     * URLを更新する
     */

    if (iconUrl) {

        profileUpdate.icon_url =
            iconUrl;

    }


    if (flagUrl) {

        profileUpdate.flag_url =
            flagUrl;

    }


    console.log(
        "プロフィール保存:",
        profileUpdate
    );


    /* =====================================
       DATABASE UPDATE
    ====================================== */

    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("profiles")
            .update(
                profileUpdate
            )
            .eq(
                "id",
                user.id
            )
            .select()
            .single();


    if (error) {

        throw error;

    }


    console.log(
        "プロフィール保存成功:",
        data
    );


    return data;

}


/* =========================================
   FORM SUBMIT
   ========================================= */

if (form) {

    form.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            if (!validateForm()) {

                return;

            }


            const confirmed =
                window.confirm(
                    "プロフィールを保存しますか？"
                );


            if (!confirmed) {

                return;

            }


            setSaveLoading(
                true
            );


            try {

                await saveProfile();


                showSuccess();


                /*
                 * ヘッダー更新
                 */

                if (
                    typeof window.updateHeaderMember ===
                    "function"
                ) {

                    await window.updateHeaderMember();

                }


            } catch (error) {

                console.error(
                    "プロフィール保存エラー:",
                    error
                );


                showError(
                    error.message ||
                    "プロフィールの保存に失敗しました。"
                );

            } finally {

                setSaveLoading(
                    false
                );

            }

        }
    );

}


/* =========================================
   LOAD PROFILE EDIT
   ========================================= */

async function loadProfileEdit() {

    console.log(
        "MFDCO PROFILE EDIT: 初期化開始"
    );


    try {

        if (!isSupabaseReady()) {

            throw new Error(
                "Supabaseが初期化されていません。"
            );

        }


        const user =
            await getCurrentUser();


        console.log(
            "編集ユーザー:",
            user.id
        );


        const profile =
            await loadProfile(
                user
            );


        renderForm(
            profile,
            user
        );


        console.log(
            "MFDCO PROFILE EDIT: 初期化完了"
        );


    } catch (error) {

        console.error(
            "Profile Edit error:",
            error
        );


        showError(
            error.message ||
            "プロフィールを読み込めませんでした。"
        );

    }

}


/* =========================================
   START
   ========================================= */

loadProfileEdit();


console.log(
    "MFDCO profile-edit.js loaded successfully."
);