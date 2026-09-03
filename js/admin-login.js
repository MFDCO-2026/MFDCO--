"use strict";


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const form =
            document.getElementById(
                "admin-login-form"
            );

        const passwordInput =
            document.getElementById(
                "admin-password"
            );

        const button =
            document.getElementById(
                "admin-login-button"
            );

        const status =
            document.getElementById(
                "admin-user-status"
            );

        const errorBox =
            document.getElementById(
                "admin-login-error"
            );

        const denied =
            document.getElementById(
                "admin-denied"
            );


        if (!window.supabaseClient) {

            status.textContent =
                "Supabaseへ接続できませんでした。";

            return;

        }


        /* =========================================
           LOGIN CHECK
        ========================================= */

        const {
            data: authData,
            error: authError
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (
            authError ||
            !authData?.user
        ) {

            status.textContent =
                "先にMFDCOへログインしてください。";

            return;

        }


        /* =========================================
           ADMIN CHECK
        ========================================= */

        const {
            data: isAdmin,
            error: adminError
        } =
            await window.supabaseClient
                .rpc(
                    "current_user_is_admin"
                );


        if (
            adminError ||
            isAdmin !== true
        ) {

            console.warn(
                "ADMIN CHECK:",
                adminError
            );


            status.hidden =
                true;


            denied.hidden =
                false;


            return;

        }


        status.textContent =
            "管理者アカウントを確認しました。";


        form.hidden =
            false;



        /* =========================================
           PASSWORD
        ========================================= */

        form.addEventListener(
            "submit",
            async function (event) {

                event.preventDefault();


                errorBox.hidden =
                    true;


                const password =
                    passwordInput.value;


                if (!password) {

                    showError(
                        "管理者パスワードを入力してください。"
                    );

                    return;

                }


                button.disabled =
                    true;


                button.textContent =
                    "確認しています...";


                try {

                    const {
                        data,
                        error
                    } =
                        await window
                            .supabaseClient
                            .rpc(
                                "verify_admin_password",
                                {
                                    input_password:
                                        password
                                }
                            );


                    if (error) {

                        throw error;

                    }


                    if (data !== true) {

                        showError(
                            "管理者パスワードが正しくありません。"
                        );

                        return;

                    }


                    /*
                     * パスワード自体は保存しない。
                     *
                     * このブラウザタブで
                     * 管理者認証を通ったことだけ保存。
                     */

                    sessionStorage.setItem(
                        "mfdco_admin_verified",
                        "true"
                    );


                    window.location.href =
                        "admin.html";

                }
                catch (error) {

                    console.error(
                        "ADMIN LOGIN ERROR:",
                        error
                    );


                    showError(
                        "管理者認証に失敗しました。"
                    );

                }
                finally {

                    button.disabled =
                        false;


                    button.textContent =
                        "管理画面へ進む";

                }

            }
        );


        function showError(
            message
        ) {

            errorBox.textContent =
                message;


            errorBox.hidden =
                false;

        }

    }
);