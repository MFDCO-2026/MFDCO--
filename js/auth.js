/* =========================================
   MFDCO JOIN / LOGIN
   EMAIL CONFIRMATION VERSION
   ========================================= */

"use strict";


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

const password =
    document.getElementById("password");

const passwordConfirm =
    document.getElementById("password-confirm");

const passwordError =
    document.getElementById("password-error");


/* =========================================
   SUPABASE CHECK
   ========================================= */

function isSupabaseReady() {

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
   PANEL SWITCH
   ========================================= */

if (
    showRegister &&
    loginPanel &&
    registerPanel
) {

    showRegister.addEventListener(
        "click",
        () => {

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
    showLogin &&
    loginPanel &&
    registerPanel
) {

    showLogin.addEventListener(
        "click",
        () => {

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
   PASSWORD CONFIRMATION
   ========================================= */

function checkPassword() {

    if (
        !password ||
        !passwordConfirm
    ) {

        return true;

    }


    if (
        passwordConfirm.value &&
        password.value !==
        passwordConfirm.value
    ) {

        if (passwordError) {

            passwordError.textContent =
                "パスワードが一致していません。";

        }

        passwordConfirm.setCustomValidity(
            "パスワードが一致していません。"
        );

        return false;

    }


    if (passwordError) {

        passwordError.textContent =
            "";

    }

    passwordConfirm.setCustomValidity(
        ""
    );

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
   REGISTER
   ========================================= */

if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isSupabaseReady()) {

                alert(
                    "Supabaseとの接続設定を確認してください。"
                );

                return;

            }


            if (!checkPassword()) {

                if (passwordConfirm) {

                    passwordConfirm.focus();

                }

                return;

            }


            const agreement =
                document.getElementById(
                    "agreement"
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
                    formData.get(
                        "email"
                    ) || ""
                ).trim();


            const passwordValue =
                String(
                    formData.get(
                        "password"
                    ) || ""
                );


            if (
                !email ||
                !passwordValue
            ) {

                alert(
                    "メールアドレスとパスワードを入力してください。"
                );

                return;

            }


            if (
                passwordValue.length < 8
            ) {

                alert(
                    "パスワードは8文字以上で設定してください。"
                );

                return;

            }


            const submitButton =
                registerForm.querySelector(
                    ".join-submit"
                );


            const originalText =
                submitButton
                    ? submitButton.textContent
                    : "";


            if (submitButton) {

                submitButton.disabled =
                    true;

                submitButton.textContent =
                    "確認メールを送信しています...";

            }


            try {

                /*
                 * メール確認後の戻り先
                 */

                const redirectUrl =
                    new URL(
                        "profile-setup.html",
                        window.location.href
                    ).href;


                console.log(
                    "Email confirmation redirect:",
                    redirectUrl
                );


                /*
                 * Authユーザー作成
                 */

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
                                passwordValue,

                            options: {

                                emailRedirectTo:
                                    redirectUrl,

                                data: {

                                    mfdco_agreement:
                                        true,

                                    mfdco_agreement_at:
                                        new Date()
                                            .toISOString()

                                }

                            }

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


                console.log(
                    "Auth user created:",
                    authData.user.id
                );


                /*
                 * Confirm email ON時は
                 * authData.session がnullでも正常。
                 *
                 * この段階では
                 * profilesやStorageには触らない。
                 */


                /*
                 * 再送用にメール情報を保存
                 */

                try {

                    sessionStorage.setItem(
                        "mfdco_pending_email",
                        email
                    );

                    sessionStorage.setItem(
                        "mfdco_email_redirect",
                        redirectUrl
                    );

                } catch (storageError) {

                    console.warn(
                        "sessionStorage error:",
                        storageError
                    );

                }


                /*
                 * メール確認待機画面へ
                 */

                window.location.href =
                    "check-email.html";


            } catch (error) {

                console.error(
                    "Registration error:",
                    error
                );


                let message =
                    error &&
                    error.message
                        ? error.message
                        : "不明なエラーです。";


                alert(
                    "アカウント登録に失敗しました。\n\n" +
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
   LOGIN
   ========================================= */

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!isSupabaseReady()) {

                alert(
                    "Supabaseとの接続設定を確認してください。"
                );

                return;

            }


            const emailInput =
                document.getElementById(
                    "login-email"
                );

            const passwordInput =
                document.getElementById(
                    "login-password"
                );


            const email =
                emailInput
                    ? emailInput.value.trim()
                    : "";


            const passwordValue =
                passwordInput
                    ? passwordInput.value
                    : "";


            if (
                !email ||
                !passwordValue
            ) {

                alert(
                    "メールアドレスとパスワードを入力してください。"
                );

                return;

            }


            const submitButton =
                loginForm.querySelector(
                    ".join-submit"
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
                                passwordValue

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
                    "Login success:",
                    data.user.id
                );


                /*
                 * プロフィール確認
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

                    throw new Error(
                        "プロフィール情報を取得できませんでした。"
                    );

                }


                /*
                 * メール確認済みだが
                 * プロフィール未作成
                 */

                if (!profile) {

                    window.location.href =
                        "profile-setup.html";

                    return;

                }


                /*
                 * 利用不可
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
                 * マイページへ
                 */

                window.location.href =
                    "mypage.html";


            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );


                let message =
                    error &&
                    error.message
                        ? error.message
                        : "不明なエラーです。";


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
                    "ログインできませんでした。\n\n" +
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
   LOADED
   ========================================= */

console.log(
    "MFDCO join.js email-confirmation version loaded."
);