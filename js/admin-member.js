"use strict";


let adminMembers = [];

let currentMemberStatus =
    "pending";


document.addEventListener(
    "DOMContentLoaded",
    async function () {

        const loading =
            document.getElementById(
                "admin-members-loading"
            );

        const denied =
            document.getElementById(
                "admin-members-denied"
            );

        const content =
            document.getElementById(
                "admin-members-content"
            );

        const errorBox =
            document.getElementById(
                "admin-members-error"
            );

        const empty =
            document.getElementById(
                "admin-members-empty"
            );

        const list =
            document.getElementById(
                "admin-members-list"
            );

        const filter =
            document.getElementById(
                "member-status-filter"
            );

        const reload =
            document.getElementById(
                "members-reload-button"
            );

        const pendingCount =
            document.getElementById(
                "members-count-pending"
            );

        const approvedCount =
            document.getElementById(
                "members-count-approved"
            );

        const rejectedCount =
            document.getElementById(
                "members-count-rejected"
            );


        /* =========================================
           SUPABASE
        ========================================= */

        if (!window.supabaseClient) {

            showDenied();

            return;

        }


        /* =========================================
           AUTH
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
           ADMIN
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
                "ADMIN MEMBER CHECK:",
                adminError
            );

            showDenied();

            return;

        }


        /* =========================================
           PASSWORD SESSION
        ========================================= */

        if (
            sessionStorage.getItem(
                "mfdco_admin_verified"
            ) !== "true"
        ) {

            window.location.replace(
                "admin-login.html"
            );

            return;

        }


        loading.hidden =
            true;

        content.hidden =
            false;


        filter?.addEventListener(
            "change",
            function () {

                currentMemberStatus =
                    filter.value;

                renderMembers();

            }
        );


        reload?.addEventListener(
            "click",
            async function () {

                await loadMembers();

            }
        );


        await loadMembers();



        /* =========================================
           LOAD
        ========================================= */

        async function loadMembers() {

            hideError();


            const {
                data,
                error
            } =
                await window.supabaseClient
                    .from("profiles")
                    .select(`
                        id,
                        activity_name,
                        icon_url,
                        fictional_country,
                        flag_url,
                        credit_type,
                        credit_text,
                        tags,
                        bio,
                        agreement,
                        agreement_at,
                        created_at,
                        status,
                        permanent_member,
                        admin
                    `)
                    .order(
                        "created_at",
                        {
                            ascending: false
                        }
                    );


            if (error) {

                console.error(
                    "MEMBER LOAD ERROR:",
                    error
                );

                showError(
                    error.message
                );

                return;

            }


            adminMembers =
                data || [];


            renderSummary();

            renderMembers();

        }



        /* =========================================
           SUMMARY
        ========================================= */

        function renderSummary() {

            pendingCount.textContent =
                adminMembers.filter(
                    member =>
                        member.status ===
                        "pending"
                ).length;


            approvedCount.textContent =
                adminMembers.filter(
                    member =>
                        member.status ===
                        "approved"
                ).length;


            rejectedCount.textContent =
                adminMembers.filter(
                    member =>
                        member.status ===
                        "rejected"
                ).length;

        }



        /* =========================================
           RENDER
        ========================================= */

        function renderMembers() {

            list.innerHTML =
                "";


            const members =
                currentMemberStatus === "all"
                    ? adminMembers
                    : adminMembers.filter(
                        member =>
                            member.status ===
                            currentMemberStatus
                    );


            empty.hidden =
                members.length !== 0;


            for (
                const member
                of members
            ) {

                list.appendChild(
                    createMemberCard(
                        member
                    )
                );

            }

        }



        /* =========================================
           CARD
        ========================================= */

        function createMemberCard(
            member
        ) {

            const card =
                document.createElement(
                    "article"
                );


            card.className =
                "admin-member-card";


            /* ICON */

            if (member.icon_url) {

                const icon =
                    document.createElement(
                        "img"
                    );


                icon.className =
                    "admin-member-icon";


                icon.src =
                    member.icon_url;


                icon.alt =
                    "";


                card.appendChild(
                    icon
                );

            }
            else {

                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "admin-member-icon-placeholder";


                placeholder.textContent =
                    "NO ICON";


                card.appendChild(
                    placeholder
                );

            }


            /* MAIN */

            const main =
                document.createElement(
                    "div"
                );


            main.className =
                "admin-member-main";


            const title =
                document.createElement(
                    "h2"
                );


            title.textContent =
                member.activity_name ||
                "名称未設定";


            main.appendChild(
                title
            );


            if (
                member.fictional_country
            ) {

                const country =
                    document.createElement(
                        "p"
                    );


                country.className =
                    "admin-member-country";


                country.textContent =
                    member.fictional_country;


                main.appendChild(
                    country
                );

            }


            if (member.bio) {

                const bio =
                    document.createElement(
                        "p"
                    );


                bio.className =
                    "admin-member-bio";


                bio.textContent =
                    member.bio;


                main.appendChild(
                    bio
                );

            }


            const meta =
                document.createElement(
                    "div"
                );


            meta.className =
                "admin-member-meta";


            meta.appendChild(
                createSpan(
                    "申請日: " +
                    formatDate(
                        member.created_at
                    )
                )
            );


            meta.appendChild(
                createSpan(
                    member.agreement
                        ? "規約同意済み"
                        : "規約未同意"
                )
            );


            if (
                member.permanent_member
            ) {

                meta.appendChild(
                    createSpan(
                        "常任加盟者"
                    )
                );

            }


            if (
                member.admin
            ) {

                meta.appendChild(
                    createSpan(
                        "管理者"
                    )
                );

            }


            main.appendChild(
                meta
            );


            if (
                Array.isArray(
                    member.tags
                ) &&
                member.tags.length
            ) {

                const tags =
                    document.createElement(
                        "div"
                    );


                tags.className =
                    "admin-member-tags";


                for (
                    const tag
                    of member.tags
                ) {

                    const tagElement =
                        document.createElement(
                            "span"
                        );


                    tagElement.className =
                        "admin-member-tag";


                    tagElement.textContent =
                        tag;


                    tags.appendChild(
                        tagElement
                    );

                }


                main.appendChild(
                    tags
                );

            }


            card.appendChild(
                main
            );


            /* ACTION */

            const action =
                document.createElement(
                    "div"
                );


            action.className =
                "admin-member-action";


            const status =
                document.createElement(
                    "span"
                );


            status.className =
                `admin-member-status ${
                    member.status ||
                    "pending"
                }`;


            status.textContent =
                getStatusLabel(
                    member.status
                );


            action.appendChild(
                status
            );


            const open =
                document.createElement(
                    "a"
                );


            open.className =
                "admin-member-open";


            open.href =
                `admin-member.html?id=${encodeURIComponent(
                    member.id
                )}`;


            open.textContent =
                "申請を見る";


            action.appendChild(
                open
            );


            card.appendChild(
                action
            );


            return card;

        }



        /* =========================================
           HELPERS
        ========================================= */

        function createSpan(text) {

            const span =
                document.createElement(
                    "span"
                );


            span.textContent =
                text;


            return span;

        }


        function getStatusLabel(
            status
        ) {

            switch (status) {

                case "approved":
                    return "承認済み";

                case "rejected":
                    return "却下済み";

                case "pending":
                default:
                    return "審査待ち";

            }

        }


        function formatDate(value) {

            if (!value) {

                return "-";

            }


            return new Intl
                .DateTimeFormat(
                    "ja-JP",
                    {
                        year:
                            "numeric",

                        month:
                            "2-digit",

                        day:
                            "2-digit",

                        hour:
                            "2-digit",

                        minute:
                            "2-digit"
                    }
                )
                .format(
                    new Date(value)
                );

        }



        /* =========================================
           STATE
        ========================================= */

        function showDenied() {

            loading.hidden =
                true;

            content.hidden =
                true;

            denied.hidden =
                false;

        }


        function showError(message) {

            errorBox.textContent =
                message;

            errorBox.hidden =
                false;

        }


        function hideError() {

            errorBox.hidden =
                true;

        }


        console.log(
            "MFDCO admin-members.js initialized successfully."
        );

    }
);