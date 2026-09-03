/* =========================================
   MFDCO SUPABASE CLIENT
========================================= */

"use strict";

const SUPABASE_URL =
    "https://ywpozmfccqzkdddmhobk.supabase.co";

const SUPABASE_ANON_KEY =
    "sb_publishable_jV-Pu8Tx7u103_DZNnDfOw_jYfm4oiO";

window.supabaseClient =
    window.supabase.createClient(
        SUPABASE_URL,
        SUPABASE_ANON_KEY
    );

console.log(
    "Supabase client initialized successfully."
);