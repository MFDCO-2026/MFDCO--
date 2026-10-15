import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const SUPABASE_URL=Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const VAPID_PUBLIC_KEY=Deno.env.get("MFDCO_VAPID_PUBLIC_KEY")||"";
const VAPID_PRIVATE_KEY=Deno.env.get("MFDCO_VAPID_PRIVATE_KEY")||"";
const VAPID_SUBJECT=Deno.env.get("MFDCO_VAPID_SUBJECT")||"mailto:admin@example.com";
const RESEND_API_KEY=Deno.env.get("RESEND_API_KEY")||"";
const FROM_EMAIL=Deno.env.get("MFDCO_FROM_EMAIL")||"MFDCO <noreply@example.com>";
const SITE_URL=Deno.env.get("MFDCO_SITE_URL")||"https://mfdco.net";
const sb=createClient(SUPABASE_URL,SERVICE_ROLE,{auth:{persistSession:false}});
if(VAPID_PUBLIC_KEY&&VAPID_PRIVATE_KEY)webpush.setVapidDetails(VAPID_SUBJECT,VAPID_PUBLIC_KEY,VAPID_PRIVATE_KEY);
function inQuiet(p:any){if(!p?.quiet_enabled)return false;const zone=p?.timezone||"UTC";let h=0,m=0;try{const parts=new Intl.DateTimeFormat("en-GB",{timeZone:zone,hour:"2-digit",minute:"2-digit",hour12:false}).formatToParts(new Date());h=Number(parts.find(x=>x.type==="hour")?.value||0);m=Number(parts.find(x=>x.type==="minute")?.value||0)}catch{const now=new Date();h=now.getUTCHours();m=now.getUTCMinutes()}const mins=h*60+m;const parse=(s:string)=>{const [hh,mm]=(s||"00:00").split(":").map(Number);return hh*60+mm};const a=parse(p.quiet_start),b=parse(p.quiet_end);return a<=b?(mins>=a&&mins<b):(mins>=a||mins<b)}
Deno.serve(async()=>{
 const {data:jobs,error}=await sb.from("country_notification_delivery_queue").select("*,country_notifications(*)").lte("next_attempt_at",new Date().toISOString()).or("push_status.eq.pending,email_status.eq.pending").limit(25);if(error)return new Response(error.message,{status:500});
 let processed=0;
 for(const job of jobs||[]){const n=job.country_notifications;if(!n)continue;const {data:setrow}=await sb.from("country_account_settings").select("notification_preferences").eq("user_id",job.user_id).maybeSingle();const prefs=setrow?.notification_preferences||{};if(inQuiet(prefs)){await sb.from("country_notification_delivery_queue").update({next_attempt_at:new Date(Date.now()+30*60*1000).toISOString()}).eq("id",job.id);continue}
  let pushStatus=job.push_status,emailStatus=job.email_status,lastError="";
  if(pushStatus==="pending"&&VAPID_PUBLIC_KEY&&VAPID_PRIVATE_KEY){try{const {data:subs}=await sb.from("country_push_subscriptions").select("endpoint,p256dh,auth_key").eq("user_id",job.user_id).eq("enabled",true);for(const s of subs||[])await webpush.sendNotification({endpoint:s.endpoint,keys:{p256dh:s.p256dh,auth:s.auth_key}},JSON.stringify({notification_id:n.id,title:n.title,body:n.body,url:n.action_url||n.link||"/country-notifications.html",tag:`mfdco-${n.id}`}));pushStatus="sent";await sb.from("country_notifications").update({pushed_at:new Date().toISOString()}).eq("id",n.id)}catch(e){pushStatus="failed";lastError=String(e)}}
  if(emailStatus==="pending"&&RESEND_API_KEY){try{const {data:u}=await sb.auth.admin.getUserById(job.user_id);const email=u?.user?.email;if(email){const r=await fetch("https://api.resend.com/emails",{method:"POST",headers:{Authorization:`Bearer ${RESEND_API_KEY}`,"Content-Type":"application/json"},body:JSON.stringify({from:FROM_EMAIL,to:[email],subject:`MFDCO: ${n.title}`,html:`<h2>${n.title}</h2><p>${n.body||""}</p>${n.action_url||n.link?`<p><a href="${new URL(n.action_url||n.link,SITE_URL).href}">確認する</a></p>`:""}`})});if(!r.ok)throw new Error(await r.text());emailStatus="sent";await sb.from("country_notifications").update({emailed_at:new Date().toISOString()}).eq("id",n.id)}else emailStatus="skipped"}catch(e){emailStatus="failed";lastError=String(e)}}
  await sb.from("country_notification_delivery_queue").update({push_status:pushStatus,email_status:emailStatus,attempts:(job.attempts||0)+1,last_error:lastError,updated_at:new Date().toISOString(),next_attempt_at:new Date(Date.now()+15*60*1000).toISOString()}).eq("id",job.id);processed++;
 }
 return Response.json({ok:true,processed});
});