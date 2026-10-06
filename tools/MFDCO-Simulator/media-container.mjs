// Minimal single-track VP8 WebM and stored ZIP writers. No external dependencies.
export const MAX_EXPORT_BYTES=128*1024*1024;
const text=s=>new TextEncoder().encode(s);
function join(parts){const a=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let offset=0;for(const p of parts){a.set(p,offset);offset+=p.length;}return a;}
function idBytes(id){const a=[];do{a.unshift(id%256);id=Math.floor(id/256);}while(id);return new Uint8Array(a);}
function sizeBytes(size){if(!Number.isSafeInteger(size)||size<0)throw new Error('Invalid EBML size');for(let length=1;length<=8;length++){if(size<2**(7*length)-1){let n=BigInt(size)|(1n<<BigInt(7*length)),a=new Uint8Array(length);for(let i=length-1;i>=0;i--){a[i]=Number(n&255n);n>>=8n;}return a;}}throw new Error('EBML element too large');}
function el(id,data){return join([idBytes(id),sizeBytes(data.length),data]);}
function uint(n){if(!Number.isSafeInteger(n)||n<0)throw new Error('Invalid unsigned integer');return idBytes(n);}
function u(id,n){return el(id,uint(n));}
function f64(n){const a=new Uint8Array(8);new DataView(a.buffer).setFloat64(0,n);return a;}
export function muxWebM(chunks,{width,height,fps}){
 if(!Number.isInteger(width)||!Number.isInteger(height)||width<2||height<2||width>4096||height>4096||!Number.isFinite(fps)||fps<1||fps>60||!chunks.length)throw new Error('Invalid WebM configuration');
 const frames=[...chunks].sort((a,b)=>a.timestamp-b.timestamp);if(frames[0].timestamp!==0||!frames[0].key)throw new Error('Video must start with a keyframe at timestamp 0');
 let total=0;frames.forEach((c,i)=>{if(!(c.data instanceof Uint8Array)||!c.data.length||!Number.isSafeInteger(c.timestamp)||c.timestamp<0||i&&c.timestamp<=frames[i-1].timestamp)throw new Error('Invalid encoded frame');if(c.timestamp!==Math.round(i*1e6/fps))throw new Error('動画のフレーム時刻が一致しません。');total+=c.data.length;});if(total>MAX_EXPORT_BYTES)throw new Error('出力が128MBを超えました。範囲か解像度を下げてください。');
 const header=el(0x1a45dfa3,join([u(0x4286,1),u(0x42f7,1),u(0x42f2,4),u(0x42f3,8),el(0x4282,text('webm')),u(0x4287,4),u(0x4285,2)]));
 const durationMs=frames.length/fps*1000;
 const info=el(0x1549a966,join([u(0x2ad7b1,1000000),el(0x4489,f64(durationMs)),el(0x4d80,text('MFDCO')),el(0x5741,text('MFDCO video export 0.4'))]));
 const tracks=el(0x1654ae6b,el(0xae,join([u(0xd7,1),u(0x73c5,1),u(0x83,1),u(0x9c,0),el(0x86,text('V_VP8')),u(0x23e383,Math.round(1e9/fps)),el(0xe0,join([u(0xb0,width),u(0xba,height)]))])));
 const clusters=[],cues=[];let blocks=[],clusterTime=0,offset=info.length+tracks.length;
 const flush=()=>{if(!blocks.length)return;let cluster=el(0x1f43b675,join([u(0xe7,clusterTime),...blocks]));clusters.push(cluster);offset+=cluster.length;blocks=[];};
 for(const c of frames){const ms=Math.round(c.timestamp/1000);if(blocks.length&&(c.key||ms-clusterTime>30000))flush();if(!blocks.length){clusterTime=ms;if(c.key)cues.push({time:ms,offset});}const relative=ms-clusterTime;const blockHeader=new Uint8Array([0x81,(relative>>8)&255,relative&255,c.key?0x80:0]);blocks.push(el(0xa3,join([blockHeader,c.data])));}flush();
 const cueData=el(0x1c53bb6b,join(cues.map(c=>el(0xbb,join([u(0xb3,c.time),el(0xb7,join([u(0xf7,1),u(0xf1,c.offset)]))])))));
 const payload=[info,tracks,...clusters,cueData],segmentLength=payload.reduce((n,a)=>n+a.length,0);
 return new Blob([header,idBytes(0x18538067),sizeBytes(segmentLength),...payload],{type:'video/webm'});
}
const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let j=0;j<8;j++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
export function crc32(data){let c=0xffffffff;for(let b of data)c=crcTable[(c^b)&255]^(c>>>8);return(c^0xffffffff)>>>0;}
export function zipStored(entries){
 if(entries.length>65535)throw new Error('Too many ZIP entries');let offset=0;const files=[],directories=[],names=new Set();
 for(const e of entries){if(typeof e.name!=='string'||e.name.startsWith('/')||e.name.split('/').includes('..')||names.has(e.name)||!(e.data instanceof Uint8Array))throw new Error('Invalid ZIP entry');names.add(e.name);let name=text(e.name),size=e.data.length,crc=crc32(e.data);if(name.length>65535)throw new Error('ZIP name too long');let local=new Uint8Array(30+name.length),v=new DataView(local.buffer);v.setUint32(0,0x04034b50,true);v.setUint16(4,20,true);v.setUint16(6,0x800,true);v.setUint16(12,33,true);v.setUint32(14,crc,true);v.setUint32(18,size,true);v.setUint32(22,size,true);v.setUint16(26,name.length,true);local.set(name,30);
 let dir=new Uint8Array(46+name.length),d=new DataView(dir.buffer);d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint16(14,33,true);d.setUint32(16,crc,true);d.setUint32(20,size,true);d.setUint32(24,size,true);d.setUint16(28,name.length,true);d.setUint32(42,offset,true);dir.set(name,46);files.push(local,e.data);directories.push(dir);offset+=local.length+size;if(offset>MAX_EXPORT_BYTES)throw new Error('PNG連番が128MBを超えました。範囲か解像度を下げてください。');}
 const dirSize=directories.reduce((n,a)=>n+a.length,0),end=new Uint8Array(22),v=new DataView(end.buffer);v.setUint32(0,0x06054b50,true);v.setUint16(8,entries.length,true);v.setUint16(10,entries.length,true);v.setUint32(12,dirSize,true);v.setUint32(16,offset,true);return new Blob([...files,...directories,end],{type:'application/zip'});
}
