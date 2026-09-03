/* =========================================
   MFDCO AUTH SYSTEM
   ========================================= */


/* =========================================
   ELEMENTS
   ========================================= */

const loginForm =
    document.getElementById("login-form");

const registerForm =
    document.getElementById("register-form");

const loginPanel =
    document.getElementById("login-panel");

const registerPanel =
    document.getElementById("register-panel");

const showRegister =
    document.getElementById("show-register");

const showLogin =
    document.getElementById("show-login");


/* =========================================
   PANEL SWITCH
   ========================================= */

if (showRegister) {

    showRegister.addEventListener(
        "click",
        () => {

            loginPanel.classList.remove("active");

            registerPanel.classList.add("active");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


if (showLogin) {

    showLogin.addEventListener(
        "click",
        () => {

            registerPanel.classList.remove("active");

            loginPanel.classList.add("active");

            window.scrollTo({
                top: 0,
                behavior: "smooth"
            });

        }
    );

}


/* =========================================
   PASSWORD CONFIRMATION
   ========================================= */

const password =
    document.getElementById("password");

const passwordConfirm =
    document.getElementById("password-confirm");

const passwordError =
    document.getElementById("password-error");


function checkPassword() {

    if (!password || !passwordConfirm) {
        return true;
    }


    if (
        passwordConfirm.value &&
        password.value !== passwordConfirm.value
    ) {

        passwordError.textContent =
            "パスワードが一致していません。";

        passwordConfirm.setCustomValidity(
            "パスワードが一致していません。"
        );

        return false;

    }


    passwordError.textContent = "";

    passwordConfirm.setCustomValidity("");

    return true;

}


if (password) {

    password.addEventListener(
        "input",
        checkPassword
    );

}


if (passwordConfirm) {

    passwordConfirm.addEventListener(
        "input",
        checkPassword
    );

}


/* =========================================
   CREDIT TEXT
   ========================================= */

const creditText =
    document.getElementById("credit-text");

const creditRadios =
    document.querySelectorAll(
        'input[name="credit-type"]'
    );


creditRadios.forEach(
    radio => {

        radio.addEventListener(
            "change",
            () => {

                if (!creditText) {
                    return;
                }

                if (radio.value === "custom") {

                    if (radio.checked) {

                        creditText.disabled = false;

                        creditText.required = true;

                    }

                } else {

                    if (radio.checked) {

                        creditText.disabled = true;

                        creditText.required = false;

                        creditText.value = "";

                    }

                }

            }
        );

    }
);


/* =========================================
   IMAGE PREVIEW
   ========================================= */

function setupImagePreview(
    inputId,
    previewId
) {

    const input =
        document.getElementById(inputId);

    const preview =
        document.getElementById(previewId);


    if (!input || !preview) {
        return;
    }


    input.addEventListener(
        "change",
        () => {

            const file =
                input.files[0];


            if (!file) {

                preview.src = "";

                return;

            }


            if (!file.type.startsWith("image/")) {

                input.value = "";

                alert(
                    "画像ファイルを選択してください。"
                );

                return;

            }


            const url =
                URL.createObjectURL(file);


            preview.src = url;

        }
    );

}


setupImagePreview(
    "icon",
    "icon-preview"
);


setupImagePreview(
    "flag",
    "flag-preview"
);


/* =========================================
   IMAGE UPLOAD
   ========================================= */

async function uploadImage(
    file,
    bucket,
    userId,
    filename
) {

    if (!file) {
        return null;
    }


    const path =
        `${userId}/${filename}`;


    const {
        error
    } =
        await supabaseClient
            .storage
            .from(bucket)
            .upload(
                path,
                file,
                {
                    upsert: false,
                    contentType: file.type
                }
            );


    if (error) {

        throw error;

    }


    const {
        data
    } =
        supabaseClient
            .storage
            .from(bucket)
            .getPublicUrl(path);


    return data.publicUrl;

}


/* =========================================
   REGISTER
   ========================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!checkPassword()) {
                return;
            }


            const submitButton =
                registerForm.querySelector(
                    ".join-submit"
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "登録しています...";

            }


            try {

                const formData =
                    new FormData(registerForm);


                const email =
                    formData.get("email");

                const passwordValue =
                    formData.get("password");

                const activityName =
                    formData.get(
                        "activity_name"
                    );


                const iconFile =
                    document.getElementById(
                        "icon"
                    )?.files[0];


                const flagFile =
                    document.getElementById(
                        "flag"
                    )?.files[0];


                /*
                 * Authユーザー作成
                 */

                const {
                    data: authData,
                    error: authError
                } =
                    await supabaseClient.auth.signUp({

                        email: email,

                        password: passwordValue

                    });


                if (authError) {

                    throw authError;

                }


                const user =
                    authData.user;


                if (!user) {

                    throw new Error(
                        "ユーザー作成に失敗しました。"
                    );

                }


                /*
                 * アイコン
                 */

                let iconUrl = null;


                if (iconFile) {

                    iconUrl =
                        await uploadImage(
                            iconFile,
                            "mfdco-avatars",
                            user.id,
                            "icon"
                        );

                }


                /*
                 * 国旗
                 */

                let flagUrl = null;


                if (flagFile) {

                    flagUrl =
                        await uploadImage(
                            flagFile,
                            "mfdco-flags",
                            user.id,
                            "flag"
                        );

                }


                /*
                 * タグ
                 */

                const tags =
                    formData.getAll("tags");


                /*
                 * クレジット
                 */

                const creditType =
                    formData.get(
                        "credit-type"
                    );


                const creditValue =
                    creditType === "custom"
                        ? formData.get("credit_text")
                        : null;


                /*
                 * プロフィール更新
                 */

                const {
                    error: profileError
                } =
                    await supabaseClient
                        .from("profiles")
                        .update({

                            activity_name:
                                activityName,

                            icon_url:
                                iconUrl,

                            fictional_country:
                                formData.get(
                                    "fictional_country"
                                ) || null,

                            flag_url:
                                flagUrl,

                            credit_type:
                                creditType,

                            credit_text:
                                creditValue,

                            tags:
                                tags,

                            bio:
                                formData.get(
                                    "bio"
                                ) || null,

                            agreement:
                                true,

                            agreement_at:
                                new Date().toISOString()

                        })
                        .eq(
                            "id",
                            user.id
                        );


                if (profileError) {

                    throw profileError;

                }


                /*
                 * 登録完了
                 */

                alert(
                    "MFDCOへの登録が完了しました。"
                );


                /*
                 * Discord案内
                 *
                 * 現時点では仮URL。
                 * 後で管理側の設定に変更する。
                 */

                window.location.href =
                    "join-complete.html";


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                alert(
                    "登録中にエラーが発生しました。\n\n" +
                    error.message
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "MFDCOに参加する";

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
        async event => {

            event.preventDefault();


            const email =
                document.getElementById(
                    "login-email"
                ).value;


            const password =
                document.getElementById(
                    "login-password"
                ).value;


            const submitButton =
                loginForm.querySelector(
                    ".join-submit"
                );


            if (submitButton) {

                submitButton.disabled = true;

                submitButton.textContent =
                    "ログインしています...";

            }


            try {

                const {
                    error
                } =
                    await supabaseClient.auth
                        .signInWithPassword({

                            email:
                                email,

                            password:
                                password

                        });


                if (error) {

                    throw error;

                }


                /*
                 * マイページへ
                 */

                window.location.href =
                    "mypage.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                alert(
                    "ログインできませんでした。\n\n" +
                    error.message
                );


                if (submitButton) {

                    submitButton.disabled =
                        false;

                    submitButton.textContent =
                        "ログイン";

                }

            }

        }
    );

}