"use strict";


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const loading =
            document.getElementById(
                "admin-loading"
            );

        const denied =
            document.getElementById(
                "admin-denied"
            );

        const content =
            document.getElementById(
                "admin-content"
            );

        const lockButton =
            document.getElementById(
                "admin-lock-button"
            );


        const memberPendingCount =
            document.getElementById(
                "member-pending-count"
            );

        const workPendingCount =
            document.getElementById(
                "work-pending-count"
            );

        const reportOpenCount =
            document.getElementById(
                "report-open-count"
            );

        const approvedWorkCount =
            document.getElementById(
                "approved-work-count"
            );


        const operationModeTitle =
            document.getElementById(
                "operation-mode-title"
            );

        const operationModeDescription =
            document.getElementById(
                "operation-mode-description"
            );


        if (!window.supabaseClient) {

            showDenied();

            return;

        }


        /* =========================================
           AUTH CHECK
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

            showDenied();

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
                "ADMIN CHECK ERROR:",
                adminError
            );

            showDenied();

            return;

        }


        /* =========================================
           PASSWORD SESSION CHECK
        ========================================= */

        const verified =
            sessionStorage.getItem(
                "mfdco_admin_verified"
            );


        if (
            verified !== "true"
        ) {

            window.location.replace(
                "admin-login.html"
            );

            return;

        }


        /* =========================================
           SHOW
        ========================================= */

        loading.hidden =
            true;

        denied.hidden =
            true;

        content.hidden =
            false;


        /* =========================================
           LOAD DASHBOARD
        ========================================= */

        await Promise.all([
            loadWorkCounts(),
            loadReportCount(),
            loadMemberApplicationCount(),
            loadOperationMode()
        ]);


        /* =========================================
           LOCK
        ========================================= */

        lockButton?.addEventListener(
            "click",
            function () {

                sessionStorage.removeItem(
                    "mfdco_admin_verified"
                );


                window.location.href =
                    "admin-login.html";

            }
        );


        function showDenied() {

            loading.hidden =
                true;

            content.hidden =
                true;

            denied.hidden =
                false;

        }


        /* =========================================
           WORK COUNTS
        ========================================= */

        async function loadWorkCounts() {

            try {

                const {
                    count: pendingCount,
                    error: pendingError
                } =
                    await window.supabaseClient
                        .from("works")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "status",
                            "pending"
                        );


                if (pendingError) {

                    throw pendingError;

                }


                const {
                    count: approvedCount,
                    error: approvedError
                } =
                    await window.supabaseClient
                        .from("works")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "status",
                            "approved"
                        );


                if (approvedError) {

                    throw approvedError;

                }


                workPendingCount.textContent =
                    pendingCount ?? 0;


                approvedWorkCount.textContent =
                    approvedCount ?? 0;

            }
            catch (error) {

                console.warn(
                    "WORK COUNT ERROR:",
                    error
                );


                workPendingCount.textContent =
                    "-";


                approvedWorkCount.textContent =
                    "-";

            }

        }


        /* =========================================
           REPORT COUNT
        ========================================= */

        async function loadReportCount() {

            try {

                const {
                    count,
                    error
                } =
                    await window.supabaseClient
                        .from("reports")
                        .select(
                            "id",
                            {
                                count: "exact",
                                head: true
                            }
                        )
                        .eq(
                            "status",
                            "open"
                        );


                if (error) {

                    /*
                     * reports テーブル未作成でも
                     * ダッシュボード全体は壊さない。
                     */

                    console.warn(
                        "REPORT COUNT:",
                        error
                    );


                    reportOpenCount.textContent =
                        "0";

                    return;

                }


                reportOpenCount.textContent =
                    count ?? 0;

            }
            catch (error) {

                console.warn(
                    "REPORT COUNT ERROR:",
                    error
                );


                reportOpenCount.textContent =
                    "0";

            }

        }


        /* =========================================
           MEMBER APPLICATION COUNT
        ========================================= */

        async function loadMemberApplicationCount() {

            /*
             * 加盟申請の実際のテーブル構造は
             * まだ確定していないため、
             * 現段階ではダッシュボードを
             * 壊さないよう0表示にする。
             *
             * 加盟申請管理を作る段階で
             * 実テーブルへ接続する。
             */

            memberPendingCount.textContent =
                "0";

        }


        /* =========================================
           OPERATION MODE
        ========================================= */

        async function loadOperationMode() {

            try {

                const {
                    data,
                    error
                } =
                    await window.supabaseClient
                        .from("site_settings")
                        .select(`
                            moderation_mode,
                            member_approval_required,
                            work_approval_required,
                            reports_enabled
                        `)
                        .eq(
                            "id",
                            1
                        )
                        .maybeSingle();


                if (
                    error ||
                    !data
                ) {

                    console.warn(
                        "SITE SETTINGS:",
                        error
                    );


                    operationModeTitle.textContent =
                        "事前審査方式";


                    operationModeDescription.textContent =
                        "作品投稿を管理者が確認してから公開します。";


                    return;

                }


                if (
                    data.moderation_mode ===
                    "post_moderation"
                ) {

                    operationModeTitle.textContent =
                        "公開後モデレーション方式";


                    operationModeDescription.textContent =
                        "投稿を原則公開し、通報や問題発生後に管理者が対応します。";

                }
                else {

                    operationModeTitle.textContent =
                        "事前審査方式";


                    operationModeDescription.textContent =
                        "加盟申請や作品投稿を管理者が確認してから公開します。";

                }

            }
            catch (error) {

                console.warn(
                    "OPERATION MODE ERROR:",
                    error
                );


                operationModeTitle.textContent =
                    "事前審査方式";


                operationModeDescription.textContent =
                    "現在の設定を取得できませんでした。";

            }

        }


        console.log(
            "MFDCO admin.js initialized successfully."
        );

    }
);