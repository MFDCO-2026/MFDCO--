/* =========================================
   MFDCO MEMBERS
========================================= */

"use strict";


/* =========================================
   ELEMENTS
========================================= */

const membersGrid =
    document.getElementById(
        "members-grid"
    );

const membersError =
    document.getElementById(
        "members-error"
    );

const membersCount =
    document.getElementById(
        "members-count"
    );


/* =========================================
   STATE
========================================= */

let loadedMemberProfiles =
    [];

let currentMemberFilter =
    "all";

let currentUser =
    null;

let currentUserIsAdmin =
    false;


/* =========================================
   HTML ESCAPE
========================================= */

function escapeMemberHtml(
    value
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(
            value ?? ""
        );


    return div.innerHTML;

}


/* =========================================
   IMAGE URL
========================================= */

function getSafeMemberImageUrl(
    url,
    fallback = ""
) {

    if (
        !url
    ) {

        return fallback;

    }


    try {

        const parsed =
            new URL(
                url,
                window.location.href
            );


        if (
            parsed.protocol !==
                "http:" &&
            parsed.protocol !==
                "https:"
        ) {

            return fallback;

        }


        return parsed.href;


    } catch (
        error
    ) {

        return fallback;

    }

}


/* =========================================
   ADMIN CHECK
========================================= */

async function checkCurrentUserAdmin() {

    currentUser =
        null;


    currentUserIsAdmin =
        false;


    try {

        const {
            data,
            error
        } =
            await window.supabaseClient
                .auth
                .getUser();


        if (
            error
        ) {

            console.warn(
                "ユーザー情報を取得できませんでした:",
                error
            );


            return;

        }


        currentUser =
            data?.user ||
            null;


        if (
            !currentUser
        ) {

            return;

        }


        const {
            data:
                adminProfile,
            error:
                adminProfileError
        } =
            await window.supabaseClient
                .from(
                    "profiles"
                )
                .select(
                    "admin"
                )
                .eq(
                    "id",
                    currentUser.id
                )
                .maybeSingle();


        if (
            adminProfileError
        ) {

            console.warn(
                "管理者情報を取得できませんでした:",
                adminProfileError
            );


            return;

        }


        currentUserIsAdmin =
            adminProfile?.admin ===
            true;


        console.log(
            "MEMBERS ADMIN:",
            currentUserIsAdmin
        );


    } catch (
        error
    ) {

        console.warn(
            "管理者確認エラー:",
            error
        );


        currentUserIsAdmin =
            false;

    }

}


/* =========================================
   TAGS
========================================= */

function renderMemberTags(
    tags
) {

    if (
        !Array.isArray(
            tags
        ) ||
        tags.length ===
            0
    ) {

        return "";

    }


    const visibleTags =
        tags.slice(
            0,
            5
        );


    return `
        <div class="member-tags">

            ${visibleTags
                .map(
                    function (
                        tag
                    ) {

                        return `
                            <span class="member-tag">
                                ${escapeMemberHtml(
                                    tag
                                )}
                            </span>
                        `;

                    }
                )
                .join("")}

        </div>
    `;

}


/* =========================================
   ADMIN CONTROLS
========================================= */

function renderAdminControls(
    profile
) {

    if (
        !currentUserIsAdmin
    ) {

        return "";

    }


    const isPermanent =
        profile.permanent_member ===
        true;


    return `
        <div
            class="member-admin-controls"
            data-member-id="${escapeMemberHtml(
                profile.id
            )}"
        >

            <div class="member-admin-title">
                管理者設定
            </div>


            <div class="member-admin-row">

                <select
                    class="member-type-select"
                    aria-label="加盟区分"
                >

                    <option
                        value="member"
                        ${
                            !isPermanent
                                ? "selected"
                                : ""
                        }
                    >
                        加盟国
                    </option>

                    <option
                        value="permanent"
                        ${
                            isPermanent
                                ? "selected"
                                : ""
                        }
                    >
                        常任理事国
                    </option>

                </select>


                <button
                    type="button"
                    class="member-type-save"
                >
                    変更
                </button>

            </div>

        </div>
    `;

}


/* =========================================
   MEMBER CARD
========================================= */

function createMemberCard(
    profile
) {

    const isPermanent =
        profile.permanent_member ===
        true;


    const memberType =
        isPermanent
            ? "常任理事国"
            : "加盟国";


    const activityName =
        profile.activity_name ||
        "MFDCO Member";


    const fictionalCountry =
        profile.fictional_country ||
        "国家名未設定";


    const iconUrl =
        getSafeMemberImageUrl(
            profile.icon_url,
            "assets/default-icon.png"
        );


    const flagUrl =
        getSafeMemberImageUrl(
            profile.flag_url
        );


    const profileUrl =
        `mypage.html?id=${encodeURIComponent(
            profile.id
        )}`;


    let flagHtml =
        "";


    if (
        flagUrl
    ) {

        flagHtml = `
            <img
                src="${escapeMemberHtml(
                    flagUrl
                )}"
                alt="${escapeMemberHtml(
                    fictionalCountry
                )} の国旗"
                loading="lazy"
            >
        `;

    } else {

        flagHtml = `
            <div class="member-flag-placeholder">
                NO FLAG
            </div>
        `;

    }


    return `
        <article
            class="member-card ${
                isPermanent
                    ? "permanent-member"
                    : ""
            }"
        >

            <a
                href="${profileUrl}"
                class="member-card-link"
            >

                <div class="member-flag">

                    ${flagHtml}


                    <span class="member-type">
                        ${escapeMemberHtml(
                            memberType
                        )}
                    </span>

                </div>


                <div class="member-card-body">

                    <div class="member-profile">

                        <img
                            src="${escapeMemberHtml(
                                iconUrl
                            )}"
                            alt=""
                            class="member-icon"
                            loading="lazy"
                        >


                        <div class="member-profile-text">

                            <h3 class="member-name">
                                ${escapeMemberHtml(
                                    activityName
                                )}
                            </h3>

                            <p class="member-country">
                                ${escapeMemberHtml(
                                    fictionalCountry
                                )}
                            </p>

                        </div>

                    </div>


                    ${renderMemberTags(
                        profile.tags
                    )}


                    <div class="member-card-footer">

                        <span class="member-profile-link-text">
                            PROFILE
                        </span>

                        <span class="member-card-arrow">
                            →
                        </span>

                    </div>

                </div>

            </a>


            ${renderAdminControls(
                profile
            )}

        </article>
    `;

}


/* =========================================
   FILTER
========================================= */

function setupMemberFilter() {

    const filterButtons =
        document.querySelectorAll(
            ".members-filter-button"
        );


    filterButtons.forEach(
        function (
            button
        ) {

            button.addEventListener(
                "click",
                function () {

                    currentMemberFilter =
                        button.dataset.filter ||
                        "all";


                    filterButtons.forEach(
                        function (
                            item
                        ) {

                            item.classList.remove(
                                "active"
                            );

                        }
                    );


                    button.classList.add(
                        "active"
                    );


                    renderMembers();

                }
            );

        }
    );

}


/* =========================================
   RENDER MEMBERS
========================================= */

function renderMembers() {

    if (
        !membersGrid
    ) {

        return;

    }


    let filteredProfiles =
        loadedMemberProfiles;


    if (
        currentMemberFilter ===
        "permanent"
    ) {

        filteredProfiles =
            loadedMemberProfiles.filter(
                function (
                    profile
                ) {

                    return (
                        profile.permanent_member ===
                        true
                    );

                }
            );

    }


    if (
        currentMemberFilter ===
        "member"
    ) {

        filteredProfiles =
            loadedMemberProfiles.filter(
                function (
                    profile
                ) {

                    return (
                        profile.permanent_member !==
                        true
                    );

                }
            );

    }


    if (
        membersCount
    ) {

        membersCount.textContent =
            `${filteredProfiles.length} MEMBERS`;

    }


    if (
        filteredProfiles.length ===
        0
    ) {

        membersGrid.innerHTML = `
            <div class="members-empty">
                該当する加盟国はありません。
            </div>
        `;


        return;

    }


    membersGrid.innerHTML =
        filteredProfiles
            .map(
                function (
                    profile
                ) {

                    return createMemberCard(
                        profile
                    );

                }
            )
            .join("");


    setupAdminMemberControls();

}


/* =========================================
   ADMIN CONTROLS EVENTS
========================================= */

function setupAdminMemberControls() {

    if (
        !currentUserIsAdmin
    ) {

        return;

    }


    const controls =
        document.querySelectorAll(
            ".member-admin-controls"
        );


    controls.forEach(
        function (
            control
        ) {

            const memberId =
                control.dataset.memberId;


            const select =
                control.querySelector(
                    ".member-type-select"
                );


            const saveButton =
                control.querySelector(
                    ".member-type-save"
                );


            if (
                !memberId ||
                !select ||
                !saveButton
            ) {

                return;

            }


            saveButton.addEventListener(
                "click",
                async function (
                    event
                ) {

                    event.preventDefault();

                    event.stopPropagation();


                    const targetProfile =
                        loadedMemberProfiles.find(
                            function (
                                profile
                            ) {

                                return (
                                    profile.id ===
                                    memberId
                                );

                            }
                        );


                    if (
                        !targetProfile
                    ) {

                        alert(
                            "加盟国情報を取得できませんでした。"
                        );


                        return;

                    }


                    const newPermanentValue =
                        select.value ===
                        "permanent";


                    const oldPermanentValue =
                        targetProfile
                            .permanent_member ===
                        true;


                    if (
                        newPermanentValue ===
                        oldPermanentValue
                    ) {

                        alert(
                            "加盟区分は変更されていません。"
                        );


                        return;

                    }


                    const memberName =
                        targetProfile
                            .activity_name ||
                        "この加盟国";


                    const newLabel =
                        newPermanentValue
                            ? "常任理事国"
                            : "加盟国";


                    const confirmed =
                        window.confirm(
                            `${memberName} を「${newLabel}」に変更しますか？`
                        );


                    if (
                        !confirmed
                    ) {

                        /*
                         * キャンセルした場合は
                         * 元の値へ戻す
                         */
                        select.value =
                            oldPermanentValue
                                ? "permanent"
                                : "member";


                        return;

                    }


                    saveButton.disabled =
                        true;


                    select.disabled =
                        true;


                    saveButton.textContent =
                        "変更中...";


                    try {

                        /*
                         * 念のため、操作直前にも
                         * ログイン中ユーザーを確認
                         */
                        const {
                            data:
                                userData,
                            error:
                                userError
                        } =
                            await window
                                .supabaseClient
                                .auth
                                .getUser();


                        if (
                            userError ||
                            !userData?.user
                        ) {

                            throw new Error(
                                "管理者としてログインしていません。"
                            );

                        }


                        /*
                         * 管理者プロフィール再確認
                         */
                        const {
                            data:
                                adminProfile,
                            error:
                                adminError
                        } =
                            await window
                                .supabaseClient
                                .from(
                                    "profiles"
                                )
                                .select(
                                    "admin"
                                )
                                .eq(
                                    "id",
                                    userData.user.id
                                )
                                .maybeSingle();


                        if (
                            adminError
                        ) {

                            throw adminError;

                        }


                        if (
                            adminProfile?.admin !==
                            true
                        ) {

                            throw new Error(
                                "この操作を行う権限がありません。"
                            );

                        }


                        /*
                         * permanent_member 更新
                         */
                       const {
    data:
        updatedProfile,
    error:
        updateError
} =
    await window
        .supabaseClient
        .from(
            "profiles"
        )
        .update({
            permanent_member:
                newPermanentValue
        })
        .eq(
            "id",
            memberId
        )
        .select(`
            id,
            activity_name,
            permanent_member
        `)
        .maybeSingle();


if (
    updateError
) {

    throw updateError;

}


if (
    !updatedProfile
) {

    throw new Error(
        "プロフィールを更新できませんでした。管理者権限またはRLSを確認してください。"
    );

}


if (
    updatedProfile.permanent_member !==
    newPermanentValue
) {

    throw new Error(
        "加盟区分の変更がデータベースに反映されませんでした。"
    );

}


console.log(
    "加盟区分更新結果:",
    updatedProfile
);

                        /*
                         * ローカル情報更新
                         */
                        targetProfile
                            .permanent_member =
                            newPermanentValue;


                        /*
                         * カードを再描画
                         */
                        renderMembers();


                        alert(
                            `${memberName} を「${newLabel}」に変更しました。`
                        );


                    } catch (
                        error
                    ) {

                        console.error(
                            "加盟区分変更エラー:",
                            error
                        );


                        alert(
                            "加盟区分の変更に失敗しました。\n\n" +
                            (
                                error.message ||
                                "不明なエラーです。"
                            )
                        );


                        /*
                         * 失敗時は元に戻す
                         */
                        select.value =
                            oldPermanentValue
                                ? "permanent"
                                : "member";


                        saveButton.disabled =
                            false;


                        select.disabled =
                            false;


                        saveButton.textContent =
                            "変更";

                    }

                }
            );

        }
    );

}


/* =========================================
   ERROR
========================================= */

function showMembersError(
    message
) {

    if (
        !membersError
    ) {

        return;

    }


    membersError.hidden =
        false;


    membersError.textContent =
        message;

}


/* =========================================
   LOAD MEMBERS
========================================= */

async function loadMembers() {

    if (
        !membersGrid
    ) {

        return;

    }


    if (
        typeof window.supabaseClient ===
        "undefined"
    ) {

        membersGrid.innerHTML = `
            <div class="members-empty">
                加盟国情報を読み込めませんでした。
            </div>
        `;


        showMembersError(
            "Supabaseが初期化されていません。"
        );


        return;

    }


    try {

        /* =====================================
           ADMIN CHECK
        ====================================== */

        await checkCurrentUserAdmin();


        /* =====================================
           LOAD APPROVED PROFILES
        ====================================== */

        const {
            data:
                profiles,
            error
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
                    tags,
                    permanent_member,
                    status,
                    created_at
                `)
                
                .order(
                    "permanent_member",
                    {
                        ascending:
                            false
                    }
                )
                .order(
                    "created_at",
                    {
                        ascending:
                            true
                    }
                );


        if (
            error
        ) {

            throw error;

        }


        loadedMemberProfiles =
            Array.isArray(
                profiles
            )
                ? profiles
                : [];


        /* =====================================
           RENDER
        ====================================== */

        renderMembers();


        console.log(
            "MFDCO MEMBERS:",
            {
                total:
                    loadedMemberProfiles
                        .length,

                admin:
                    currentUserIsAdmin
            }
        );


    } catch (
        error
    ) {

        console.error(
            "MEMBERS LOAD ERROR:",
            error
        );


        membersGrid.innerHTML = `
            <div class="members-empty">
                加盟国情報を読み込めませんでした。
            </div>
        `;


        showMembersError(
            "加盟国情報の取得中にエラーが発生しました。"
        );

    }

}


/* =========================================
   INIT
========================================= */

document.addEventListener(
    "DOMContentLoaded",
    function () {

        setupMemberFilter();

        loadMembers();

    }
);


console.log(
    "MFDCO members.js loaded successfully."
);