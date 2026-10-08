/* =========================================
   MFDCO MY PAGE
========================================= */

"use strict";


/* =========================================
   ELEMENTS
========================================= */

const loading =
    document.querySelector("#mypage-loading");

const content =
    document.querySelector("#mypage-content");

const errorPanel =
    document.querySelector("#mypage-error");

const errorMessage =
    document.querySelector("#mypage-error-text");


/* =========================================
   PROFILE ELEMENTS
========================================= */

const profileIcon =
    document.querySelector("#profile-icon");

const profileActivityName =
    document.querySelector("#profile-activity-name");

const profileCountry =
    document.querySelector("#profile-country");

const profileStatus =
    document.querySelector("#profile-status");

const profileRole =
    document.querySelector("#profile-role");

const profileFlag =
    document.querySelector("#profile-flag");

const profileCountryName =
    document.querySelector("#profile-country-name");

const countrySection =
    document.querySelector("#country-section");

const tagsSection =
    document.querySelector("#tags-section");

const profileTags =
    document.querySelector("#profile-tags");

const profileCredit =
    document.querySelector("#profile-credit");

const bioSection =
    document.querySelector("#bio-section");

const profileBio =
    document.querySelector("#profile-bio");

const profileEmail =
    document.querySelector("#profile-email");

const profileCreatedAt =
    document.querySelector("#profile-created-at");


/* =========================================
   WORKS
========================================= */

const memberWorks =
    document.querySelector("#member-works");

const worksEmpty =
    document.querySelector("#works-empty");


/* =========================================
   LOGOUT
========================================= */

const logoutButton =
    document.querySelector("#logout-button");


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
   URL USER ID
========================================= */

function getRequestedUserId() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    return params.get(
        "id"
    );

}


/* =========================================
   STATUS
========================================= */

function getStatusLabel(status) {

    const statusMap = {

        pending:
            "PENDING",

        approved:
            "APPROVED",

        rejected:
            "REJECTED",

        suspended:
            "SUSPENDED"

    };


    return (
        statusMap[status] ||
        "PENDING"
    );

}


/* =========================================
   ROLE
========================================= */

function getRoleLabel(
    status,
    permanentMember
) {

    if (
        permanentMember === true
    ) {

        return "常任理事国";

    }


    if (
        status === "approved"
    ) {

        return "加盟国";

    }


    if (
        status === "pending"
    ) {

        return "審査中";

    }


    if (
        status === "rejected"
    ) {

        return "利用不可";

    }


    if (
        status === "suspended"
    ) {

        return "停止中";

    }


    return "加盟国";

}


/* =========================================
   CREDIT
========================================= */

function getCreditText(profileData) {

    if (
        profileData.credit_type ===
        "none"
    ) {

        return "不要";

    }


    if (
        profileData.credit_type ===
        "optional"
    ) {

        return "任意";

    }


    if (
        profileData.credit_type ===
        "custom"
    ) {

        return (
            profileData.credit_text ||
            "指定あり"
        );

    }


    return "未設定";

}


/* =========================================
   TAGS
========================================= */

function renderTags(tags) {

    if (!profileTags) {

        return;

    }


    profileTags.innerHTML =
        "";


    if (
        !Array.isArray(tags) ||
        tags.length === 0
    ) {

        const empty =
            document.createElement(
                "span"
            );


        empty.className =
            "profile-tag-empty";


        empty.textContent =
            "タグなし";


        profileTags.appendChild(
            empty
        );


        return;

    }


    tags.forEach(
        function (tag) {

            const element =
                document.createElement(
                    "span"
                );


            element.className =
                "profile-tag";


            element.textContent =
                tag;


            profileTags.appendChild(
                element
            );

        }
    );

}


/* =========================================
   DATE
========================================= */

function formatDate(dateString) {

    if (
        !dateString
    ) {

        return "-";

    }


    const date =
        new Date(
            dateString
        );


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return "-";

    }


    return new Intl.DateTimeFormat(
        "ja-JP",
        {
            year:
                "numeric",

            month:
                "long",

            day:
                "numeric"
        }
    ).format(
        date
    );

}


/* =========================================
   OWN PROFILE CONTROLS
========================================= */

function updateOwnProfileControls(
    isOwnProfile
) {

    /*
     * 「プロフィールを編集」に使われる可能性のある
     * 要素をまとめて取得します。
     */
    const editSelectors = [

        "#edit-profile-button",

        "#profile-edit-button",

        "#edit-button",

        ".profile-edit-button",

        ".edit-profile-button",

        ".mypage-edit-button",

        ".profile-edit",

        ".edit-profile",

        'a[href="profile-edit.html"]',

        'a[href="./profile-edit.html"]',

        'a[href="edit-profile.html"]',

        'a[href="./edit-profile.html"]',

        'a[href*="profile-edit.html"]',

        'a[href*="edit-profile.html"]'

    ];


    const editElements =
        document.querySelectorAll(
            editSelectors.join(",")
        );


    editElements.forEach(
        function (element) {

            if (
                isOwnProfile
            ) {

                element.hidden =
                    false;


                element.style.display =
                    "";

            } else {

                element.hidden =
                    true;


                element.style.display =
                    "none";

            }

        }
    );


    /*
     * ボタンのテキストが
     * 「プロフィールを編集」の場合も検出。
     */
    const possibleButtons =
        document.querySelectorAll(
            "a, button"
        );


    possibleButtons.forEach(
        function (element) {

            const text =
                element.textContent
                    ?.trim()
                    .replace(
                        /\s+/g,
                        ""
                    );


            if (
                text ===
                    "プロフィールを編集" ||
                text ===
                    "プロフィール編集"
            ) {

                if (
                    isOwnProfile
                ) {

                    element.hidden =
                        false;


                    element.style.display =
                        "";

                } else {

                    element.hidden =
                        true;


                    element.style.display =
                        "none";

                }

            }

        }
    );


    /*
     * ログアウトボタンも
     * 本人のページでのみ表示。
     */
    if (
        logoutButton
    ) {

        if (
            isOwnProfile
        ) {

            logoutButton.hidden =
                false;


            logoutButton.style.display =
                "";

        } else {

            logoutButton.hidden =
                true;


            logoutButton.style.display =
                "none";

        }

    }

}


/* =========================================
   PROFILE RENDER
========================================= */

function renderProfile(
    profileData,
    currentUser,
    isOwnProfile
) {

    if (
        !profileData
    ) {

        throw new Error(
            "プロフィール情報が存在しません。"
        );

    }


    console.log(
        "表示プロフィール:",
        profileData
    );


    /* =====================================
       BASIC
    ====================================== */

    const activityName =
        profileData.activity_name ||
        "名称未設定";


    const country =
        profileData.fictional_country ||
        "";


    const status =
        profileData.status ||
        "pending";


    /* =====================================
       ICON
    ====================================== */

    if (
        profileIcon
    ) {

        if (
            profileData.icon_url
        ) {

            profileIcon.src =
                profileData.icon_url;

        } else {

            profileIcon.src =
                "assets/default-icon.png";

        }


        profileIcon.hidden =
            false;


        profileIcon.alt =
            activityName;

    }


    /* =====================================
       ACTIVITY NAME
    ====================================== */

    if (
        profileActivityName
    ) {

        profileActivityName.textContent =
            activityName;

    }


    /* =====================================
       COUNTRY
    ====================================== */

    if (
        profileCountry
    ) {

        profileCountry.textContent =
            country;

    }


    /* =====================================
       STATUS
    ====================================== */

    if (
        profileStatus
    ) {

        profileStatus.textContent =
            getStatusLabel(
                status
            );


        profileStatus.dataset.status =
            status;

    }


    /* =====================================
       ROLE
    ====================================== */

    if (
        profileRole
    ) {

        profileRole.textContent =
            getRoleLabel(
                status,
                profileData.permanent_member
            );

    }


    /* =====================================
       FLAG
    ====================================== */

    if (
        profileData.fictional_country &&
        profileData.flag_url
    ) {

        if (
            countrySection
        ) {

            countrySection.hidden =
                false;

        }


        if (
            profileFlag
        ) {

            profileFlag.src =
                profileData.flag_url;


            profileFlag.alt =
                profileData.fictional_country;

        }


        if (
            profileCountryName
        ) {

            profileCountryName.textContent =
                profileData.fictional_country;

        }

    } else {

        if (
            countrySection
        ) {

            countrySection.hidden =
                true;

        }

    }


    /* =====================================
       TAGS
    ====================================== */

    if (
        Array.isArray(
            profileData.tags
        ) &&
        profileData.tags.length > 0
    ) {

        if (
            tagsSection
        ) {

            tagsSection.hidden =
                false;

        }

    } else {

        if (
            tagsSection
        ) {

            tagsSection.hidden =
                true;

        }

    }


    renderTags(
        profileData.tags
    );


    /* =====================================
       CREDIT
    ====================================== */

    if (
        profileCredit
    ) {

        profileCredit.textContent =
            getCreditText(
                profileData
            );

    }


    /* =====================================
       BIO
    ====================================== */

    if (
        profileData.bio
    ) {

        if (
            bioSection
        ) {

            bioSection.hidden =
                false;

        }


        if (
            profileBio
        ) {

            profileBio.textContent =
                profileData.bio;

        }

    } else {

        if (
            bioSection
        ) {

            bioSection.hidden =
                true;

        }

    }


    /* =====================================
       EMAIL
       本人のみ表示
    ====================================== */

    if (
        profileEmail
    ) {

        if (
            isOwnProfile &&
            currentUser
        ) {

            profileEmail.textContent =
                currentUser.email ||
                "-";

        } else {

            profileEmail.textContent =
                "非公開";

        }

    }


    /* =====================================
       CREATED AT
    ====================================== */

    if (
        profileCreatedAt
    ) {

        profileCreatedAt.textContent =
            formatDate(
                profileData.created_at
            );

    }


    /* =====================================
       EDIT / LOGOUT
    ====================================== */

    updateOwnProfileControls(
        isOwnProfile
    );

}


/* =========================================
   WORKS
========================================= */

async function loadWorks(
    userId
) {

    if (
        !memberWorks
    ) {

        return;

    }


    console.log(
        "提供中の作品を取得中:",
        userId
    );


    const {
        data,
        error
    } =
        await window.supabaseClient
            .from(
                "works"
            )
            .select(`
                id,
                title,
                description,
                image_url,
                tags,
                status,
                created_at
            `)
            .eq(
                "user_id",
                userId
            )
            .eq(
                "status",
                "approved"
            )
            .order(
                "created_at",
                {
                    ascending:
                        false
                }
            );


    if (
        error
    ) {

        console.warn(
            "作品情報を取得できませんでした:",
            error
        );


        memberWorks.innerHTML =
            "";


        if (
            worksEmpty
        ) {

            worksEmpty.hidden =
                false;


            worksEmpty.textContent =
                "現在、提供中の作品はありません。";

        }


        return;

    }


    memberWorks.innerHTML =
        "";


    if (
        !Array.isArray(data) ||
        data.length === 0
    ) {

        if (
            worksEmpty
        ) {

            worksEmpty.hidden =
                false;


            worksEmpty.textContent =
                "現在、提供中の作品はありません。";

        }


        return;

    }


    if (
        worksEmpty
    ) {

        worksEmpty.hidden =
            true;

    }


    data.forEach(
        function (work) {

            const card =
                document.createElement(
                    "a"
                );


            card.className =
                "work-card";


            card.href =
                `work.html?id=${encodeURIComponent(
                    work.id
                )}`;


            /* =========================
               IMAGE
            ========================== */

            const imageArea =
                document.createElement(
                    "div"
                );


            imageArea.className =
                "work-image";


            if (
                work.image_url
            ) {

                const image =
                    document.createElement(
                        "img"
                    );


                image.src =
                    work.image_url;


                image.alt =
                    work.title ||
                    "作品";


                image.loading =
                    "lazy";


                imageArea.appendChild(
                    image
                );

            } else {

                const placeholder =
                    document.createElement(
                        "div"
                    );


                placeholder.className =
                    "work-image-placeholder";


                placeholder.textContent =
                    "NO IMAGE";


                imageArea.appendChild(
                    placeholder
                );

            }


            card.appendChild(
                imageArea
            );


            /* =========================
               CONTENT
            ========================== */

            const workContent =
                document.createElement(
                    "div"
                );


            workContent.className =
                "work-content";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                work.title ||
                "無題の作品";


            workContent.appendChild(
                title
            );


            if (
                work.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );


                description.textContent =
                    work.description;


                workContent.appendChild(
                    description
                );

            }


            card.appendChild(
                workContent
            );


            memberWorks.appendChild(
                card
            );

        }
    );

}


/* =========================================
   LOGOUT
========================================= */

if (
    logoutButton
) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const confirmed =
                window.confirm(
                    "ログアウトしますか？"
                );


            if (
                !confirmed
            ) {

                return;

            }


            logoutButton.disabled =
                true;


            try {

                const {
                    error
                } =
                    await window.supabaseClient
                        .auth
                        .signOut();


                if (
                    error
                ) {

                    throw error;

                }


                window.location.href =
                    "join.html";


            } catch (
                error
            ) {

                console.error(
                    "Logout error:",
                    error
                );


                alert(
                    "ログアウトに失敗しました。\n\n" +
                    (
                        error.message ||
                        "不明なエラーです。"
                    )
                );


                logoutButton.disabled =
                    false;

            }

        }
    );

}


/* =========================================
   LOAD MY PAGE
========================================= */

async function loadMyPage() {

    try {

        /* =====================================
           SUPABASE
        ====================================== */

        if (
            !isSupabaseReady()
        ) {

            throw new Error(
                "Supabaseが初期化されていません。"
            );

        }


        /* =====================================
           CURRENT USER
        ====================================== */

        const {
            data: {
                user
            }
        } =
            await window.supabaseClient
                .auth
                .getUser();


        const currentUser =
            user ||
            null;


        /* =====================================
           TARGET USER
        ====================================== */

        const requestedUserId =
            getRequestedUserId();


        const targetUserId =
            requestedUserId ||
            currentUser?.id ||
            null;


        /*
         * ID指定なし ＋ 未ログインなら
         * ログインページへ移動。
         */
        if (
            !targetUserId
        ) {

            window.location.href =
                "join.html";


            return;

        }


        /* =====================================
           OWN PROFILE CHECK
        ====================================== */

        const isOwnProfile =
            Boolean(
                currentUser &&
                currentUser.id ===
                    targetUserId
            );


        console.log(
            "MYPAGE TARGET:",
            {
                currentUserId:
                    currentUser?.id ||
                    null,

                requestedUserId:
                    requestedUserId,

                targetUserId:
                    targetUserId,

                isOwnProfile:
                    isOwnProfile
            }
        );


        /* =====================================
           PROFILE
        ====================================== */

        const {
            data:
                profileData,
            error:
                profileError
        } =
            await window.supabaseClient
                .from(
                    "profiles"
                )
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
                    status,
                    permanent_member,
                    created_at
                `)
                .eq(
                    "id",
                    targetUserId
                )
                .maybeSingle();


        if (
            profileError
        ) {

            throw profileError;

        }


        if (
            !profileData
        ) {

            throw new Error(
                "プロフィール情報が見つかりません。"
            );

        }


        /* =====================================
           RENDER PROFILE
        ====================================== */

        renderProfile(
            profileData,
            currentUser,
            isOwnProfile
        );


        /* =====================================
           WORKS
        ====================================== */

        await loadWorks(
            targetUserId
        );


        /* =====================================
           SHOW CONTENT
        ====================================== */

        if (
            loading
        ) {

            loading.hidden =
                true;

        }


        if (
            errorPanel
        ) {

            errorPanel.hidden =
                true;

        }


        if (
            content
        ) {

            content.hidden =
                false;

        }


        /*
         * contentを表示したあとにも
         * もう一度本人専用UIを制御。
         *
         * HTML側のhidden/display指定に
         * 上書きされるケースを防止。
         */
        updateOwnProfileControls(
            isOwnProfile
        );


        console.log(
            isOwnProfile
                ? "MFDCOマイページ表示完了"
                : "MFDCO他ユーザープロフィール表示完了"
        );


    } catch (
        error
    ) {

        console.error(
            "MyPage error:",
            error
        );


        if (
            loading
        ) {

            loading.hidden =
                true;

        }


        if (
            content
        ) {

            content.hidden =
                true;

        }


        if (
            errorPanel
        ) {

            errorPanel.hidden =
                false;

        }


        if (
            errorMessage
        ) {

            errorMessage.textContent =
                error.message ||
                "情報を取得できませんでした。";

        }

    }

}


/* =========================================
   START
========================================= */

loadMyPage();


console.log(
    "MFDCO mypage.js loaded successfully."
);