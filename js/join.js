/* =========================================
   MFDCO JOIN / LOGIN
   ========================================= */

"use strict";


/* =========================================
   ELEMENTS
   ========================================= */

const loginForm =
    document.querySelector("#login-form");

const registerForm =
    document.querySelector("#register-form");

const showRegisterButton =
    document.querySelector("#show-register");

const showLoginButton =
    document.querySelector("#show-login");

const loginPanel =
    document.querySelector("#login-panel");

const registerPanel =
    document.querySelector("#register-panel");

const passwordInput =
    document.querySelector("#password");

const passwordConfirmInput =
    document.querySelector("#password-confirm");

const passwordError =
    document.querySelector("#password-error");

const iconInput =
    document.querySelector("#icon");

const iconPreview =
    document.querySelector("#icon-preview");

const flagInput =
    document.querySelector("#flag");

const flagPreview =
    document.querySelector("#flag-preview");

const creditText =
    document.querySelector("#credit-text");


/* =========================================
   SUPABASE CHECK
   ========================================= */

function isSupabaseReady() {

    if (
        typeof window.supabase === "undefined"
    ) {

        console.error(
            "Supabase SDK が読み込まれていません。"
        );

        return false;

    }


    if (
        typeof window.supabaseClient ===
        "undefined"
    ) {

        console.error(
            "supabaseClient が読み込まれていません。"
        );

        return false;

    }


    return true;

}


/* =========================================
   LOGIN / REGISTER SWITCH
   ========================================= */

if (
    showRegisterButton &&
    loginPanel &&
    registerPanel
) {

    showRegisterButton.addEventListener(
        "click",
        function () {

            loginPanel.classList.remove(
                "active"
            );

            registerPanel.classList.add(
                "active"
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


if (
    showLoginButton &&
    loginPanel &&
    registerPanel
) {

    showLoginButton.addEventListener(
        "click",
        function () {

            registerPanel.classList.remove(
                "active"
            );

            loginPanel.classList.add(
                "active"
            );

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================
   PASSWORD CHECK
   ========================================= */

function checkPassword() {

    if (
        !passwordInput ||
        !passwordConfirmInput ||
        !passwordError
    ) {

        return true;

    }


    if (
        passwordConfirmInput.value === ""
    ) {

        passwordError.textContent = "";

        return true;

    }


    if (
        passwordInput.value !==
        passwordConfirmInput.value
    ) {

        passwordError.textContent =
            "パスワードが一致していません。";

        return false;

    }


    passwordError.textContent = "";

    return true;

}


if (passwordInput) {

    passwordInput.addEventListener(
        "input",
        checkPassword
    );

}


if (passwordConfirmInput) {

    passwordConfirmInput.addEventListener(
        "input",
        checkPassword
    );

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

                input.value = "";

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


            reader.readAsDataURL(file);

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
                    radio.value === "custom"
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

                valid: false,

                message:
                    type === "icon"
                        ? "アイコン画像を選択してください。"
                        : "画像を選択してください。"

            };

        }

        return {

            valid: true

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

            valid: false,

            message:
                "JPEG、PNG、WebP形式のみ使用できます。"

        };

    }


    const maxSize =
        5 * 1024 * 1024;


    if (
        file.size > maxSize
    ) {

        return {

            valid: false,

            message:
                "画像サイズは5MB以下にしてください。"

        };

    }


    return {

        valid: true

    };

}


/* =========================================
   FILE EXTENSION
   ========================================= */

function getFileExtension(file) {

    if (!file) {

        return "png";

    }


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
        getFileExtension(file);


    const path =
        userId +
        "/" +
        fileName +
        "." +
        extension;


    console.log(
        "アップロード:",
        bucket,
        path
    );


    const {
        error
    } =
        await window.supabaseClient
            .storage
            .from(bucket)
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


    console.log(
        "アップロード完了:",
        path
    );


    const {
        data
    } =
        window.supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(
                path
            );


    if (
        !data ||
        !data.publicUrl
    ) {

        throw new Error(
            bucket +
            "の公開URLを取得できませんでした。"
        );

    }


    return data.publicUrl;

}


/* =========================================
   REGISTRATION
   ========================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            event.stopPropagation();


            console.log(
                "MFDCO登録処理を開始"
            );


            /* =============================
               SUPABASE
            ============================= */

            if (!isSupabaseReady()) {

                alert(
                    "Supabaseとの接続設定を確認してください。"
                );

                return;

            }


            /* =============================
               PASSWORD
            ============================= */

            if (!checkPassword()) {

                if (passwordConfirmInput) {

                    passwordConfirmInput.focus();

                }

                return;

            }


            /* =============================
               AGREEMENT
            ============================= */

            const agreement =
                document.querySelector(
                    "#agreement"
                );


            if (
                !agreement ||
                !agreement.checked
            ) {

                alert(
                    "MFDCO利用規約への同意が必要です。"
                );

                return;

            }


            /* =============================
               FILE
            ============================= */

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


            /* =============================
               FORM DATA
            ============================= */

            const formData =
                new FormData(
                    registerForm
                );


            const email =
                String(
                    formData.get("email") ||
                    ""
                ).trim();


            const userPassword =
                String(
                    formData.get("password") ||
                    ""
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


            const creditTextValue =
                creditType === "custom"
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


            const bio =
                String(
                    formData.get("bio") ||
                    ""
                ).trim() ||
                null;


            /* =============================
               TAGS
            ============================= */

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


            /* =============================
               BUTTON
            ============================= */

            const submitButton =
                registerForm.querySelector(
                    'button[type="submit"]'
                );


            const originalButtonText =
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

                /* =============================
                   1. AUTH USER
                ============================= */

                console.log(
                    "Authユーザーを作成中..."
                );


                const {
                    data: authData,
                    error: authError
                } =
                    await window.supabaseClient
                        .auth
                        .signUp({

                            email:
                                email,

                            password:
                                userPassword

                        });


                if (authError) {

                    throw authError;

                }


                if (
                    !authData ||
                    !authData.user
                ) {

                    throw new Error(
                        "ユーザー作成後の情報を取得できませんでした。"
                    );

                }


                const userId =
                    authData.user.id;


                console.log(
                    "Auth user created:",
                    authData.user
                );


                console.log(
                    "Auth session:",
                    authData.session
                );


                /* =============================
                   SESSION CHECK
                ============================= */

                if (!authData.session) {

                    throw new Error(
                        "アカウントは作成されましたが、ログインセッションがありません。"
                    );

                }


                console.log(
                    "認証セッションを確認しました。"
                );


                /* =============================
                   2. ICON
                ============================= */

                console.log(
                    "アイコンをアップロード中..."
                );


                const iconUrl =
                    await uploadMemberImage(
                        "member-icons",
                        userId,
                        iconFile,
                        "icon"
                    );


                console.log(
                    "アイコンURL:",
                    iconUrl
                );


                /* =============================
                   3. FLAG
                ============================= */

                let flagUrl =
                    null;


                if (flagFile) {

                    console.log(
                        "国旗をアップロード中..."
                    );


                    flagUrl =
                        await uploadMemberImage(
                            "member-flags",
                            userId,
                            flagFile,
                            "flag"
                        );


                    console.log(
                        "国旗URL:",
                        flagUrl
                    );

                }


                /* =============================
                   4. PROFILE
                   INSERTではなくUPSERT
                ============================= */

                console.log(
                    "プロフィールを保存中..."
                );


                const profileData = {

                    id:
                        userId,

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
                        new Date()
                            .toISOString(),

                    status:
                        "pending"

                };


                console.log(
                    "プロフィールデータ:",
                    profileData
                );


                const {
                    error:
                        profileError
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


                if (
                    profileError
                ) {

                    throw new Error(
                        "プロフィールの保存に失敗しました: " +
                        profileError.message
                    );

                }


                console.log(
                    "プロフィール保存完了"
                );


                /* =============================
                   5. SUCCESS
                ============================= */

                console.log(
                    "プロフィール保存完了"
                );

                console.log(
                    "登録完了:",
                    userId
                );


                /*
                * 登録直後は signUp() が作成した
                * セッションをそのまま利用する。
                *
                * Confirm email が OFF の場合、
                * authData.session が存在するため
                * そのままマイページへ移動できる。
                */

                if (!authData.session) {

                    throw new Error(
                        "アカウントは作成されましたが、ログインセッションを取得できませんでした。"
                    );

                }


                /*
                * マイページへ移動
                 */

                window.location.href =
                    "mypage.html";


            } finally {

                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        originalButtonText;

                }

            }

        }
    );

}


/* =========================================
   LOGIN
   ========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();

            event.stopPropagation();


            console.log(
                "ログイン処理を開始"
            );


            if (!isSupabaseReady()) {

                alert(
                    "Supabaseとの接続設定を確認してください。"
                );

                return;

            }


            const formData =
                new FormData(
                    loginForm
                );


            const email =
                String(
                    formData.get("email") ||
                    ""
                ).trim();


            const userPassword =
                String(
                    formData.get("password") ||
                    ""
                );


            if (
                !email ||
                !userPassword
            ) {

                alert(
                    "メールアドレスとパスワードを入力してください。"
                );

                return;

            }


            const submitButton =
                loginForm.querySelector(
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
                    "ログインしています...";

            }


            try {

                /* =============================
                   AUTH LOGIN
                ============================= */

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                userPassword

                        });


                if (error) {

                    throw error;

                }


                console.log(
                    "ログイン成功:",
                    data.user
                );


                /* =============================
                   PROFILE CHECK
                ============================= */

                const {
                    data:
                        profile,
                    error:
                        profileError
                } =
                    await window.supabaseClient
                        .from(
                            "profiles"
                        )
                        .select(
                            "status"
                        )
                        .eq(
                            "id",
                            data.user.id
                        )
                        .maybeSingle();


                if (profileError) {

                    console.error(
                        "Profile check error:",
                        profileError
                    );

                    throw new Error(
                        "プロフィール情報を取得できませんでした。"
                    );

                }


                /* =============================
                   PROFILE NOT FOUND
                ============================= */

                if (!profile) {

                    alert(
                        "プロフィールが登録されていません。\n参加登録をやり直してください。"
                    );

                    await window.supabaseClient
                        .auth
                        .signOut();

                    return;

                }


                /* =============================
                   REJECTED
                ============================= */

                if (
                    profile.status ===
                    "rejected"
                ) {

                    alert(
                        "このアカウントは現在利用できません。"
                    );

                    await window.supabaseClient
                        .auth
                        .signOut();

                    return;

                }


                /* =============================
                   MYPAGE
                ============================= */

                window.location.href =
                    "mypage.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "ログインに失敗しました。\n\n" +
                    getSupabaseErrorMessage(
                        error
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
   REGISTRATION COMPLETE
   ========================================= */

function showRegistrationComplete() {

    if (!registerPanel) {

        alert(
            "登録は完了しました。"
        );

        return;

    }


    registerPanel.innerHTML = `

        <div class="registration-complete">

            <p class="section-label">
                REGISTRATION RECEIVED
            </p>

            <h1>
                参加登録を受け付けました
            </h1>

            <p>
                MFDCOへの参加登録が完了しました。
            </p>

            <p>
                現在、運営による確認待ちです。
                承認されるまでDiscordへの参加はできません。
            </p>

            <div class="registration-status">

                <span>
                    STATUS
                </span>

                <strong>
                    PENDING
                </strong>

            </div>

            <p class="form-note">
                運営による確認が完了するまでお待ちください。
            </p>

            <a
                href="index.html"
                class="join-submit"
            >
                MFDCOトップページへ
            </a>

        </div>

    `;

}


/* =========================================
   ERROR MESSAGE
   ========================================= */

function getSupabaseErrorMessage(error) {

    if (!error) {

        return "不明なエラーです。";

    }


    if (
        error.message
    ) {

        return error.message;

    }


    return "不明なエラーです。";

}


/* =========================================
   LOADED
   ========================================= */

console.log(
    "MFDCO join.js loaded successfully."
);