"use strict";


/* =========================================
   MEMBER TAGS
   加盟者プロフィール用
========================================= */

window.MFDCO_MEMBER_TAGS = [
    "Youtuber",
    "BE",
    "JE 1.7.10",
    "JE 最新",
    "回路勢",
    "造形勢",
    "mod",

    "陸軍",
    "海軍",
    "空軍",
    "歩兵",

    "現代・近未来",
    "WW2",
    "WW1",
    "産業革命前",
    "超未来",

    "再現",
    "架空兵器",

    "コラボ歓迎",
    "交流歓迎",
    "国家運営",
    "同盟歓迎",

    "画像制作",
    "動画制作",
    "音楽制作",
    "Blender",
    "イラスト制作",
    "プログラミング"
];


/* =========================================
   WORK TAG GROUPS
   作品提出用
========================================= */

window.MFDCO_WORK_TAG_GROUPS = [

    {
        id: "edition",

        label: "対応環境",

        description:
            "作品が対応している環境・バージョン(任意)",

        tags: [
            "BE",
            "JE 1.7.10",
            "JE 最新",
            "modあり",
            "blender最新",
            
        ]
    },


    {
        id: "era",

        label: "時代",

        description:
            "作品のモチーフとなる年代・時代",

        tags: [
            "産業革命前",
            "WW1",
            "WW2",
            "冷戦",
            "現代",
            "近未来",
            "超未来"
        ]
    },


    {
        id: "category",

        label: "種類",

        description:
            "作品の主な分類",

        tags: [
            "陸上兵器",
            "艦艇",
            "航空機",
            "歩兵装備",
            "大規模建築",
            "建築",
            "回路",
            "小道具",
            "画像",
            "音楽",
            "効果音",
            "その他"
        ]
    },


    {
        id: "military",

        label: "詳細な種類",

        description:
            "作品の所属や主な用途",

        tags: [
            "戦闘艦(FF,DD,CC)",
            "軽空母・強襲揚陸艦",
            "戦艦・空母",
            "潜水艦",
            "小型艦",
            "支援艦",
            "無人艇",
            "民間舟艇",

            "戦闘車両",
            "砲",
            "支援車輛",
            "民間車輛",

            "戦闘機・攻撃機",
            "爆撃機",
            "哨戒機・警戒機",
            "UAV(無人航空機)",
            "ヘリ",
            "輸送機",

            "ミサイル・魚雷",
            "艦載砲・CIWS",
            "弾薬関係",
            
            "銃",
            "カスタムパーツ",
            "装備・衣類",
            "スキン・人物",

            "都市",
            "住宅関係",
            "軍事施設関係",

            "資料",
            "PC関係",
            "機械",
        ]
    },


    {
        id: "setting",

        label: "設定",

        description:
            "再現作品・架空作品などの区分",

        tags: [
            "再現",
            "アレンジ",
            "オリジナル",
            "国家設定あり"
        ]
    },


    {
        id: "format",

        label: "作品形式",

        description:
            "作品データの形式や制作方法",

        tags: [
            "ワールド",
            "建築データ",
            "schematic",
            "litematic",
            "mod",
            "アドオン",
            "リソースパック",
            "データパック",
            "Blender",
            "obj",
            "fbx",
            "画像",
            "音源",
            "動画",
            "プログラム",
            "その他"
        ]
    },


    {
        id: "feature",

        label: "特徴",

        description:
            "作品の特徴や利用目的",

        tags: [
            "茶番向け",
            "動画向け",
            "撮影向け",
            "展示向け",
            "改造ベース向け",
            "大規模",
            "軽量",
            "高ディテール"
        ]
    }

];


/* =========================================
   MEMBER TAG RENDERER
========================================= */

window.renderMfdcoMemberTags =
function (
    target,
    options = {}
) {

    const container =
        typeof target === "string"
            ? document.querySelector(target)
            : target;


    if (!container) {

        console.warn(
            "MFDCO TAGS: 加盟者タグ描画先が見つかりません。",
            target
        );

        return;

    }


    const inputName =
        options.inputName || "tags";


    const selectedTags =
        Array.isArray(options.selectedTags)
            ? options.selectedTags
            : [];


    container.innerHTML = "";


    window.MFDCO_MEMBER_TAGS.forEach(
        function (tag) {

            const label =
                document.createElement(
                    "label"
                );


            const input =
                document.createElement(
                    "input"
                );

            input.type =
                "checkbox";

            input.name =
                inputName;

            input.value =
                tag;

            input.checked =
                selectedTags.includes(tag);


            const span =
                document.createElement(
                    "span"
                );

            span.textContent =
                tag;


            label.appendChild(
                input
            );

            label.appendChild(
                span
            );


            container.appendChild(
                label
            );

        }
    );

};


/* =========================================
   WORK TAG RENDERER
========================================= */

window.renderMfdcoWorkTags =
function (
    target,
    options = {}
) {

    const container =
        typeof target === "string"
            ? document.querySelector(target)
            : target;


    if (!container) {

        console.warn(
            "MFDCO TAGS: 作品タグ描画先が見つかりません。",
            target
        );

        return;

    }


    const inputName =
        options.inputName || "work_tags";


    const selectedTags =
        Array.isArray(options.selectedTags)
            ? options.selectedTags
            : [];


    container.innerHTML =
        "";


    window.MFDCO_WORK_TAG_GROUPS.forEach(
        function (group) {

            /* =============================
               GROUP
            ============================= */

            const section =
                document.createElement(
                    "section"
                );

            section.className =
                "work-tag-group";

            section.dataset.group =
                group.id;


            /* =============================
               HEADER
            ============================= */

            const header =
                document.createElement(
                    "div"
                );

            header.className =
                "work-tag-group-header";


            const title =
                document.createElement(
                    "h3"
                );

            title.textContent =
                group.label;


            header.appendChild(
                title
            );


            if (
                group.description
            ) {

                const description =
                    document.createElement(
                        "p"
                    );

                description.textContent =
                    group.description;


                header.appendChild(
                    description
                );

            }


            section.appendChild(
                header
            );


            /* =============================
               TAG LIST
            ============================= */

            const list =
                document.createElement(
                    "div"
                );

            list.className =
                "work-tag-list";


            group.tags.forEach(
                function (tag) {

                    const label =
                        document.createElement(
                            "label"
                        );


                    const input =
                        document.createElement(
                            "input"
                        );

                    input.type =
                        "checkbox";

                    input.name =
                        inputName;

                    input.value =
                        tag;

                    input.dataset.group =
                        group.id;

                    input.checked =
                        selectedTags.includes(
                            tag
                        );


                    const span =
                        document.createElement(
                            "span"
                        );

                    span.textContent =
                        tag;


                    label.appendChild(
                        input
                    );

                    label.appendChild(
                        span
                    );


                    list.appendChild(
                        label
                    );

                }
            );


            section.appendChild(
                list
            );


            container.appendChild(
                section
            );

        }
    );

};


/* =========================================
   SELECTED MEMBER TAGS
========================================= */

window.getSelectedMfdcoMemberTags =
function (
    target
) {

    const container =
        typeof target === "string"
            ? document.querySelector(target)
            : target;


    if (!container) {
        return [];
    }


    return Array.from(
        container.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    ).map(
        function (input) {

            return input.value;

        }
    );

};


/* =========================================
   SELECTED WORK TAGS
========================================= */

window.getSelectedMfdcoWorkTags =
function (
    target
) {

    const container =
        typeof target === "string"
            ? document.querySelector(target)
            : target;


    if (!container) {
        return [];
    }


    return Array.from(
        container.querySelectorAll(
            'input[type="checkbox"]:checked'
        )
    ).map(
        function (input) {

            return input.value;

        }
    );

};


/* =========================================
   SELECTED WORK TAGS BY GROUP
========================================= */

window.getSelectedMfdcoWorkTagsByGroup =
function (
    target
) {

    const container =
        typeof target === "string"
            ? document.querySelector(target)
            : target;


    if (!container) {
        return {};
    }


    const result = {};


    container
        .querySelectorAll(
            'input[type="checkbox"]:checked'
        )
        .forEach(
            function (input) {

                const group =
                    input.dataset.group ||
                    "other";


                if (
                    !result[group]
                ) {

                    result[group] = [];

                }


                result[group].push(
                    input.value
                );

            }
        );


    return result;

};


console.log(
    "MFDCO tags.js loaded successfully."
);