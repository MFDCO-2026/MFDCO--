import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@4";

Deno.serve(async(req)=>{
 try{
  const token=req.headers.get("Authorization")||"";
  const supabaseUrl=Deno.env.get("SUPABASE_URL")!;
  const anon=Deno.env.get("SUPABASE_ANON_KEY")!;
  const service=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const caller=createClient(supabaseUrl,anon,{global:{headers:{Authorization:token}}});
  const admin=createClient(supabaseUrl,service);
  const body=await req.json();
  const requestId=body.request_id;
  const requestType=body.request_type||"country_media";
  const {data:me}=await caller.auth.getUser();
  if(!me.user)return new Response("Unauthorized",{status:401});

  let contract:any=null;
  if(requestType==="country_media"){
   const {data:r,error}=await admin.from("country_media_requests")
    .select("*,country_media(original_name,slot,download_terms_override),countries!country_media_requests_country_id_fkey(name,owner_id)")
    .eq("id",requestId).single();
   if(error||!r||r.status!=="approved")return new Response("Invalid request",{status:400});
   const {data:role}=await caller.rpc("mfdco_country_role",{p_country_id:r.country_id});
   if(!["owner","admin"].includes(role||""))return new Response("Forbidden",{status:403});
   contract={...r,countryName:r.countries.name,ownerId:r.countries.owner_id,assetName:r.country_media?.original_name||r.country_media?.slot||"国家素材",terms:r.contract_snapshot?.terms||""};
  }else{
   // v12 legacy compatibility
   const {data:r,error}=await admin.from("country_asset_requests")
    .select("*,country_assets(title,terms),countries!country_asset_requests_country_id_fkey(name,owner_id)")
    .eq("id",requestId).single();
   if(error||!r||r.status!=="approved")return new Response("Invalid request",{status:400});
   const {data:role}=await caller.rpc("mfdco_country_role",{p_country_id:r.country_id});
   if(!["owner","admin"].includes(role||""))return new Response("Forbidden",{status:403});
   contract={...r,countryName:r.countries.name,ownerId:r.countries.owner_id,assetName:r.country_assets?.title||"国家素材",terms:r.country_assets?.terms||""};
  }

  const requester=(await admin.auth.admin.getUserById(contract.requester_id)).data.user;
  const owner=(await admin.auth.admin.getUserById(contract.ownerId)).data.user;
  const emails=[requester?.email,owner?.email].filter(Boolean) as string[];
  if(!emails.length)return new Response("No recipient",{status:400});

  const resend=new Resend(Deno.env.get("RESEND_API_KEY")!);
  const from=Deno.env.get("MFDCO_MAIL_FROM")||"MFDCO <no-reply@example.com>";
  const expires=contract.expires_at?new Date(contract.expires_at).toLocaleDateString("ja-JP"):"期限なし";
  const text=`MFDCO 国家素材 利用許可契約\n\n国家: ${contract.countryName}\n素材: ${contract.assetName}\n申請者: ${contract.requester_name}\n利用目的: ${contract.purpose}\n利用内容: ${contract.details||""}\n許可期限: ${expires}\n備考: ${contract.decision_note||"なし"}\n\n利用規約:\n${contract.terms||"特記事項なし"}\n\n申請ID: ${contract.id}`;
  const send=await resend.emails.send({from,to:emails,subject:`[MFDCO] ${contract.countryName} 素材利用許可`,text});
  return Response.json({ok:true,id:send.data?.id||null});
 }catch(e){return Response.json({error:String(e)},{status:500})}
});
