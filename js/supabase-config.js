/* =========================================
   MFDCO SUPABASE CONFIG
   ========================================= */

"use strict";

(function () {

    /* =========================================
       SUPABASE SETTINGS
    ========================================= */

    const SUPABASE_URL =
        "https://ywpozmfccqzkdddmhobk.supabase.co";

    const SUPABASE_PUBLISHABLE_KEY =
        "sb_publishable_jV-Pu8Tx7u103_DZNnDfOw_jYfm4oiO";


    /* =========================================
       SDK CHECK
    ========================================= */

    if (
        typeof window.supabase ===
        "undefined"
    ) {

        console.error(
            "MFDCO SUPABASE ERROR: " +
            "Supabase JavaScript SDK が読み込まれていません。"
        );

        return;

    }


    /* =========================================
       EXISTING CLIENT CHECK
    ========================================= */

    if (
        window.supabaseClient
    ) {

        console.log(
            "MFDCO SUPABASE: " +
            "既存のSupabase clientを使用します。"
        );

        return;

    }


    /* =========================================
       CREATE CLIENT
    ========================================= */

    try {

        window.supabaseClient =
            window.supabase.createClient(
                SUPABASE_URL,
                SUPABASE_PUBLISHABLE_KEY
            );


        console.log(
            "MFDCO SUPABASE: " +
            "Supabase client initialized successfully."
        );


    } catch (error) {

        console.error(
            "MFDCO SUPABASE ERROR: " +
            "Supabase clientの初期化に失敗しました。",
            error
        );

    }

})();