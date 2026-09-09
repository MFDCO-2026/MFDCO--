"use strict";


/* =========================================
   MFDCO MORSE
========================================= */


/* =========================================
   MORSE TABLE - INTERNATIONAL
========================================= */

const ENGLISH_MORSE = {

    A: "・ー",
    B: "ー・・・",
    C: "ー・ー・",
    D: "ー・・",
    E: "・",
    F: "・・ー・",
    G: "ーー・",
    H: "・・・・",
    I: "・・",
    J: "・ーーー",
    K: "ー・ー",
    L: "・ー・・",
    M: "ーー",
    N: "ー・",
    O: "ーーー",
    P: "・ーー・",
    Q: "ーー・ー",
    R: "・ー・",
    S: "・・・",
    T: "ー",
    U: "・・ー",
    V: "・・・ー",
    W: "・ーー",
    X: "ー・・ー",
    Y: "ー・ーー",
    Z: "ーー・・",

    "0": "ーーーーー",
    "1": "・ーーーー",
    "2": "・・ーーー",
    "3": "・・・ーー",
    "4": "・・・・ー",
    "5": "・・・・・",
    "6": "ー・・・・",
    "7": "ーー・・・",
    "8": "ーーー・・",
    "9": "ーーーー・",

    ".": "・ー・ー・ー",
    ",": "ーー・・ーー",
    "?": "・・ーー・・",
    "/": "ー・・ー・",
    "-": "ー・・・・ー",
    "(": "ー・ーー・",
    ")": "ー・ーー・ー",
    ":": "ーーー・・・",
    "'": "・ーーーー・",
    "\"": "・ー・・ー・",
    "=": "ー・・・ー",
    "+": "・ー・ー・"
};



/* =========================================
   MORSE TABLE - WABUN
========================================= */

const JAPANESE_MORSE = {

    "イ": "・ー",
    "ロ": "・ー・ー",
    "ハ": "ー・・・",
    "ニ": "ー・ー・",
    "ホ": "ー・・",
    "ヘ": "・",
    "ト": "・・ー・・",
    "チ": "・・ー・",
    "リ": "ーー・",
    "ヌ": "・・・・",
    "ル": "ー・ーー・",
    "ヲ": "・ーーー",
    "ワ": "ー・ー",
    "カ": "・ー・・",
    "ヨ": "ーー",
    "タ": "ー・",
    "レ": "ーーー",
    "ソ": "ーーー・",
    "ツ": "・ーー・",
    "ネ": "ーー・ー",
    "ナ": "・ー・",
    "ラ": "・・・",
    "ム": "ー",
    "ウ": "・・ー",
    "ヰ": "・ー・・ー",
    "ノ": "・・ーー",
    "オ": "・ー・・・",
    "ク": "・・・ー",
    "ヤ": "・ーー",
    "マ": "ー・・ー",
    "ケ": "ー・ーー",
    "フ": "ーー・・",
    "コ": "ーーーー",
    "エ": "ー・ーーー",
    "テ": "・ー・ーー",
    "ア": "ーー・ーー",
    "サ": "ー・ー・ー",
    "キ": "ー・ー・・",
    "ユ": "ー・・ーー",
    "メ": "ー・・・ー",
    "ミ": "・・ー・ー",
    "シ": "ーー・ー・",
    "ヱ": "・ーー・・",
    "ヒ": "ーー・・ー",
    "モ": "ー・・ー・",
    "セ": "・ーーー・",
    "ス": "ーーー・ー",
    "ン": "・ー・ー・",

    "゛": "・・",
    "゜": "・・ーー・",

    "ー": "・ーー・ー",

    "、": "・ー・ー・ー",
    "。": "・ー・ー・・"
};



/* =========================================
   STATE
========================================= */

let currentLanguage = "ja";
let currentMode = "encode";

let playbackAbortController = null;



/* =========================================
   ELEMENTS
========================================= */

const languageButtons =
    document.querySelectorAll(
        "[data-language]"
    );

const modeButtons =
    document.querySelectorAll(
        "[data-mode]"
    );

const longSymbolInput =
    document.getElementById(
        "long-symbol"
    );

const shortSymbolInput =
    document.getElementById(
        "short-symbol"
    );

const letterSeparatorInput =
    document.getElementById(
        "letter-separator"
    );

const wordSeparatorInput =
    document.getElementById(
        "word-separator"
    );

const input =
    document.getElementById(
        "morse-input"
    );

const result =
    document.getElementById(
        "morse-result"
    );

const inputTitle =
    document.getElementById(
        "input-title"
    );

const resultTitle =
    document.getElementById(
        "result-title"
    );

const conversionMessage =
    document.getElementById(
        "conversion-message"
    );

const copyInputButton =
    document.getElementById(
        "copy-input"
    );

const copyResultButton =
    document.getElementById(
        "copy-result"
    );

const speedRange =
    document.getElementById(
        "speed-range"
    );

const speedNumber =
    document.getElementById(
        "speed-number"
    );

const playButton =
    document.getElementById(
        "play-button"
    );

const stopButton =
    document.getElementById(
        "stop-button"
    );

const downloadButton =
    document.getElementById(
        "download-button"
    );

const audioMessage =
    document.getElementById(
        "audio-message"
    );



/* =========================================
   HIRAGANA -> KATAKANA
========================================= */

function hiraganaToKatakana(text) {

    return text.replace(
        /[\u3041-\u3096]/g,
        function (character) {

            return String.fromCharCode(
                character.charCodeAt(0) +
                0x60
            );

        }
    );

}



/* =========================================
   NORMALIZE JAPANESE
========================================= */

function normalizeJapaneseText(text) {

    let normalized =
        hiraganaToKatakana(
            text
        );


    normalized =
        normalized.normalize(
            "NFD"
        );


    normalized =
        normalized
            .replace(/\u3099/g, "゛")
            .replace(/\u309A/g, "゜");


    return normalized;

}



/* =========================================
   TABLE
========================================= */

function getCurrentTable() {

    return currentLanguage === "ja"
        ? JAPANESE_MORSE
        : ENGLISH_MORSE;

}



/* =========================================
   SYMBOL SETTINGS
========================================= */

function getSymbols() {

    return {

        long:
            longSymbolInput.value ||
            "ー",

        short:
            shortSymbolInput.value ||
            "・",

        letterSeparator:
            letterSeparatorInput.value,

        wordSeparator:
            wordSeparatorInput.value ||
            "/"

    };

}



/* =========================================
   INTERNAL MORSE
========================================= */

function toDisplayMorse(code) {

    const symbols =
        getSymbols();


    return code
        .replaceAll(
            "ー",
            "\u0001"
        )
        .replaceAll(
            "・",
            "\u0002"
        )
        .replaceAll(
            "\u0001",
            symbols.long
        )
        .replaceAll(
            "\u0002",
            symbols.short
        );

}


function fromDisplayMorse(code) {

    const symbols =
        getSymbols();


    let value =
        String(code);


    if (
        symbols.long ===
        symbols.short
    ) {
        return value;
    }


    value =
        value
            .split(symbols.long)
            .join("\u0001")
            .split(symbols.short)
            .join("\u0002")
            .split("\u0001")
            .join("ー")
            .split("\u0002")
            .join("・");


    return value;

}



/* =========================================
   ENCODE
========================================= */

function encodeText(text) {

    const table =
        getCurrentTable();

    const symbols =
        getSymbols();


    let source =
        String(text);


    if (
        currentLanguage === "ja"
    ) {

        source =
            normalizeJapaneseText(
                source
            );

    }
    else {

        source =
            source.toUpperCase();

    }


    const output = [];

    let unknownCount = 0;


    for (
        const character
        of source
    ) {

        if (
            character === " " ||
            character === "　" ||
            character === "\n" ||
            character === "\t"
        ) {

            if (
                output.length > 0 &&
                output[
                    output.length - 1
                ] !== symbols.wordSeparator
            ) {

                output.push(
                    symbols.wordSeparator
                );

            }


            continue;

        }


        const code =
            table[character];


        if (code) {

            output.push(
                toDisplayMorse(
                    code
                )
            );

        }
        else {

            unknownCount++;

        }

    }


    let encoded =
        output.join(
            symbols.letterSeparator
        );


    if (unknownCount > 0) {

        setConversionMessage(
            `${unknownCount}文字は対応表にないため省略しました。`,
            true
        );

    }
    else {

        setConversionMessage(
            ""
        );

    }


    return encoded;

}



/* =========================================
   DECODE
========================================= */

function decodeText(text) {

    const table =
        getCurrentTable();

    const symbols =
        getSymbols();


    const reverseTable =
        Object.fromEntries(
            Object.entries(table)
                .map(
                    function (
                        [character, code]
                    ) {

                        return [
                            code,
                            character
                        ];

                    }
                )
        );


    let source =
        String(text).trim();


    if (!source) {

        setConversionMessage(
            ""
        );

        return "";

    }


    const words =
        source.split(
            symbols.wordSeparator
        );


    let unknownCount = 0;


    const decodedWords =
        words.map(
            function (word) {

                let codes;


                if (
                    symbols.letterSeparator
                ) {

                    codes =
                        word
                            .split(
                                symbols.letterSeparator
                            )
                            .filter(Boolean);

                }
                else {

                    codes = [word];

                }


                return codes
                    .map(
                        function (code) {

                            const normalized =
                                fromDisplayMorse(
                                    code.trim()
                                );


                            const character =
                                reverseTable[
                                    normalized
                                ];


                            if (!character) {

                                unknownCount++;

                                return "□";

                            }


                            return character;

                        }
                    )
                    .join("");

            }
        );


    if (unknownCount > 0) {

        setConversionMessage(
            `${unknownCount}個の符号を判別できませんでした。`,
            true
        );

    }
    else {

        setConversionMessage(
            ""
        );

    }


    return decodedWords.join(
        " "
    );

}



/* =========================================
   CONVERT
========================================= */

function convert() {

    if (!input || !result) {
        return;
    }


    if (
        currentMode === "encode"
    ) {

        result.value =
            encodeText(
                input.value
            );

    }
    else {

        result.value =
            decodeText(
                input.value
            );

    }

}



/* =========================================
   MESSAGE
========================================= */

function setConversionMessage(
    message,
    error = false
) {

    if (!conversionMessage) {
        return;
    }


    conversionMessage.textContent =
        message;


    conversionMessage.classList.toggle(
        "error",
        error
    );

}


function setAudioMessage(
    message,
    error = false
) {

    if (!audioMessage) {
        return;
    }


    audioMessage.textContent =
        message;


    audioMessage.classList.toggle(
        "error",
        error
    );

}



/* =========================================
   LANGUAGE
========================================= */

function setLanguage(language) {

    currentLanguage =
        language;


    languageButtons.forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.language ===
                currentLanguage
            );

        }
    );


    convert();

}



/* =========================================
   MODE
========================================= */

function setMode(mode) {

    currentMode =
        mode;


    modeButtons.forEach(
        function (button) {

            button.classList.toggle(
                "active",
                button.dataset.mode ===
                currentMode
            );

        }
    );


    if (
        currentMode === "encode"
    ) {

        inputTitle.textContent =
            "原文";

        resultTitle.textContent =
            "変換結果";

        input.placeholder =
            "変換する文章を入力してください。";

    }
    else {

        inputTitle.textContent =
            "モールス符号";

        resultTitle.textContent =
            "翻訳結果";

        input.placeholder =
            "モールス符号を入力してください。";

    }


    convert();

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
            "コピーしました";


        window.setTimeout(
            function () {

                button.textContent =
                    original;

            },
            1200
        );

    }
    catch {

        setConversionMessage(
            "コピーに失敗しました。",
            true
        );

    }

}



/* =========================================
   SPEED
========================================= */

function clampSpeed(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number)
    ) {
        return 20;
    }


    return Math.min(
        60,
        Math.max(
            5,
            Math.round(number)
        )
    );

}


function setSpeed(value) {

    const speed =
        clampSpeed(
            value
        );


    speedRange.value =
        String(speed);

    speedNumber.value =
        String(speed);

}



/* =========================================
   GET MORSE FOR AUDIO
========================================= */

function getAudioMorse() {

    let value;


    if (
        currentMode === "encode"
    ) {

        value =
            result.value;

    }
    else {

        value =
            input.value;

    }


    return String(value).trim();

}



/* =========================================
   AUDIO TOKENS
========================================= */

function createAudioTimeline() {

    const source =
        getAudioMorse();


    if (!source) {
        return [];
    }


    const symbols =
        getSymbols();


    const internal =
        fromDisplayMorse(
            source
        );


    const timeline = [];


    let index = 0;


    while (
        index <
        internal.length
    ) {

        if (
            internal.startsWith(
                symbols.wordSeparator,
                index
            )
        ) {

            timeline.push({
                type: "silence",
                units: 7
            });

            index +=
                symbols.wordSeparator.length;

            continue;

        }


        if (
            symbols.letterSeparator &&
            internal.startsWith(
                symbols.letterSeparator,
                index
            )
        ) {

            timeline.push({
                type: "silence",
                units: 3
            });

            index +=
                symbols.letterSeparator.length;

            continue;

        }


        const character =
            internal[index];


        if (
            character === "・"
        ) {

            timeline.push({
                type: "short",
                units: 1
            });


            const next =
                internal[
                    index + 1
                ];


            if (
                next === "・" ||
                next === "ー"
            ) {

                timeline.push({
                    type: "silence",
                    units: 1
                });

            }

        }
        else if (
            character === "ー"
        ) {

            timeline.push({
                type: "long",
                units: 3
            });


            const next =
                internal[
                    index + 1
                ];


            if (
                next === "・" ||
                next === "ー"
            ) {

                timeline.push({
                    type: "silence",
                    units: 1
                });

            }

        }


        index++;

    }


    return timeline;

}



/* =========================================
   AUDIO FILE CACHE
========================================= */

let shortAudioBuffer = null;
let longAudioBuffer = null;


async function loadAudioBuffers(
    audioContext
) {

    if (
        shortAudioBuffer &&
        longAudioBuffer
    ) {

        return;

    }


    const [
        shortResponse,
        longResponse
    ] =
        await Promise.all([
            fetch("media/short.mp3"),
            fetch("media/long.mp3")
        ]);


    if (
        !shortResponse.ok ||
        !longResponse.ok
    ) {

        throw new Error(
            "音声ファイルを読み込めません。"
        );

    }


    const [
        shortData,
        longData
    ] =
        await Promise.all([
            shortResponse.arrayBuffer(),
            longResponse.arrayBuffer()
        ]);


    [
        shortAudioBuffer,
        longAudioBuffer
    ] =
        await Promise.all([
            audioContext.decodeAudioData(
                shortData
            ),
            audioContext.decodeAudioData(
                longData
            )
        ]);

}



/* =========================================
   PLAY
========================================= */

async function playMorse() {

    stopMorse();


    const timeline =
        createAudioTimeline();


    if (
        timeline.length === 0
    ) {

        setAudioMessage(
            "再生できるモールス符号がありません。",
            true
        );

        return;

    }


    const AudioContextClass =
        window.AudioContext ||
        window.webkitAudioContext;


    if (!AudioContextClass) {

        setAudioMessage(
            "このブラウザでは音声再生に対応していません。",
            true
        );

        return;

    }


    const context =
        new AudioContextClass();


    try {

        await loadAudioBuffers(
            context
        );

    }
    catch (error) {

        console.error(error);


        await context.close();


        setAudioMessage(
            "media/short.mp3 または media/long.mp3 を読み込めません。",
            true
        );


        return;

    }


    const controller =
        new AbortController();


    playbackAbortController = {
        controller,
        context,
        sources: []
    };


    const speed =
        clampSpeed(
            speedNumber.value
        );


    const unitSeconds =
        1.2 / speed;


    let time =
        context.currentTime +
        0.05;


    for (
        const event
        of timeline
    ) {

        if (
            event.type === "silence"
        ) {

            time +=
                event.units *
                unitSeconds;


            continue;

        }


        const source =
            context.createBufferSource();


        source.buffer =
            event.type === "short"
                ? shortAudioBuffer
                : longAudioBuffer;


        source.connect(
            context.destination
        );


        const requiredDuration =
            event.units *
            unitSeconds;


        const originalDuration =
            source.buffer.duration;


        if (
            originalDuration > 0
        ) {

            source.playbackRate.value =
                originalDuration /
                requiredDuration;

        }


        source.start(
            time
        );


        source.stop(
            time +
            requiredDuration
        );


        playbackAbortController
            .sources
            .push(
                source
            );


        time +=
            requiredDuration;

    }


    playButton.disabled =
        true;

    stopButton.disabled =
        false;


    setAudioMessage(
        `${speed} WPM で再生しています。`
    );


    const remaining =
        Math.max(
            0,
            time -
            context.currentTime
        );


    window.setTimeout(
        async function () {

            if (
                playbackAbortController?.controller ===
                controller
            ) {

                try {
                    await context.close();
                }
                catch {
                    /* ignore */
                }


                playbackAbortController =
                    null;


                playButton.disabled =
                    false;

                stopButton.disabled =
                    true;


                setAudioMessage(
                    "再生が完了しました。"
                );

            }

        },
        remaining * 1000 + 100
    );

}



/* =========================================
   STOP
========================================= */

function stopMorse() {

    if (
        !playbackAbortController
    ) {

        playButton.disabled =
            false;

        stopButton.disabled =
            true;

        return;

    }


    const playback =
        playbackAbortController;


    playbackAbortController =
        null;


    playback.sources.forEach(
        function (source) {

            try {
                source.stop();
            }
            catch {
                /* ignore */
            }

        }
    );


    try {
        playback.context.close();
    }
    catch {
        /* ignore */
    }


    playButton.disabled =
        false;

    stopButton.disabled =
        true;


    setAudioMessage(
        "再生を停止しました。"
    );

}



/* =========================================
   WAV GENERATION
========================================= */

function generateWav() {

    const timeline =
        createAudioTimeline();


    if (
        timeline.length === 0
    ) {

        setAudioMessage(
            "音声に変換できるモールス符号がありません。",
            true
        );

        return;

    }


    const speed =
        clampSpeed(
            speedNumber.value
        );


    const unitSeconds =
        1.2 / speed;


    const sampleRate =
        44100;


    const frequency =
        700;


    const totalSeconds =
        timeline.reduce(
            function (
                total,
                event
            ) {

                return (
                    total +
                    event.units *
                    unitSeconds
                );

            },
            0
        );


    const sampleCount =
        Math.ceil(
            totalSeconds *
            sampleRate
        );


    const samples =
        new Float32Array(
            sampleCount
        );


    let offset = 0;


    timeline.forEach(
        function (event) {

            const duration =
                event.units *
                unitSeconds;


            const length =
                Math.floor(
                    duration *
                    sampleRate
                );


            if (
                event.type !==
                "silence"
            ) {

                const fadeSamples =
                    Math.min(
                        Math.floor(
                            sampleRate *
                            0.005
                        ),
                        Math.floor(
                            length / 4
                        )
                    );


                for (
                    let i = 0;
                    i < length;
                    i++
                ) {

                    let envelope = 1;


                    if (
                        fadeSamples > 0
                    ) {

                        if (
                            i <
                            fadeSamples
                        ) {

                            envelope =
                                i /
                                fadeSamples;

                        }
                        else if (
                            i >
                            length -
                            fadeSamples
                        ) {

                            envelope =
                                (
                                    length -
                                    i
                                ) /
                                fadeSamples;

                        }

                    }


                    samples[
                        offset + i
                    ] =
                        Math.sin(
                            2 *
                            Math.PI *
                            frequency *
                            (
                                i /
                                sampleRate
                            )
                        ) *
                        0.65 *
                        envelope;

                }

            }


            offset +=
                length;

        }
    );


    const wav =
        encodeWav(
            samples,
            sampleRate
        );


    const blob =
        new Blob(
            [wav],
            {
                type: "audio/wav"
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
        `MFDCO_morse_${speed}WPM.wav`;


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


    setAudioMessage(
        `${speed} WPM のWAV音声を生成しました。`
    );

}



/* =========================================
   WAV ENCODER
========================================= */

function encodeWav(
    samples,
    sampleRate
) {

    const bytesPerSample = 2;

    const buffer =
        new ArrayBuffer(
            44 +
            samples.length *
            bytesPerSample
        );


    const view =
        new DataView(
            buffer
        );


    function writeString(
        offset,
        value
    ) {

        for (
            let i = 0;
            i < value.length;
            i++
        ) {

            view.setUint8(
                offset + i,
                value.charCodeAt(i)
            );

        }

    }


    writeString(
        0,
        "RIFF"
    );


    view.setUint32(
        4,
        36 +
        samples.length *
        bytesPerSample,
        true
    );


    writeString(
        8,
        "WAVE"
    );


    writeString(
        12,
        "fmt "
    );


    view.setUint32(
        16,
        16,
        true
    );


    view.setUint16(
        20,
        1,
        true
    );


    view.setUint16(
        22,
        1,
        true
    );


    view.setUint32(
        24,
        sampleRate,
        true
    );


    view.setUint32(
        28,
        sampleRate *
        bytesPerSample,
        true
    );


    view.setUint16(
        32,
        bytesPerSample,
        true
    );


    view.setUint16(
        34,
        16,
        true
    );


    writeString(
        36,
        "data"
    );


    view.setUint32(
        40,
        samples.length *
        bytesPerSample,
        true
    );


    let offset = 44;


    for (
        let i = 0;
        i < samples.length;
        i++
    ) {

        const sample =
            Math.max(
                -1,
                Math.min(
                    1,
                    samples[i]
                )
            );


        view.setInt16(
            offset,
            sample < 0
                ? sample * 0x8000
                : sample * 0x7fff,
            true
        );


        offset += 2;

    }


    return buffer;

}



/* =========================================
   EVENTS
========================================= */

languageButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                setLanguage(
                    button.dataset.language
                );

            }
        );

    }
);


modeButtons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function () {

                setMode(
                    button.dataset.mode
                );

            }
        );

    }
);


input.addEventListener(
    "input",
    convert
);


[
    longSymbolInput,
    shortSymbolInput,
    letterSeparatorInput,
    wordSeparatorInput
].forEach(
    function (element) {

        element.addEventListener(
            "input",
            convert
        );

    }
);


copyInputButton.addEventListener(
    "click",
    function () {

        copyText(
            input.value,
            copyInputButton
        );

    }
);


copyResultButton.addEventListener(
    "click",
    function () {

        copyText(
            result.value,
            copyResultButton
        );

    }
);


speedRange.addEventListener(
    "input",
    function () {

        setSpeed(
            speedRange.value
        );

    }
);


speedNumber.addEventListener(
    "change",
    function () {

        setSpeed(
            speedNumber.value
        );

    }
);


playButton.addEventListener(
    "click",
    playMorse
);


stopButton.addEventListener(
    "click",
    stopMorse
);


downloadButton.addEventListener(
    "click",
    generateWav
);



/* =========================================
   INITIALIZE
========================================= */

setSpeed(20);

setLanguage("ja");

setMode("encode");


console.log(
    "MFDCO Morse loaded."
);