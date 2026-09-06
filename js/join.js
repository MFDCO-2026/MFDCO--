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
        typeof window.supabaseClient === "undefined"
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
   REGISTRATION
   ========================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            if (!isSupabaseReady()) {

                alert(
                    "Supabaseとの接続設定を確認してください。"
                );

                return;

            }


            if (!checkPassword()) {

                if (passwordConfirmInput) {

                    passwordConfirmInput.focus();

                }

                return;

            }


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


            if (
                !email ||
                !userPassword
            ) {

                alert(
                    "メールアドレスとパスワードを入力してください。"
                );

                return;

            }


            if (
                userPassword.length < 8
            ) {

                alert(
                    "パスワードは8文字以上で設定してください。"
                );

                return;

            }


            const submitButton =
                registerForm.querySelector(
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
                    "送信しています...";

            }


            try {

                /*
                 * 現在開いているサイトを基準に
                 * メール確認後の戻り先を生成する。
                 *
                 * https://mfdco.net/ でも
                 * GitHub Pages / localhost でも動作可能。
                 */

                const emailRedirectTo =
                    new URL(
                        "profile-setup.html",
                        window.location.href
                    ).href;


                console.log(
                    "Email redirect:",
                    emailRedirectTo
                );


                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signUp({

                            email:
                                email,

                            password:
                                userPassword,

                            options: {

                                emailRedirectTo:
                                    emailRedirectTo,

                                data: {

                                    mfdco_agreement:
                                        true,

                                    mfdco_agreement_at:
                                        new Date()
                                            .toISOString()

                                }

                            }

                        });


                if (error) {

                    throw error;

                }


                if (
                    !data ||
                    !data.user
                ) {

                    throw new Error(
                        "アカウント情報を取得できませんでした。"
                    );

                }


                console.log(
                    "MFDCO account created:",
                    data.user.id
                );


                /*
                 * 再送機能で使用するため、
                 * このブラウザタブ内だけメールを保持する。
                 */

                try {

                    sessionStorage.setItem(
                        "mfdco_pending_email",
                        email
                    );

                    sessionStorage.setItem(
                        "mfdco_email_redirect",
                        emailRedirectTo
                    );

                } catch (storageError) {

                    console.warn(
                        "Session storage error:",
                        storageError
                    );

                }


                /*
                 * Confirm email がONの場合、
                 * ここではログインセッションを要求しない。
                 */

                window.location.href =
                    "check-email.html";


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                alert(
                    "アカウント登録に失敗しました。\n\n" +
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
   LOGIN
   ========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


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


                if (
                    !data ||
                    !data.user
                ) {

                    throw new Error(
                        "ログイン情報を取得できませんでした。"
                    );

                }


                console.log(
                    "ログイン成功:",
                    data.user.id
                );


                /*
                 * PROFILE CHECK
                 */

                const {
                    data: profile,
                    error: profileError
                } =
                    await window.supabaseClient
                        .from(
                            "profiles"
                        )
                        .select(
                            "id, status"
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


                /*
                 * メール確認済みだが
                 * プロフィールが未登録の場合。
                 */

                if (!profile) {

                    window.location.href =
                        "profile-setup.html";

                    return;

                }


                /*
                 * REJECTED
                 */

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


                /*
                 * MYPAGE
                 */

                window.location.href =
                    "mypage.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                let message =
                    getSupabaseErrorMessage(
                        error
                    );


                /*
                 * Supabaseのメール未確認エラーを
                 * 日本語で分かりやすくする。
                 */

                if (
                    message
                        .toLowerCase()
                        .includes(
                            "email not confirmed"
                        )
                ) {

                    message =
                        "メールアドレスの確認が完了していません。\n" +
                        "MFDCOから送信された確認メールをご確認ください。";

                }


                alert(
                    "ログインに失敗しました。\n\n" +
                    message
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
   ERROR MESSAGE
   ========================================= */

function getSupabaseErrorMessage(error) {

    if (!error) {

        return "不明なエラーです。";

    }


    if (error.message) {

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