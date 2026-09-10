"use strict";


/* =========================================
   MFDCO CARRIER LAUNCH CALCULATOR
========================================= */


/*
 * IMPORTANT
 *
 * このツールはMinecraft・架空兵器向けの
 * MFDCO独自シミュレーションです。
 *
 * 実在する航空母艦・航空機・カタパルトの
 * 性能を再現するものではありません。
 */


/* =========================================
   CONSTANTS
========================================= */

const GRAVITY = 9.80665;

const BLOCK_AREA = 1;


/* =========================================
   MFDCO SIMULATION PRESETS
========================================= */

const PRESETS = {

    "large-emals": {

        type:
            "ELECTROMAGNETIC",

        length:
            90,

        force:
            1000,

        efficiency:
            85,

        safety:
            1.20,

        shipSpeed:
            15,

        headwind:
            8,

        density:
            1.225,

        wingBlocks:
            50,

        liftCoefficient:
            1.60,

        aircraftMass:
            25000

    },


    "medium-emals": {

        type:
            "ELECTROMAGNETIC",

        length:
            70,

        force:
            700,

        efficiency:
            82,

        safety:
            1.20,

        shipSpeed:
            13,

        headwind:
            7,

        density:
            1.225,

        wingBlocks:
            42,

        liftCoefficient:
            1.55,

        aircraftMass:
            18000

    },


    "steam": {

        type:
            "STEAM",

        length:
            80,

        force:
            800,

        efficiency:
            72,

        safety:
            1.22,

        shipSpeed:
            14,

        headwind:
            7,

        density:
            1.225,

        wingBlocks:
            45,

        liftCoefficient:
            1.55,

        aircraftMass:
            22000

    },


    "minecraft": {

        type:
            "MINECRAFT",

        length:
            60,

        force:
            500,

        efficiency:
            75,

        safety:
            1.15,

        shipSpeed:
            10,

        headwind:
            5,

        density:
            1.225,

        wingBlocks:
            35,

        liftCoefficient:
            1.70,

        aircraftMass:
            12000

    }

};


/* =========================================
   ELEMENTS
========================================= */

const presetSelect =
    document.getElementById(
        "preset-select"
    );


const catapultTypeLabel =
    document.getElementById(
        "catapult-type-label"
    );


const catapultLengthInput =
    document.getElementById(
        "catapult-length"
    );


const catapultForceInput =
    document.getElementById(
        "catapult-force"
    );


const efficiencyInput =
    document.getElementById(
        "catapult-efficiency"
    );


const safetyFactorInput =
    document.getElementById(
        "safety-factor"
    );


const shipSpeedInput =
    document.getElementById(
        "ship-speed"
    );


const headwindInput =
    document.getElementById(
        "headwind"
    );


const airDensityInput =
    document.getElementById(
        "air-density"
    );


const wingBlocksInput =
    document.getElementById(
        "wing-blocks"
    );


const liftCoefficientInput =
    document.getElementById(
        "lift-coefficient"
    );


const aircraftMassInput =
    document.getElementById(
        "aircraft-mass"
    );


const baseAirSpeedDisplay =
    document.getElementById(
        "base-air-speed"
    );


const wingAreaDisplay =
    document.getElementById(
        "wing-area-display"
    );


/* =========================================
   RESULT ELEMENTS
========================================= */

const launchStatus =
    document.getElementById(
        "launch-status"
    );


const maxMassResult =
    document.getElementById(
        "max-mass-result"
    );


const maxMassTonResult =
    document.getElementById(
        "max-mass-ton-result"
    );


const requiredSpeedResult =
    document.getElementById(
        "required-speed-result"
    );


const catapultSpeedResult =
    document.getElementById(
        "catapult-speed-result"
    );


const accelerationResult =
    document.getElementById(
        "acceleration-result"
    );


const gForceResult =
    document.getElementById(
        "g-force-result"
    );


const marginResult =
    document.getElementById(
        "margin-result"
    );


const wingLoadingResult =
    document.getElementById(
        "wing-loading-result"
    );


const judgementTitle =
    document.getElementById(
        "judgement-title"
    );


const judgementDescription =
    document.getElementById(
        "judgement-description"
    );


/* =========================================
   UTILITIES
========================================= */

function numberValue(element) {

    return Number(
        element.value
    );

}


function clamp(
    value,
    minimum,
    maximum
) {

    return Math.min(
        maximum,
        Math.max(
            minimum,
            value
        )
    );

}


function formatNumber(
    value,
    digits = 1
) {

    if (
        !Number.isFinite(value)
    ) {

        return "---";

    }


    return value.toLocaleString(
        "ja-JP",
        {
            minimumFractionDigits:
                digits,

            maximumFractionDigits:
                digits
        }
    );

}


/* =========================================
   LIVE DISPLAY
========================================= */

function updateLiveDisplay() {

    const shipSpeed =
        Math.max(
            0,
            numberValue(
                shipSpeedInput
            ) || 0
        );


    const headwind =
        Math.max(
            0,
            numberValue(
                headwindInput
            ) || 0
        );


    const wingBlocks =
        Math.max(
            0,
            numberValue(
                wingBlocksInput
            ) || 0
        );


    const baseAirSpeed =
        shipSpeed +
        headwind;


    const wingArea =
        wingBlocks *
        BLOCK_AREA;


    baseAirSpeedDisplay.textContent =
        formatNumber(
            baseAirSpeed,
            1
        );


    wingAreaDisplay.textContent =
        formatNumber(
            wingArea,
            1
        );

}


/* =========================================
   PRESETS
========================================= */

function applyPreset(name) {

    if (
        name === "custom"
    ) {

        catapultTypeLabel.textContent =
            "CUSTOM";

        return;

    }


    const preset =
        PRESETS[name];


    if (!preset) {
        return;
    }


    catapultTypeLabel.textContent =
        preset.type;


    catapultLengthInput.value =
        preset.length;


    catapultForceInput.value =
        preset.force;


    efficiencyInput.value =
        preset.efficiency;


    safetyFactorInput.value =
        preset.safety;


    shipSpeedInput.value =
        preset.shipSpeed;


    headwindInput.value =
        preset.headwind;


    airDensityInput.value =
        preset.density;


    wingBlocksInput.value =
        preset.wingBlocks;


    liftCoefficientInput.value =
        preset.liftCoefficient;


    aircraftMassInput.value =
        preset.aircraftMass;


    updateLiveDisplay();

}


/* =========================================
   SIMULATION MODEL
========================================= */


/*
 * 揚力から、その重量の航空機に必要な
 * MFDCO発艦対気速度を計算。
 *
 * V =
 * safety × sqrt(
 *   2mg /
 *   (rho × S × CL)
 * )
 */

function requiredAirSpeed(
    mass,
    density,
    wingArea,
    liftCoefficient,
    safetyFactor
) {

    if (
        mass <= 0 ||
        density <= 0 ||
        wingArea <= 0 ||
        liftCoefficient <= 0
    ) {

        return Infinity;

    }


    const stallSpeed =
        Math.sqrt(
            (
                2 *
                mass *
                GRAVITY
            ) /
            (
                density *
                wingArea *
                liftCoefficient
            )
        );


    return (
        stallSpeed *
        safetyFactor
    );

}


/*
 * カタパルトが利用できる
 * MFDCOシミュレーション仕事量。
 *
 * E = F × L × efficiency
 */

function catapultEnergy(
    forceKn,
    length,
    efficiency
) {

    const forceNewton =
        forceKn *
        1000;


    return (
        forceNewton *
        length *
        efficiency
    );

}


/*
 * 指定重量を発艦可能か判定。
 */

function evaluateMass(
    mass,
    settings
) {

    const requiredSpeed =
        requiredAirSpeed(
            mass,
            settings.density,
            settings.wingArea,
            settings.liftCoefficient,
            settings.safetyFactor
        );


    const baseAirSpeed =
        settings.shipSpeed +
        settings.headwind;


    /*
     * カタパルトで追加する必要がある速度。
     */

    const requiredCatapultSpeed =
        Math.max(
            0,
            requiredSpeed -
            baseAirSpeed
        );


    /*
     * MFDCO簡易エネルギーモデル。
     */

    const requiredEnergy =
        0.5 *
        mass *
        requiredCatapultSpeed *
        requiredCatapultSpeed;


    const availableEnergy =
        catapultEnergy(
            settings.forceKn,
            settings.length,
            settings.efficiency
        );


    return {

        possible:
            requiredEnergy <=
            availableEnergy,

        requiredSpeed,

        requiredCatapultSpeed,

        requiredEnergy,

        availableEnergy

    };

}


/* =========================================
   MAX MASS SEARCH
========================================= */

/*
 * 重量は揚力側にもカタパルト側にも影響するため、
 * 直接一発で決めず二分探索する。
 */

function findMaximumMass(
    settings
) {

    let low =
        1;


    /*
     * MFDCOシミュレーター上の探索上限。
     * 実在装備の上限値ではない。
     */

    let high =
        500000;


    for (
        let i = 0;
        i < 90;
        i++
    ) {

        const middle =
            (
                low +
                high
            ) / 2;


        const result =
            evaluateMass(
                middle,
                settings
            );


        if (
            result.possible
        ) {

            low =
                middle;

        }
        else {

            high =
                middle;

        }

    }


    return low;

}


/* =========================================
   SETTINGS
========================================= */

function readSettings() {

    const settings = {

        length:
            numberValue(
                catapultLengthInput
            ),

        forceKn:
            numberValue(
                catapultForceInput
            ),

        efficiency:
            numberValue(
                efficiencyInput
            ) / 100,

        safetyFactor:
            numberValue(
                safetyFactorInput
            ),

        shipSpeed:
            numberValue(
                shipSpeedInput
            ),

        headwind:
            numberValue(
                headwindInput
            ),

        density:
            numberValue(
                airDensityInput
            ),

        wingArea:
            numberValue(
                wingBlocksInput
            ) *
            BLOCK_AREA,

        liftCoefficient:
            numberValue(
                liftCoefficientInput
            ),

        aircraftMass:
            numberValue(
                aircraftMassInput
            )

    };


    if (
        !Number.isFinite(
            settings.length
        ) ||
        settings.length <= 0
    ) {

        throw new Error(
            "カタパルト長を正しく入力してください。"
        );

    }


    if (
        !Number.isFinite(
            settings.forceKn
        ) ||
        settings.forceKn <= 0
    ) {

        throw new Error(
            "カタパルト推力を正しく入力してください。"
        );

    }


    if (
        !Number.isFinite(
            settings.efficiency
        ) ||
        settings.efficiency <= 0 ||
        settings.efficiency > 1
    ) {

        throw new Error(
            "システム効率を1〜100%で入力してください。"
        );

    }


    if (
        !Number.isFinite(
            settings.safetyFactor
        ) ||
        settings.safetyFactor < 1
    ) {

        throw new Error(
            "安全係数は1以上にしてください。"
        );

    }


    if (
        !Number.isFinite(
            settings.density
        ) ||
        settings.density <= 0
    ) {

        throw new Error(
            "空気密度を正しく入力してください。"
        );

    }


    if (
        !Number.isFinite(
            settings.wingArea
        ) ||
        settings.wingArea <= 0
    ) {

        throw new Error(
            "翼面積を1ブロック以上にしてください。"
        );

    }


    if (
        !Number.isFinite(
            settings.liftCoefficient
        ) ||
        settings.liftCoefficient <= 0
    ) {

        throw new Error(
            "最大揚力係数を正しく入力してください。"
        );

    }


    settings.shipSpeed =
        Math.max(
            0,
            settings.shipSpeed || 0
        );


    settings.headwind =
        Math.max(
            0,
            settings.headwind || 0
        );


    settings.aircraftMass =
        Math.max(
            0,
            settings.aircraftMass || 0
        );


    return settings;

}


/* =========================================
   STATUS
========================================= */

function setLaunchStatus(
    text,
    type
) {

    launchStatus.textContent =
        text;


    launchStatus.className =
        "launch-status";


    launchStatus.classList.add(
        type
    );

}


/* =========================================
   JUDGEMENT
========================================= */

function updateJudgement(
    actualMass,
    maximumMass
) {

    if (
        actualMass <= 0
    ) {

        setLaunchStatus(
            "最大重量計算",
            "neutral"
        );


        judgementTitle.textContent =
            "最大重量のみ表示";


        judgementDescription.textContent =
            "実際の機体重量が0kgのため、最大発艦重量のみ計算しています。";


        return;

    }


    const ratio =
        actualMass /
        maximumMass;


    if (
        ratio <= 0.80
    ) {

        setLaunchStatus(
            "発艦余裕あり",
            "good"
        );


        judgementTitle.textContent =
            "余裕あり";


        judgementDescription.textContent =
            "MFDCOシミュレーション上では、設定された条件に対して十分な発艦余裕があります。";


        return;

    }


    if (
        ratio <= 0.95
    ) {

        setLaunchStatus(
            "発艦可能",
            "good"
        );


        judgementTitle.textContent =
            "発艦可能";


        judgementDescription.textContent =
            "MFDCOシミュレーション上では発艦可能範囲ですが、重量増加や風の低下で余裕が減少します。";


        return;

    }


    if (
        ratio <= 1
    ) {

        setLaunchStatus(
            "限界付近",
            "warning"
        );


        judgementTitle.textContent =
            "発艦限界付近";


        judgementDescription.textContent =
            "最大発艦重量に近い状態です。MFDCOシミュレーション上では余裕が小さい条件です。";


        return;

    }


    setLaunchStatus(
        "発艦困難",
        "danger"
    );


    judgementTitle.textContent =
        "重量超過";


    judgementDescription.textContent =
        "入力された機体重量がMFDCOシミュレーション上の推定最大発艦重量を超えています。";

}


/* =========================================
   CALCULATE
========================================= */

function calculate() {

    const settings =
        readSettings();


    const maximumMass =
        findMaximumMass(
            settings
        );


    /*
     * 最大重量時の状態。
     */

    const maximumEvaluation =
        evaluateMass(
            maximumMass,
            settings
        );


    /*
     * 平均加速度。
     *
     * v² = 2as
     */

    const acceleration =
        (
            maximumEvaluation
                .requiredCatapultSpeed *
            maximumEvaluation
                .requiredCatapultSpeed
        ) /
        (
            2 *
            settings.length
        );


    const gForce =
        acceleration /
        GRAVITY;


    /*
     * 実際の機体重量に対する余裕率。
     */

    let margin =
        100;


    let wingLoading =
        maximumMass /
        settings.wingArea;


    if (
        settings.aircraftMass > 0
    ) {

        margin =
            (
                (
                    maximumMass -
                    settings.aircraftMass
                ) /
                maximumMass
            ) *
            100;


        wingLoading =
            settings.aircraftMass /
            settings.wingArea;

    }


    /*
     * 表示。
     */

    maxMassResult.textContent =
        Math.round(
            maximumMass
        ).toLocaleString(
            "ja-JP"
        );


    maxMassTonResult.textContent =
        `${formatNumber(
            maximumMass / 1000,
            1
        )} t`;


    requiredSpeedResult.textContent =
        formatNumber(
            maximumEvaluation
                .requiredSpeed,
            1
        );


    catapultSpeedResult.textContent =
        formatNumber(
            maximumEvaluation
                .requiredCatapultSpeed,
            1
        );


    accelerationResult.textContent =
        formatNumber(
            acceleration,
            1
        );


    gForceResult.textContent =
        formatNumber(
            gForce,
            2
        );


    marginResult.textContent =
        formatNumber(
            margin,
            1
        );


    wingLoadingResult.textContent =
        formatNumber(
            wingLoading,
            1
        );


    updateJudgement(
        settings.aircraftMass,
        maximumMass
    );

}


/* =========================================
   ERROR
========================================= */

function showError(error) {

    console.error(error);


    setLaunchStatus(
        "入力エラー",
        "danger"
    );


    judgementTitle.textContent =
        "計算できません";


    judgementDescription.textContent =
        error.message ||
        "入力内容を確認してください。";

}


/* =========================================
   CUSTOM MODE
========================================= */

function setCustomPreset() {

    if (
        presetSelect.value !==
        "custom"
    ) {

        presetSelect.value =
            "custom";


        catapultTypeLabel.textContent =
            "CUSTOM";

    }

}


/* =========================================
   EVENTS
========================================= */

presetSelect.addEventListener(
    "change",
    function () {

        applyPreset(
            presetSelect.value
        );

    }
);


document
    .getElementById(
        "calculate-button"
    )
    .addEventListener(
        "click",
        function () {

            try {

                calculate();

            }
            catch (error) {

                showError(error);

            }

        }
    );


/* =========================================
   LIVE INPUTS
========================================= */

[
    shipSpeedInput,
    headwindInput,
    wingBlocksInput

].forEach(
    function (input) {

        input.addEventListener(
            "input",
            updateLiveDisplay
        );

    }
);


/*
 * ユーザーがプリセット値を変更したら
 * カスタムへ切り替える。
 */

[
    catapultLengthInput,
    catapultForceInput,
    efficiencyInput,
    safetyFactorInput,
    shipSpeedInput,
    headwindInput,
    airDensityInput,
    wingBlocksInput,
    liftCoefficientInput,
    aircraftMassInput

].forEach(
    function (input) {

        input.addEventListener(
            "change",
            setCustomPreset
        );

    }
);


/* =========================================
   INITIALIZE
========================================= */

function initialize() {

    applyPreset(
        "large-emals"
    );


    try {

        calculate();

    }
    catch (error) {

        showError(error);

    }


    console.log(
        "MFDCO Carrier Launch Calculator loaded."
    );

}


initialize();