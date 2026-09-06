/* =========================================
   MFDCO CHECK EMAIL
   ========================================= */

"use strict";


const resendButton =
    document.querySelector(
        "#resend-email-button"
    );

const resendMessage =
    document.querySelector(
        "#resend-message"
    );


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
   RESEND
   ========================================= */

if (resendButton) {

    resendButton.addEventListener(
        "click",
        async function () {

            if (!isSupabaseReady()) {

                alert(
                    "Supabaseとの接続設定を確認してください。"
                );

                return;

            }


            let email =
                null;

            let emailRedirectTo =
                null;


            try {

                email =
                    sessionStorage.getItem(
                        "mfdco_pending_email"
                    );

                emailRedirectTo =
                    sessionStorage.getItem(
                        "mfdco_email_redirect"
                    );

            } catch (error) {

                console.warn(
                    "Session storage error:",
                    error
                );

            }


            if (!email) {

                alert(
                    "再送先のメールアドレスを確認できません。\n" +
                    "参加登録画面からもう一度お試しください。"
                );

                return;

            }


            if (!emailRedirectTo) {

                emailRedirectTo =
                    new URL(
                        "profile-setup.html",
                        window.location.href
                    ).href;

            }


            const originalText =
                resendButton.textContent;


            resendButton.disabled =
                true;

            resendButton.textContent =
                "再送しています...";


            if (resendMessage) {

                resendMessage.textContent =
                    "";

            }


            try {

                const {
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .resend({

                            type:
                                "signup",

                            email:
                                email,

                            options: {

                                emailRedirectTo:
                                    emailRedirectTo

                            }

                        });


                if (error) {

                    throw error;

                }


                if (resendMessage) {

                    resendMessage.textContent =
                        "確認メールを再送しました。";

                }


                /*
                 * 連続クリック防止
                 */

                let remaining =
                    60;


                resendButton.textContent =
                    "60秒後に再送できます";


                const timer =
                    window.setInterval(
                        function () {

                            remaining -=
                                1;


                            if (
                                remaining <= 0
                            ) {

                                window.clearInterval(
                                    timer
                                );

                                resendButton.disabled =
                                    false;

                                resendButton.textContent =
                                    originalText;

                                return;

                            }


                            resendButton.textContent =
                                remaining +
                                "秒後に再送できます";

                        },
                        1000
                    );


            } catch (error) {

                console.error(
                    "Resend confirmation error:",
                    error
                );


                alert(
                    "確認メールの再送に失敗しました。\n\n" +
                    (
                        error.message ||
                        "不明なエラーです。"
                    )
                );


                resendButton.disabled =
                    false;

                resendButton.textContent =
                    originalText;

            }

        }
    );

}


console.log(
    "MFDCO check-email.js loaded successfully."
);