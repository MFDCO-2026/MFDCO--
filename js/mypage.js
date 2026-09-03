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

function getRoleLabel(status) {

    if (status === "approved") {

        return "MFDCO MEMBER";

    }


    if (status === "pending") {

        return "審査中";

    }


    if (status === "rejected") {

        return "利用不可";

    }


    if (status === "suspended") {

        return "停止中";

    }


    return "MFDCO MEMBER";

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


    profileTags.innerHTML = "";


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

    if (!dateString) {

        return "-";

    }


    const date =
        new Date(dateString);


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
            year: "numeric",
            month: "long",
            day: "numeric"
        }
    ).format(date);

}


/* =========================================
   PROFILE RENDER
   ========================================= */

function renderProfile(profileData, user) {

    if (!profileData) {

        throw new Error(
            "プロフィール情報が存在しません。"
        );

    }


    console.log(
        "プロフィール:",
        profileData
    );


    /* =====================================
       BASIC
    ===================================== */

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
    ===================================== */

    if (profileIcon) {

        if (profileData.icon_url) {

            profileIcon.src =
                profileData.icon_url;

            profileIcon.hidden =
                false;

        } else {

            profileIcon.removeAttribute(
                "src"
            );

        }


        profileIcon.alt =
            activityName;

    }


    /* =====================================
       ACTIVITY NAME
    ===================================== */

    if (profileActivityName) {

        profileActivityName.textContent =
            activityName;

    }


    /* =====================================
       COUNTRY
    ===================================== */

    if (profileCountry) {

        profileCountry.textContent =
            country;

    }


    /* =====================================
       STATUS
    ===================================== */

    if (profileStatus) {

        profileStatus.textContent =
            getStatusLabel(
                status
            );

        profileStatus.dataset.status =
            status;

    }


    /* =====================================
       ROLE
    ===================================== */

    if (profileRole) {

        profileRole.textContent =
            getRoleLabel(
                status
            );

    }


    /* =====================================
       FLAG
    ===================================== */

    if (
        profileData.fictional_country &&
        profileData.flag_url
    ) {

        if (countrySection) {

            countrySection.hidden =
                false;

        }


        if (profileFlag) {

            profileFlag.src =
                profileData.flag_url;

            profileFlag.alt =
                profileData.fictional_country;

        }


        if (profileCountryName) {

            profileCountryName.textContent =
                profileData.fictional_country;

        }

    } else {

        if (countrySection) {

            countrySection.hidden =
                true;

        }

    }


    /* =====================================
       TAGS
    ===================================== */

    if (
        Array.isArray(profileData.tags) &&
        profileData.tags.length > 0
    ) {

        if (tagsSection) {

            tagsSection.hidden =
                false;

        }

    } else {

        if (tagsSection) {

            tagsSection.hidden =
                true;

        }

    }


    renderTags(
        profileData.tags
    );


    /* =====================================
       CREDIT
    ===================================== */

    if (profileCredit) {

        profileCredit.textContent =
            getCreditText(
                profileData
            );

    }


    /* =====================================
       BIO
    ===================================== */

    if (profileData.bio) {

        if (bioSection) {

            bioSection.hidden =
                false;

        }


        if (profileBio) {

            profileBio.textContent =
                profileData.bio;

        }

    } else {

        if (bioSection) {

            bioSection.hidden =
                true;

        }

    }


    /* =====================================
       EMAIL
    ===================================== */

    if (profileEmail) {

        profileEmail.textContent =
            user.email ||
            "-";

    }


    /* =====================================
       CREATED AT
    ===================================== */

    if (profileCreatedAt) {

        profileCreatedAt.textContent =
            formatDate(
                profileData.created_at
            );

    }

}


/* =========================================
   WORKS
========================================= */

async function loadWorks(userId) {

    if (!memberWorks) {

        return;

    }


    console.log(
        "提供中の作品を取得中..."
    );


    const {
        data,
        error
    } =
        await window.supabaseClient
            .from("works")
            .select(
                `
                id,
                title,
                description,
                thumbnail_url,
                category,
                status,
                created_at
                `
            )
            .eq(
                "user_id",
                userId
            )
            .eq(
                "status",
                "published"
            )
            .order(
                "created_at",
                {
                    ascending: false
                }
            );


    if (error) {

        console.warn(
            "作品情報を取得できませんでした:",
            error
        );


        memberWorks.innerHTML = "";


        if (worksEmpty) {

            worksEmpty.hidden =
                false;

            worksEmpty.textContent =
                "現在、提供中の作品はありません。";

        }


        return;

    }


    memberWorks.innerHTML = "";


    if (
        !data ||
        data.length === 0
    ) {

        if (worksEmpty) {

            worksEmpty.hidden =
                false;

            worksEmpty.textContent =
                "現在、提供中の作品はありません。";

        }

        return;

    }


    if (worksEmpty) {

        worksEmpty.hidden =
            true;

    }


    data.forEach(
        function (work) {

            const card =
                document.createElement(
                    "article"
                );

            card.className =
                "work-card";


            /* =========================
               THUMBNAIL
            ========================== */

            if (
                work.thumbnail_url
            ) {

                const image =
                    document.createElement(
                        "img"
                    );

                image.src =
                    work.thumbnail_url;

                image.alt =
                    work.title ||
                    "作品";

                image.className =
                    "work-thumbnail";

                card.appendChild(
                    image
                );

            }


            /* =========================
               CONTENT
            ========================== */

            const content =
                document.createElement(
                    "div"
                );

            content.className =
                "work-content";


            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                work.title ||
                "無題の作品";


            content.appendChild(
                title
            );


            if (
                work.category
            ) {

                const category =
                    document.createElement(
                        "span"
                    );

                category.className =
                    "work-category";

                category.textContent =
                    work.category;

                content.appendChild(
                    category
                );

            }


            if (
                work.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );

                description.textContent =
                    work.description;

                content.appendChild(
                    description
                );

            }


            card.appendChild(
                content
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

if (logoutButton) {

    logoutButton.addEventListener(
        "click",
        async function () {

            const confirmed =
                window.confirm(
                    "ログアウトしますか？"
                );


            if (!confirmed) {

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


                if (error) {

                    throw error;

                }


                window.location.href =
                    "join.html";


            } catch (error) {

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

        if (!isSupabaseReady()) {

            throw new Error(
                "Supabaseが初期化されていません。"
            );

        }


        /* =====================================
           USER
        ====================================== */

        const {
            data: {
                user
            },
            error:
                userError
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (userError) {

            throw userError;

        }


        if (!user) {

            console.log(
                "ログインユーザーがいません。"
            );


            window.location.href =
                "join.html";

            return;

        }


        console.log(
            "ログインユーザー:",
            user.id
        );


        /* =====================================
           PROFILE
        ====================================== */

        console.log(
            "プロフィールを取得中..."
        );


        const {
            data:
                profileData,
            error:
                profileError
        } =
            await window.supabaseClient
                .from("profiles")
                .select(
                    `
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
                    created_at
                    `
                )
                .eq(
                    "id",
                    user.id
                )
                .maybeSingle();


        if (profileError) {

            throw profileError;

        }


        if (!profileData) {

            throw new Error(
                "プロフィール情報が見つかりません。"
            );

        }


        console.log(
            "プロフィール取得成功:",
            profileData
        );


        /* =====================================
           RENDER
        ====================================== */

        renderProfile(
            profileData,
            user
        );


        /* =====================================
           WORKS
        ====================================== */

        await loadWorks(
            user.id
        );


        /* =====================================
           SHOW CONTENT
        ====================================== */

        if (loading) {

            loading.hidden =
                true;

        }


        if (errorPanel) {

            errorPanel.hidden =
                true;

        }


        if (content) {

            content.hidden =
                false;

        }


        console.log(
            "MFDCOマイページ表示完了"
        );


    } catch (error) {

        console.error(
            "MyPage error:",
            error
        );


        if (loading) {

            loading.hidden =
                true;

        }


        if (content) {

            content.hidden =
                true;

        }


        if (errorPanel) {

            errorPanel.hidden =
                false;

        }


        if (errorMessage) {

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