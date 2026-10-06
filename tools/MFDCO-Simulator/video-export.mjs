import {muxWebM,zipStored,MAX_EXPORT_BYTES} from './media-container.mjs';
export function exportPlan({start,end,fps,height,aspect,format},duration){
 if(!Number.isInteger(start)||!Number.isInteger(end)||start<0||end<start||end>duration||end>10000||end-start>1440)throw new Error('開始・終了は0〜10000frame、1回の出力は1441枚以内にしてください。');
 if(![1,5,10,15,24,30,60].includes(fps)||![360,720,1080].includes(height)||!['wide','square'].includes(aspect)||!['webm','png'].includes(format))throw new Error('出力設定が不正です。');
 const count=end-start+1,width=aspect==='square'?height:Math.round(height*16/9);return{start,end,fps,width,height,aspect,format,count,duration:count/fps};
}
export function frameTime(index,fps){return {timestamp:Math.round(index*1e6/fps),duration:Math.round((index+1)*1e6/fps)-Math.round(index*1e6/fps)};}
export function abortIfNeeded(signal){if(signal?.aborted)throw new DOMException('出力を中止しました。','AbortError');}
export async function vp8Config(plan){
 if(typeof VideoEncoder==='undefined'||typeof VideoFrame==='undefined')throw new Error('この環境は動画書き出しに対応していません。PNG連番を選択してください。');
 const config={codec:'vp8',width:plan.width,height:plan.height,framerate:plan.fps,bitrate:plan.height>=1080?8000000:plan.height>=720?4000000:1500000,latencyMode:'quality'};
 const support=await VideoEncoder.isConfigSupported(config);if(!support.supported)throw new Error('この解像度のWebM書き出しに対応していません。解像度を下げるかPNG連番を選択してください。');return support.config;
}
export function paintSvg(canvas,svg,signal,{transparent=false}={}){return new Promise((resolve,reject)=>{
 abortIfNeeded(signal);const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),image=new Image();let settled=false;
 const cleanup=()=>{URL.revokeObjectURL(url);signal?.removeEventListener('abort',cancel);image.onload=null;image.onerror=null;};const fail=e=>{if(settled)return;settled=true;cleanup();reject(e);};const cancel=()=>{image.src='';fail(new DOMException('出力を中止しました。','AbortError'));};
 image.onload=()=>{if(settled)return;try{abortIfNeeded(signal);const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)throw new Error('描画領域を作成できませんでした。');ctx.clearRect(0,0,canvas.width,canvas.height);if(!transparent){ctx.fillStyle='#122421';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.drawImage(image,0,0,canvas.width,canvas.height);settled=true;cleanup();resolve();}catch(e){fail(e);}};image.onerror=()=>fail(new Error('フレーム画像を描画できません。背景画像を確認してください。'));signal?.addEventListener('abort',cancel,{once:true});image.src=url;
});}
const pngBlob=canvas=>new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('PNGの生成に失敗しました。')),'image/png'));
export async function exportFrames({plan,canvas,render,signal,onProgress,metadata={}}){
 const simulationSecondsPerFrame=metadata.simulationSecondsPerFrame??60;if(!Number.isInteger(simulationSecondsPerFrame)||simulationSecondsPerFrame<1||simulationSecondsPerFrame>600)throw Error('映像の作中時間設定が不正です。');abortIfNeeded(signal);let encoder=null,fatal=null,total=0,chunks=[],entries=[],decoded=0;
 const cancel=()=>{if(encoder&&encoder.state!=='closed')encoder.close();};signal?.addEventListener('abort',cancel,{once:true});
 try{
  if(plan.format==='webm'){const config=await vp8Config(plan);abortIfNeeded(signal);encoder=new VideoEncoder({output(chunk){if(fatal||signal?.aborted)return;total+=chunk.byteLength;if(total>MAX_EXPORT_BYTES){fatal=new Error('動画が128MBを超えました。範囲か解像度を下げてください。');return;}const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);chunks.push({data,timestamp:chunk.timestamp,key:chunk.type==='key'});decoded++;},error(error){fatal=error;}});encoder.configure(config);}
  for(let i=0;i<plan.count;i++){
   abortIfNeeded(signal);if(fatal)throw fatal;await render(plan.start+i,canvas,signal);abortIfNeeded(signal);
   if(encoder){const vf=new VideoFrame(canvas,frameTime(i,plan.fps));try{encoder.encode(vf,{keyFrame:i%(plan.fps*2)===0});}finally{vf.close();}if(encoder.encodeQueueSize>=8){await encoder.flush();abortIfNeeded(signal);}}
   else{const blob=await pngBlob(canvas);total+=blob.size;if(total>MAX_EXPORT_BYTES)throw new Error('PNG連番が128MBを超えました。範囲か解像度を下げてください。');entries.push({name:'frames/frame_'+String(plan.start+i).padStart(6,'0')+'.png',data:new Uint8Array(await blob.arrayBuffer())});}
   onProgress?.(i+1,plan.count);
   if(i%5===0)await new Promise(r=>setTimeout(r,0));
  }
  if(encoder){await encoder.flush();abortIfNeeded(signal);if(fatal)throw fatal;if(decoded!==plan.count)throw new Error('フレーム数が一致しません。動画は保存されませんでした。');return muxWebM(chunks,plan);}
  entries.push({name:'settings.json',data:new TextEncoder().encode(JSON.stringify({...metadata,...plan,simulationSecondsPerFrame},null,2))});
  entries.push({name:'README.txt',data:new TextEncoder().encode('MFDCO PNG連番\nframesフォルダーの画像を番号順に読み込んでください。\n出力fps: '+plan.fps+'\n1枚 = 作中時間'+simulationSecondsPerFrame+'秒。開始・終了frameを両方含みます。\n画像は選択した画面・表示レイヤー・カメラ位置を使用します。\n')});abortIfNeeded(signal);return zipStored(entries);
 }finally{signal?.removeEventListener('abort',cancel);if(encoder&&encoder.state!=='closed')encoder.close();}
}
