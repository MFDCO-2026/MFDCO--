"use strict";


/* =========================================
   MFDCO CIPHER
========================================= */


/* =========================================
   CHARACTER SETS
========================================= */

const CHARACTER_SETS = {

    upper:
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ",

    lower:
        "abcdefghijklmnopqrstuvwxyz",

    numbers:
        "0123456789",

    symbols:
        "!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~",

    hiragana:
        "あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんがぎぐげござじずぜぞだぢづでどばびぶべぼぱぴぷぺぽぁぃぅぇぉゃゅょっー",

    katakana:
        "アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲンガギグゲゴザジズゼゾダヂヅデドバビブベボパピプペポァィゥェォャュョッー"

};


/* =========================================
   CONSTANTS
========================================= */

const DEFAULT_DIAL_VALUES = [
    1, 2, 3, 4, 5, 6, 7, 8, 9
];

const DEFAULT_ROTOR_COUNT = 3;

const MIN_ROTORS = 1;

const MAX_ROTORS = 9;


/* =========================================
   STATE
========================================= */

let numericBase = 10;

let rotors = [];


/* =========================================
   ELEMENTS
========================================= */

const alphabetInput =
    document.getElementById(
        "alphabet-input"
    );

const alphabetCount =
    document.getElementById(
        "alphabet-count"
    );

const encryptSpace =
    document.getElementById(
        "encrypt-space"
    );

const cipherKey =
    document.getElementById(
        "cipher-key"
    );

const rotorList =
    document.getElementById(
        "rotor-list"
    );

const rotorCount =
    document.getElementById(
        "rotor-count"
    );

const addRotorButton =
    document.getElementById(
        "add-rotor"
    );

const removeRotorButton =
    document.getElementById(
        "remove-rotor"
    );

const useReflector =
    document.getElementById(
        "use-reflector"
    );

const variableStep =
    document.getElementById(
        "variable-step"
    );

const plugboardInput =
    document.getElementById(
        "plugboard-input"
    );

const cipherInput =
    document.getElementById(
        "cipher-input"
    );

const cipherResult =
    document.getElementById(
        "cipher-result"
    );

const numericResult =
    document.getElementById(
        "numeric-result"
    );

const statusMessage =
    document.getElementById(
        "status-message"
    );


/* =========================================
   UTILITIES
========================================= */

function uniqueCharacters(text) {

    return [
        ...new Set(
            [...String(text)]
        )
    ].join("");

}


function mod(value, length) {

    if (length <= 0) {
        return 0;
    }


    return (
        (
            value % length
        ) +
        length
    ) % length;

}


function shuffleArray(array) {

    const result =
        [...array];


    for (
        let i = result.length - 1;
        i > 0;
        i--
    ) {

        const j =
            Math.floor(
                Math.random() *
                (i + 1)
            );


        [
            result[i],
            result[j]
        ] = [
            result[j],
            result[i]
        ];

    }


    return result;

}


function randomString(length = 20) {

    const characters =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";


    let result =
        "";


    for (
        let i = 0;
        i < length;
        i++
    ) {

        result +=
            characters[
                Math.floor(
                    Math.random() *
                    characters.length
                )
            ];

    }


    return result;

}


function setStatus(
    message,
    isError = false
) {

    statusMessage.textContent =
        message;


    statusMessage.classList.toggle(
        "error",
        isError
    );

}


/* =========================================
   COPY
========================================= */

async function copyText(
    value,
    button
) {

    if (!value) {
        return;
    }


    try {

        await navigator.clipboard
            .writeText(
                value
            );


        const original =
            button.textContent;


        button.textContent =
            "コピー済み";


        window.setTimeout(
            function () {

                button.textContent =
                    original;

            },
            1000
        );

    }
    catch {

        setStatus(
            "コピーに失敗しました。",
            true
        );

    }

}


/* =========================================
   ALPHABET
========================================= */

function normalizeAlphabet() {

    let alphabet =
        uniqueCharacters(
            alphabetInput.value
        );


    if (
        encryptSpace.checked
    ) {

        if (
            !alphabet.includes(" ")
        ) {

            alphabet += " ";

        }

    }
    else {

        alphabet =
            alphabet.replaceAll(
                " ",
                ""
            );

    }


    alphabetInput.value =
        alphabet;


    alphabetCount.textContent =
        `${[...alphabet].length}文字`;


    return alphabet;

}


function getAlphabet() {

    return [
        ...normalizeAlphabet()
    ];

}


/* =========================================
   HASH
========================================= */

function hashString(text) {

    let hash =
        2166136261 >>> 0;


    for (
        const character
        of String(text)
    ) {

        hash ^=
            character.codePointAt(0);


        hash =
            Math.imul(
                hash,
                16777619
            );


        hash >>>= 0;

    }


    return hash >>> 0;

}


/*
 * 暗号鍵から必要な数だけ
 * 決定論的な数値を生成する。
 *
 * 同じ鍵なら必ず同じ値になる。
 */

function deriveKeyNumbers(
    key,
    count,
    modulo
) {

    const values = [];


    let seed =
        hashString(
            key || "MFDCO"
        );


    for (
        let i = 0;
        i < count;
        i++
    ) {

        seed ^=
            Math.imul(
                i + 1,
                0x9e3779b1
            );


        seed =
            Math.imul(
                seed ^ (seed >>> 16),
                2246822519
            ) >>> 0;


        seed =
            Math.imul(
                seed ^ (seed >>> 13),
                3266489917
            ) >>> 0;


        seed ^=
            seed >>> 16;


        values.push(
            modulo > 0
                ? seed % modulo
                : 0
        );

    }


    return values;

}


/* =========================================
   ROTORS
========================================= */

function createRotor(index) {

    return {

        id:
            index + 1,

        values:
            [...DEFAULT_DIAL_VALUES]

    };

}


function initializeRotors() {

    rotors = [];


    for (
        let i = 0;
        i < DEFAULT_ROTOR_COUNT;
        i++
    ) {

        rotors.push(
            createRotor(i)
        );

    }


    renderRotors();

}


function addRotor() {

    if (
        rotors.length >=
        MAX_ROTORS
    ) {

        setStatus(
            "ダイヤルは最大9個です。",
            true
        );

        return;

    }


    rotors.push(
        createRotor(
            rotors.length
        )
    );


    renderRotors();


    setStatus(
        `DIAL ${rotors.length} を追加しました。`
    );

}


function removeRotor() {

    if (
        rotors.length <=
        MIN_ROTORS
    ) {

        setStatus(
            "ダイヤルは最低1個必要です。",
            true
        );

        return;

    }


    const removed =
        rotors.length;


    rotors.pop();


    renderRotors();


    setStatus(
        `DIAL ${removed} を削除しました。`
    );

}


function randomizeRotor(index) {

    rotors[index].values =
        shuffleArray(
            DEFAULT_DIAL_VALUES
        );


    renderRotors();


    setStatus(
        `DIAL ${index + 1} をランダム生成しました。`
    );

}


function randomizeAllRotors() {

    rotors.forEach(
        function (rotor) {

            rotor.values =
                shuffleArray(
                    DEFAULT_DIAL_VALUES
                );

        }
    );


    renderRotors();


    setStatus(
        `${rotors.length}個のダイヤルをランダム生成しました。`
    );

}


function resetRotors() {

    rotors.forEach(
        function (
            rotor,
            index
        ) {

            rotor.id =
                index + 1;


            rotor.values =
                [...DEFAULT_DIAL_VALUES];

        }
    );


    renderRotors();


    setStatus(
        "ダイヤルを初期状態へ戻しました。"
    );

}


/* =========================================
   ROTOR VALIDATION
========================================= */

function parseRotorValues(value) {

    const values =
        String(value)
            .split(",")
            .map(
                item =>
                    Number(
                        item.trim()
                    )
            );


    const valid =
        values.length === 9 &&
        values.every(
            number =>
                Number.isInteger(number) &&
                number >= 1 &&
                number <= 9
        ) &&
        new Set(values).size === 9;


    return valid
        ? values
        : null;

}


/* =========================================
   RENDER ROTORS
========================================= */

function renderRotors() {

    rotorList.innerHTML =
        "";


    rotorCount.textContent =
        `${rotors.length} / ${MAX_ROTORS}`;


    addRotorButton.disabled =
        rotors.length >=
        MAX_ROTORS;


    removeRotorButton.disabled =
        rotors.length <=
        MIN_ROTORS;


    rotors.forEach(
        function (
            rotor,
            index
        ) {

            const item =
                document.createElement(
                    "article"
                );


            item.className =
                "rotor-item";


            const header =
                document.createElement(
                    "div"
                );


            header.className =
                "rotor-item-header";


            const title =
                document.createElement(
                    "h3"
                );


            title.textContent =
                `DIAL ${index + 1}`;


            const randomButton =
                document.createElement(
                    "button"
                );


            randomButton.type =
                "button";


            randomButton.className =
                "rotor-random-button";


            randomButton.textContent =
                "ランダム";


            randomButton.addEventListener(
                "click",
                function () {

                    randomizeRotor(index);

                }
            );


            header.append(
                title,
                randomButton
            );


            const label =
                document.createElement(
                    "label"
                );


            label.className =
                "rotor-value-label";


            label.textContent =
                "ダイヤル値 1〜9";


            const input =
                document.createElement(
                    "input"
                );


            input.type =
                "text";


            input.className =
                "rotor-value-input";


            input.value =
                rotor.values.join(",");


            input.addEventListener(
                "change",
                function () {

                    const parsed =
                        parseRotorValues(
                            input.value
                        );


                    if (!parsed) {

                        input.value =
                            rotor.values.join(
                                ","
                            );


                        setStatus(
                            `DIAL ${index + 1} は1〜9を重複なく指定してください。`,
                            true
                        );


                        return;

                    }


                    rotor.values =
                        parsed;


                    setStatus(
                        `DIAL ${index + 1} を更新しました。`
                    );

                }
            );


            item.append(
                header,
                label,
                input
            );


            rotorList.appendChild(
                item
            );

        }
    );

}


/* =========================================
   PLUGBOARD
========================================= */

function createPlugboardMap(
    alphabet
) {

    const map =
        new Map();


    const used =
        new Set();


    const groups =
        plugboardInput.value
            .trim()
            .split(/\s+/)
            .filter(Boolean);


    groups.forEach(
        function (group) {

            const parts =
                group.split(":");


            if (
                parts.length !== 2
            ) {
                return;
            }


            const a =
                parts[0];


            const b =
                parts[1];


            if (
                [...a].length !== 1 ||
                [...b].length !== 1 ||
                a === b ||
                !alphabet.includes(a) ||
                !alphabet.includes(b) ||
                used.has(a) ||
                used.has(b)
            ) {

                return;

            }


            used.add(a);
            used.add(b);


            map.set(a, b);
            map.set(b, a);

        }
    );


    return map;

}


function applyPlugboard(
    character,
    map
) {

    return (
        map.get(character) ||
        character
    );

}


/* =========================================
   KEY STATE
========================================= */

/*
 * 初期位置入力欄は存在しない。
 *
 * 暗号化・復号化するたびに
 * 暗号鍵から内部ローター位置を
 * 自動生成する。
 *
 * そのため同じ鍵・同じ設定なら
 * 必ず同じ開始状態になる。
 */

function createInitialRotorState(
    key,
    rotorLength
) {

    return deriveKeyNumbers(
        key,
        rotorLength,
        9
    );

}


/* =========================================
   ROTOR SHIFT
========================================= */

function getRotorShift(
    rotor,
    rotorPosition,
    characterIndex,
    alphabetLength
) {

    const dialIndex =
        mod(
            rotorPosition +
            characterIndex,
            9
        );


    const dialValue =
        rotor.values[
            dialIndex
        ];


    const shift =
        dialValue +
        rotorPosition +
        (
            characterIndex %
            9
        );


    return mod(
        shift,
        alphabetLength
    );

}


/* =========================================
   ROTOR STEPPING
========================================= */

function stepRotorPositions(
    positions,
    characterIndex
) {

    if (
        positions.length === 0
    ) {
        return;
    }


    /*
     * 暗号文の内容には依存させない。
     *
     * 暗号化と復号化で
     * 必ず同じステップになるため。
     */

    let amount = 1;


    if (
        variableStep.checked
    ) {

        amount =
            1 +
            (
                characterIndex %
                3
            );

    }


    let carry =
        amount;


    for (
        let i = 0;
        i < positions.length;
        i++
    ) {

        if (
            carry <= 0
        ) {
            break;
        }


        const total =
            positions[i] +
            carry;


        positions[i] =
            mod(
                total,
                9
            );


        carry =
            Math.floor(
                total / 9
            );

    }

}


/* =========================================
   REFLECTION SHIFT
========================================= */

function getReflectionShift(
    key,
    characterIndex,
    alphabetLength
) {

    if (
        !useReflector.checked
    ) {

        return 0;

    }


    const seed =
        hashString(
            `${key}|REFLECT|${characterIndex}`
        );


    return mod(
        seed,
        alphabetLength
    );

}


/* =========================================
   CORE CIPHER
========================================= */

function transformCipher(
    sourceText,
    direction
) {

    const alphabet =
        getAlphabet();


    if (
        alphabet.length < 2
    ) {

        throw new Error(
            "使用文字を2文字以上設定してください。"
        );

    }


    const key =
        cipherKey.value;


    if (!key) {

        throw new Error(
            "暗号鍵を入力してください。"
        );

    }


    const alphabetLength =
        alphabet.length;


    const indexMap =
        new Map(
            alphabet.map(
                function (
                    character,
                    index
                ) {

                    return [
                        character,
                        index
                    ];

                }
            )
        );


    const plugboard =
        createPlugboardMap(
            alphabet
        );


    /*
     * ここで暗号鍵を自動適用。
     */

    const rotorPositions =
        createInitialRotorState(
            key,
            rotors.length
        );


    let output =
        "";


    let processedIndex =
        0;


    for (
        const originalCharacter
        of String(sourceText)
    ) {

        /*
         * スペースを暗号化しない場合は
         * そのまま出力。
         */

        if (
            originalCharacter === " " &&
            !encryptSpace.checked
        ) {

            output += " ";

            continue;

        }


        /*
         * 使用文字にない文字は
         * そのまま残す。
         */

        if (
            !indexMap.has(
                originalCharacter
            )
        ) {

            output +=
                originalCharacter;

            continue;

        }


        /*
         * プラグボード入力側。
         */

        let character =
            applyPlugboard(
                originalCharacter,
                plugboard
            );


        let value =
            indexMap.get(
                character
            );


        /*
         * 全ダイヤルの状態から
         * シフト量を生成。
         */

        let totalShift =
            0;


        rotors.forEach(
            function (
                rotor,
                rotorIndex
            ) {

                totalShift +=
                    getRotorShift(
                        rotor,
                        rotorPositions[
                            rotorIndex
                        ],
                        processedIndex,
                        alphabetLength
                    );

            }
        );


        /*
         * 暗号鍵と文字位置による
         * 追加シフト。
         */

        const keyShift =
            deriveKeyNumbers(
                `${key}|CHAR|${processedIndex}`,
                1,
                alphabetLength
            )[0];


        totalShift +=
            keyShift;


        /*
         * 反射補正。
         */

        totalShift +=
            getReflectionShift(
                key,
                processedIndex,
                alphabetLength
            );


        totalShift =
            mod(
                totalShift,
                alphabetLength
            );


        /*
         * 暗号化 / 復号化。
         *
         * 同じtotalShiftを
         * ＋と−で使用するので可逆。
         */

        if (
            direction ===
            "encrypt"
        ) {

            value =
                mod(
                    value +
                    totalShift,
                    alphabetLength
                );

        }
        else {

            value =
                mod(
                    value -
                    totalShift,
                    alphabetLength
                );

        }


        character =
            alphabet[value];


        /*
         * プラグボード出力側。
         */

        character =
            applyPlugboard(
                character,
                plugboard
            );


        output +=
            character;


        /*
         * 次の文字へ進む。
         */

        stepRotorPositions(
            rotorPositions,
            processedIndex
        );


        processedIndex++;

    }


    return output;

}


/* =========================================
   ENCRYPT
========================================= */

function encrypt() {

    const source =
        cipherInput.value;


    if (!source) {

        cipherResult.value =
            "";


        setStatus(
            "暗号化する文章を入力してください。",
            true
        );


        return;

    }


    /*
     * ランダム値は一切使用しない。
     *
     * 同じ入力
     * 同じ鍵
     * 同じダイヤル
     * 同じ設定
     *
     * なら毎回同じ結果。
     */

    cipherResult.value =
        transformCipher(
            source,
            "encrypt"
        );


    setStatus(
        "暗号化しました。"
    );

}


/* =========================================
   DECRYPT
========================================= */

function decrypt() {

    const source =
        cipherInput.value;


    if (!source) {

        cipherResult.value =
            "";


        setStatus(
            "復号化する暗号文を入力してください。",
            true
        );


        return;

    }


    cipherResult.value =
        transformCipher(
            source,
            "decrypt"
        );


    setStatus(
        "復号化しました。"
    );

}


/* =========================================
   NUMERIC ENCODE
========================================= */

function encodeNumeric(
    text,
    base
) {

    const alphabet =
        getAlphabet();


    if (
        alphabet.length < 2
    ) {

        throw new Error(
            "使用文字を2文字以上設定してください。"
        );

    }


    const indexMap =
        new Map(
            alphabet.map(
                function (
                    character,
                    index
                ) {

                    return [
                        character,
                        index
                    ];

                }
            )
        );


    const radix =
        BigInt(
            alphabet.length +
            1
        );


    let value =
        1n;


    for (
        const character
        of String(text)
    ) {

        if (
            !indexMap.has(
                character
            )
        ) {

            throw new Error(
                `使用文字に含まれない文字があります: ${character}`
            );

        }


        value =
            value *
            radix +
            BigInt(
                indexMap.get(
                    character
                ) + 1
            );

    }


    return value
        .toString(base)
        .toUpperCase();

}


/* =========================================
   NUMERIC PARSE
========================================= */

function parseBigIntByBase(
    source,
    base
) {

    const text =
        String(source)
            .trim();


    if (!text) {

        throw new Error(
            "数値を入力してください。"
        );

    }


    if (
        base === 2
    ) {

        if (
            !/^[01]+$/.test(text)
        ) {

            throw new Error(
                "2進数として正しくありません。"
            );

        }


        return BigInt(
            "0b" + text
        );

    }


    if (
        base === 16
    ) {

        if (
            !/^[0-9a-fA-F]+$/.test(
                text
            )
        ) {

            throw new Error(
                "16進数として正しくありません。"
            );

        }


        return BigInt(
            "0x" + text
        );

    }


    if (
        !/^[0-9]+$/.test(text)
    ) {

        throw new Error(
            "10進数として正しくありません。"
        );

    }


    return BigInt(text);

}


/* =========================================
   NUMERIC DECODE
========================================= */

function decodeNumeric(
    text,
    base
) {

    const alphabet =
        getAlphabet();


    if (
        alphabet.length < 2
    ) {

        throw new Error(
            "使用文字を2文字以上設定してください。"
        );

    }


    let value =
        parseBigIntByBase(
            text,
            base
        );


    const radix =
        BigInt(
            alphabet.length +
            1
        );


    const indexes =
        [];


    while (
        value > 1n
    ) {

        const digit =
            Number(
                value %
                radix
            );


        if (
            digit < 1 ||
            digit > alphabet.length
        ) {

            throw new Error(
                "現在の使用文字設定では復元できない数値です。"
            );

        }


        indexes.push(
            digit - 1
        );


        value =
            value /
            radix;

    }


    if (
        value !== 1n
    ) {

        throw new Error(
            "数値データの形式が正しくありません。"
        );

    }


    return indexes
        .reverse()
        .map(
            index =>
                alphabet[index]
        )
        .join("");

}


/* =========================================
   NUMERIC ACTIONS
========================================= */

function numericEncode() {

    const source =
        cipherInput.value;


    if (!source) {

        numericResult.value =
            "";


        setStatus(
            "数値化する文章を入力してください。",
            true
        );


        return;

    }


    numericResult.value =
        encodeNumeric(
            source,
            numericBase
        );


    setStatus(
        `${numericBase}進数へ数値化しました。`
    );

}


function numericDecode() {

    const source =
        cipherInput.value;


    if (!source) {

        numericResult.value =
            "";


        setStatus(
            "入力欄へ数値を入力してください。",
            true
        );


        return;

    }


    numericResult.value =
        decodeNumeric(
            source,
            numericBase
        );


    setStatus(
        `${numericBase}進数から復元しました。`
    );

}


/* =========================================
   EXPORT
========================================= */

function exportSettings() {

    normalizeAlphabet();


    /*
     * 暗号鍵は意図的に保存しない。
     */

    const data = {

        format:
            "MFDCO_CIPHER",

        version:
            3,

        alphabet:
            alphabetInput.value,

        encryptSpace:
            encryptSpace.checked,

        rotors:
            rotors.map(
                function (rotor) {

                    return {

                        values:
                            [...rotor.values]

                    };

                }
            ),

        advanced: {

            reflector:
                useReflector.checked,

            variableStep:
                variableStep.checked,

            plugboard:
                plugboardInput.value

        }

    };


    const blob =
        new Blob(
            [
                JSON.stringify(
                    data,
                    null,
                    2
                )
            ],
            {
                type:
                    "application/json"
            }
        );


    const url =
        URL.createObjectURL(
            blob
        );


    const anchor =
        document.createElement(
            "a"
        );


    anchor.href =
        url;


    anchor.download =
        "MFDCO_Cipher_Settings.json";


    document.body.appendChild(
        anchor
    );


    anchor.click();

    anchor.remove();


    window.setTimeout(
        function () {

            URL.revokeObjectURL(
                url
            );

        },
        1000
    );


    setStatus(
        "設定をエクスポートしました。暗号鍵は保存されていません。"
    );

}


/* =========================================
   IMPORT
========================================= */

async function importSettings(file) {

    const text =
        await file.text();


    const data =
        JSON.parse(text);


    if (
        data.format !==
        "MFDCO_CIPHER"
    ) {

        throw new Error(
            "MFDCO Cipherの設定ファイルではありません。"
        );

    }


    alphabetInput.value =
        String(
            data.alphabet || ""
        );


    encryptSpace.checked =
        Boolean(
            data.encryptSpace
        );


    if (
        Array.isArray(
            data.rotors
        )
    ) {

        const importedRotors =
            data.rotors
                .slice(
                    0,
                    MAX_ROTORS
                )
                .map(
                    function (
                        rotor,
                        index
                    ) {

                        const values =
                            parseRotorValues(
                                Array.isArray(
                                    rotor.values
                                )
                                    ? rotor.values.join(",")
                                    : ""
                            );


                        return {

                            id:
                                index + 1,

                            values:
                                values ||
                                [...DEFAULT_DIAL_VALUES]

                        };

                    }
                );


        if (
            importedRotors.length > 0
        ) {

            rotors =
                importedRotors;

        }

    }


    useReflector.checked =
        data.advanced
            ?.reflector !==
        false;


    variableStep.checked =
        data.advanced
            ?.variableStep !==
        false;


    plugboardInput.value =
        String(
            data.advanced
                ?.plugboard ||
            ""
        );


    normalizeAlphabet();

    renderRotors();


    setStatus(
        "設定をインポートしました。"
    );

}


/* =========================================
   CHARACTER EVENTS
========================================= */

document
    .querySelectorAll(
        "[data-character-set]"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    const preset =
                        CHARACTER_SETS[
                            button.dataset.characterSet
                        ];


                    alphabetInput.value =
                        uniqueCharacters(
                            alphabetInput.value +
                            preset
                        );


                    normalizeAlphabet();

                }
            );

        }
    );


alphabetInput.addEventListener(
    "change",
    normalizeAlphabet
);


encryptSpace.addEventListener(
    "change",
    normalizeAlphabet
);


document
    .getElementById(
        "clear-alphabet"
    )
    .addEventListener(
        "click",
        function () {

            alphabetInput.value =
                "";


            normalizeAlphabet();

        }
    );


/* =========================================
   KEY EVENTS
========================================= */

document
    .getElementById(
        "random-key"
    )
    .addEventListener(
        "click",
        function () {

            cipherKey.value =
                randomString(20);


            setStatus(
                "ランダム暗号鍵を生成しました。"
            );

        }
    );


document
    .getElementById(
        "copy-key"
    )
    .addEventListener(
        "click",
        function () {

            copyText(
                cipherKey.value,
                this
            );

        }
    );


/* =========================================
   ROTOR EVENTS
========================================= */

addRotorButton.addEventListener(
    "click",
    addRotor
);


removeRotorButton.addEventListener(
    "click",
    removeRotor
);


document
    .getElementById(
        "randomize-rotors"
    )
    .addEventListener(
        "click",
        randomizeAllRotors
    );


document
    .getElementById(
        "reset-rotors"
    )
    .addEventListener(
        "click",
        resetRotors
    );


/* =========================================
   ENCRYPT EVENT
========================================= */

document
    .getElementById(
        "encrypt-button"
    )
    .addEventListener(
        "click",
        function () {

            try {

                setStatus("");

                encrypt();

            }
            catch (error) {

                console.error(error);


                cipherResult.value =
                    "";


                setStatus(
                    error.message ||
                    "暗号化に失敗しました。",
                    true
                );

            }

        }
    );


/* =========================================
   DECRYPT EVENT
========================================= */

document
    .getElementById(
        "decrypt-button"
    )
    .addEventListener(
        "click",
        function () {

            try {

                setStatus("");

                decrypt();

            }
            catch (error) {

                console.error(error);


                cipherResult.value =
                    "";


                setStatus(
                    error.message ||
                    "復号化に失敗しました。",
                    true
                );

            }

        }
    );


/* =========================================
   BASE EVENTS
========================================= */

document
    .querySelectorAll(
        "[data-base]"
    )
    .forEach(
        function (button) {

            button.addEventListener(
                "click",
                function () {

                    numericBase =
                        Number(
                            button.dataset.base
                        );


                    document
                        .querySelectorAll(
                            "[data-base]"
                        )
                        .forEach(
                            function (item) {

                                item.classList.toggle(
                                    "active",
                                    item === button
                                );

                            }
                        );

                }
            );

        }
    );


/* =========================================
   NUMERIC EVENTS
========================================= */

document
    .getElementById(
        "numeric-encode-button"
    )
    .addEventListener(
        "click",
        function () {

            try {

                numericEncode();

            }
            catch (error) {

                console.error(error);


                numericResult.value =
                    "";


                setStatus(
                    error.message ||
                    "数値化に失敗しました。",
                    true
                );

            }

        }
    );


document
    .getElementById(
        "numeric-decode-button"
    )
    .addEventListener(
        "click",
        function () {

            try {

                numericDecode();

            }
            catch (error) {

                console.error(error);


                numericResult.value =
                    "";


                setStatus(
                    error.message ||
                    "数値からの復元に失敗しました。",
                    true
                );

            }

        }
    );


/* =========================================
   COPY EVENTS
========================================= */

document
    .getElementById(
        "copy-input"
    )
    .addEventListener(
        "click",
        function () {

            copyText(
                cipherInput.value,
                this
            );

        }
    );


document
    .getElementById(
        "copy-result"
    )
    .addEventListener(
        "click",
        function () {

            copyText(
                cipherResult.value,
                this
            );

        }
    );


document
    .getElementById(
        "copy-numeric"
    )
    .addEventListener(
        "click",
        function () {

            copyText(
                numericResult.value,
                this
            );

        }
    );


/* =========================================
   EXPORT / IMPORT EVENTS
========================================= */

document
    .getElementById(
        "export-settings"
    )
    .addEventListener(
        "click",
        exportSettings
    );


document
    .getElementById(
        "import-settings"
    )
    .addEventListener(
        "click",
        function () {

            document
                .getElementById(
                    "import-file"
                )
                .click();

        }
    );


document
    .getElementById(
        "import-file"
    )
    .addEventListener(
        "change",
        async function () {

            const file =
                this.files?.[0];


            if (!file) {
                return;
            }


            try {

                await importSettings(
                    file
                );

            }
            catch (error) {

                console.error(error);


                setStatus(
                    error.message ||
                    "設定のインポートに失敗しました。",
                    true
                );

            }


            this.value =
                "";

        }
    );


/* =========================================
   INITIALIZE
========================================= */

function initialize() {

    alphabetInput.value =
        CHARACTER_SETS.upper +
        CHARACTER_SETS.numbers;


    encryptSpace.checked =
        false;


    normalizeAlphabet();


    initializeRotors();


    setStatus("");


    console.log(
        "MFDCO Cipher v3 loaded."
    );

}


initialize();