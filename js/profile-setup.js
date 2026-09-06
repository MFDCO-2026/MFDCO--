/* =========================================
   MFDCO PROFILE SETUP
   ========================================= */

"use strict";


/* =========================================
   ELEMENTS
   ========================================= */

const profileForm =
    document.querySelector(
        "#profile-setup-form"
    );

const profileLoading =
    document.querySelector(
        "#profile-loading"
    );

const profileError =
    document.querySelector(
        "#profile-error"
    );

const profileErrorMessage =
    document.querySelector(
        "#profile-error-message"
    );

const iconInput =
    document.querySelector(
        "#icon"
    );

const iconPreview =
    document.querySelector(
        "#icon-preview"
    );

const flagInput =
    document.querySelector(
        "#flag"
    );

const flagPreview =
    document.querySelector(
        "#flag-preview"
    );

const creditText =
    document.querySelector(
        "#credit-text"
    );


let currentUser =
    null;


/* =========================================
   SUPABASE CHECK
   ========================================= */

function isSupabaseReady() {

    return (
        typeof window.supabaseClient !==
        "undefined"
    );

}


/* =========================================
   SHOW ERROR
   ========================================= */

function showPageError(message) {

    if (profileLoading) {

        profileLoading.hidden =
            true;

    }


    if (profileForm) {

        profileForm.hidden =
            true;

    }


    if (profileError) {

        profileError.hidden =
            false;

    }


    if (profileErrorMessage) {

        profileErrorMessage.textContent =
            message;

    }

}


/* =========================================
   IMAGE PREVIEW
   ========================================= */

function setupImagePreview(
    input,
    preview
) {

    if (
        !input ||
        !preview
    ) {

        return;

    }


    input.addEventListener(
        "change",
        function () {

            const file =
                input.files &&
                input.files[0];


            if (!file) {

                preview.removeAttribute(
                    "src"
                );

                preview.classList.remove(
                    "visible"
                );

                return;

            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                alert(
                    "画像ファイルを選択してください。"
                );

                input.value =
                    "";

                return;

            }


            const reader =
                new FileReader();


            reader.onload =
                function (event) {

                    preview.src =
                        event.target.result;

                    preview.classList.add(
                        "visible"
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


setupImagePreview(
    iconInput,
    iconPreview
);


setupImagePreview(
    flagInput,
    flagPreview
);


/* =========================================
   CREDIT TYPE
   ========================================= */

const creditTypeInputs =
    document.querySelectorAll(
        'input[name="credit-type"]'
    );


creditTypeInputs.forEach(
    function (radio) {

        radio.addEventListener(
            "change",
            function () {

                if (!creditText) {

                    return;

                }


                if (
                    radio.value ===
                    "custom"
                ) {

                    creditText.disabled =
                        false;

                    creditText.focus();

                } else {

                    creditText.disabled =
                        true;

                    creditText.value =
                        "";

                }

            }
        );

    }
);


/* =========================================
   IMAGE VALIDATION
   ========================================= */

function validateImage(
    file,
    required,
    type
) {

    if (!file) {

        if (required) {

            return {

                valid:
                    false,

                message:
                    type === "icon"
                        ? "アイコン画像を選択してください。"
                        : "画像を選択してください。"

            };

        }


        return {

            valid:
                true

        };

    }


    const allowedTypes = [

        "image/jpeg",
        "image/png",
        "image/webp"

    ];


    if (
        !allowedTypes.includes(
            file.type
        )
    ) {

        return {

            valid:
                false,

            message:
                "JPEG、PNG、WebP形式のみ使用できます。"

        };

    }


    const maxSize =
        5 * 1024 * 1024;


    if (
        file.size >
        maxSize
    ) {

        return {

            valid:
                false,

            message:
                "画像サイズは5MB以下にしてください。"

        };

    }


    return {

        valid:
            true

    };

}


/* =========================================
   FILE EXTENSION
   ========================================= */

function getFileExtension(file) {

    const extensions = {

        "image/jpeg":
            "jpg",

        "image/png":
            "png",

        "image/webp":
            "webp"

    };


    return (
        extensions[file.type] ||
        "png"
    );

}


/* =========================================
   STORAGE UPLOAD
   ========================================= */

async function uploadMemberImage(
    bucket,
    userId,
    file,
    fileName
) {

    if (!file) {

        return null;

    }


    const extension =
        getFileExtension(
            file
        );


    const path =
        userId +
        "/" +
        fileName +
        "." +
        extension;


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
                        true,

                    contentType:
                        file.type

                }
            );


    if (error) {

        throw new Error(
            bucket +
            "へのアップロードに失敗しました: " +
            error.message
        );

    }


    const {
        data
    } =
        window.supabaseClient
            .storage
            .from(
                bucket
            )
            .getPublicUrl(
                path
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            "画像の公開URLを取得できませんでした。"
        );

    }


    return data.publicUrl;

}


/* =========================================
   GET AUTHENTICATED USER
   ========================================= */

async function getAuthenticatedUser() {

    /*
     * メール確認URLから戻った直後は
     * Supabase SDKがURL内の認証情報を
     * セッションへ反映するまで
     * わずかな時間差が出る場合があるため
     * 数秒間確認する。
     */

    for (
        let attempt = 0;
        attempt < 20;
        attempt += 1
    ) {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (
            !error &&
            data &&
            data.user
        ) {

            return data.user;

        }


        await new Promise(
            function (resolve) {

                window.setTimeout(
                    resolve,
                    250
                );

            }
        );

    }


    return null;

}


/* =========================================
   INITIALIZE
   ========================================= */

async function initializeProfileSetup() {

    if (!isSupabaseReady()) {

        showPageError(
            "Supabaseとの接続設定を確認してください。"
        );

        return;

    }


    try {

        currentUser =
            await getAuthenticatedUser();


        if (!currentUser) {

            showPageError(
                "ログイン状態を確認できませんでした。" +
                "メールの確認リンクをもう一度開くか、" +
                "ログイン画面からログインしてください。"
            );

            return;

        }


        console.log(
            "Authenticated user:",
            currentUser.id
        );


        /*
         * 既にプロフィールが存在する場合は
         * 二重登録を防止してマイページへ。
         */

        const {
            data: existingProfile,
            error: existingProfileError
        } =
            await window.supabaseClient
                .from(
                    "profiles"
                )
                .select(
                    "id"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (existingProfileError) {

            throw existingProfileError;

        }


        if (existingProfile) {

            window.location.href =
                "mypage.html";

            return;

        }


        if (profileLoading) {

            profileLoading.hidden =
                true;

        }


        if (profileForm) {

            profileForm.hidden =
                false;

        }


    } catch (error) {

        console.error(
            "Profile setup initialize error:",
            error
        );


        showPageError(
            error.message ||
            "プロフィール登録画面の読み込みに失敗しました。"
        );

    }

}


/* =========================================
   PROFILE SUBMIT
   ========================================= */

if (profileForm) {

    profileForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            if (!currentUser) {

                alert(
                    "ログイン状態を確認できません。"
                );

                return;

            }


            const iconFile =
                iconInput &&
                iconInput.files &&
                iconInput.files[0]
                    ? iconInput.files[0]
                    : null;


            const flagFile =
                flagInput &&
                flagInput.files &&
                flagInput.files[0]
                    ? flagInput.files[0]
                    : null;


            const iconValidation =
                validateImage(
                    iconFile,
                    true,
                    "icon"
                );


            if (
                !iconValidation.valid
            ) {

                alert(
                    iconValidation.message
                );

                return;

            }


            const flagValidation =
                validateImage(
                    flagFile,
                    false,
                    "flag"
                );


            if (
                !flagValidation.valid
            ) {

                alert(
                    flagValidation.message
                );

                return;

            }


            const formData =
                new FormData(
                    profileForm
                );


            const activityName =
                String(
                    formData.get(
                        "activity_name"
                    ) ||
                    ""
                ).trim();


            if (!activityName) {

                alert(
                    "活動名を入力してください。"
                );

                return;

            }


            const fictionalCountry =
                String(
                    formData.get(
                        "fictional_country"
                    ) ||
                    ""
                ).trim() ||
                null;


            const creditType =
                formData.get(
                    "credit-type"
                );


            if (!creditType) {

                alert(
                    "クレジット表記を選択してください。"
                );

                return;

            }


            const creditTextValue =
                creditType ===
                "custom"
                    ? (
                        String(
                            formData.get(
                                "credit_text"
                            ) ||
                            ""
                        ).trim() ||
                        null
                    )
                    : null;


            if (
                creditType ===
                    "custom" &&
                !creditTextValue
            ) {

                alert(
                    "希望するクレジット表記を入力してください。"
                );

                return;

            }


            const checkedTags =
                document.querySelectorAll(
                    'input[name="tags"]:checked'
                );


            const tags =
                Array.from(
                    checkedTags
                ).map(
                    function (element) {

                        return element.value;

                    }
                );


            const bio =
                String(
                    formData.get(
                        "bio"
                    ) ||
                    ""
                ).trim() ||
                null;


            const submitButton =
                profileForm.querySelector(
                    'button[type="submit"]'
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "登録しています...";

            }


            try {

                /*
                 * ICON
                 */

                const iconUrl =
                    await uploadMemberImage(
                        "member-icons",
                        currentUser.id,
                        iconFile,
                        "icon"
                    );


                /*
                 * FLAG
                 */

                let flagUrl =
                    null;


                if (flagFile) {

                    flagUrl =
                        await uploadMemberImage(
                            "member-flags",
                            currentUser.id,
                            flagFile,
                            "flag"
                        );

                }


                /*
                 * AGREEMENT
                 *
                 * アカウント作成時に利用規約への
                 * 同意を必須にしている。
                 */

                let agreementAt =
                    new Date()
                        .toISOString();


                if (
                    currentUser
                        .user_metadata &&
                    currentUser
                        .user_metadata
                        .mfdco_agreement_at
                ) {

                    agreementAt =
                        currentUser
                            .user_metadata
                            .mfdco_agreement_at;

                }


                /*
                 * PROFILE
                 *
                 * statusは指定しない。
                 * DB側のdefault "pending" を使用する。
                 */

                const profileData = {

                    id:
                        currentUser.id,

                    activity_name:
                        activityName,

                    icon_url:
                        iconUrl,

                    fictional_country:
                        fictionalCountry,

                    flag_url:
                        flagUrl,

                    credit_type:
                        creditType,

                    credit_text:
                        creditTextValue,

                    tags:
                        tags,

                    bio:
                        bio,

                    agreement:
                        true,

                    agreement_at:
                        agreementAt

                };


                const {
                    error: profileSaveError
                } =
                    await window.supabaseClient
                        .from(
                            "profiles"
                        )
                        .upsert(
                            profileData,
                            {

                                onConflict:
                                    "id"

                            }
                        );


                if (profileSaveError) {

                    throw new Error(
                        "プロフィールの保存に失敗しました: " +
                        profileSaveError.message
                    );

                }


                /*
                 * PENDING EMAIL DATA CLEAR
                 */

                try {

                    sessionStorage.removeItem(
                        "mfdco_pending_email"
                    );

                    sessionStorage.removeItem(
                        "mfdco_email_redirect"
                    );

                } catch (storageError) {

                    console.warn(
                        "Session storage clear error:",
                        storageError
                    );

                }


                alert(
                    "MFDCOへの参加登録が完了しました。"
                );


                window.location.href =
                    "mypage.html";


            } catch (error) {

                console.error(
                    "Profile setup error:",
                    error
                );


                alert(
                    "プロフィール登録に失敗しました。\n\n" +
                    (
                        error.message ||
                        "不明なエラーです。"
                    )
                );


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalText;

                }

            }

        }
    );

}


/* =========================================
   START
   ========================================= */

initializeProfileSetup();


console.log(
    "MFDCO profile-setup.js loaded successfully."
);


