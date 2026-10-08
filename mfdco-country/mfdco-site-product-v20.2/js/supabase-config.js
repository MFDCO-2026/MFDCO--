"use strict";
/* MFDCO 本体で既に window.supabaseClient がある場合は何もしません。
   単体テスト時は localStorage モードで動作します。
   本番で別初期化する場合は、先に window.MFDCO_SUPABASE_URL / ANON_KEY を設定してください。 */
(function(){
  if(window.supabaseClient) return;
  const u=window.MFDCO_SUPABASE_URL||"";
  const k=window.MFDCO_SUPABASE_ANON_KEY||"";
  if(u&&k&&window.supabase?.createClient) window.supabaseClient=window.supabase.createClient(u,k);
})();
