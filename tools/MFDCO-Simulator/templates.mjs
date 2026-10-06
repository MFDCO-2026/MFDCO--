import {copy,validate} from './engine.mjs';
export const TEMPLATE_KEY='mfdco-templates-v1',TEMPLATE_LIMIT=12;
export function templateRecord(project,name,note='',mode='map'){
 if(typeof name!=='string'||!name.trim()||name.length>80||typeof note!=='string'||note.length>300||!['map','radar'].includes(mode))throw new Error('名前は1〜80文字、メモは300文字以内で入力してください。');
 return {format:'mfdco-template',templateVersion:1,name:name.trim(),note,mode,project:validate(project)};
}
export function readTemplate(raw){
 if(raw?.format==='mfdco-sim')return templateRecord(raw,raw.title.slice(0,80));
 if(raw?.format!=='mfdco-template'||raw.templateVersion!==1)throw new Error('対応していないテンプレート形式です。');
 return templateRecord(raw.project,raw.name,raw.note,raw.mode);
}
export function readTemplates(storage){const raw=storage.getItem(TEMPLATE_KEY);if(!raw)return[];const list=JSON.parse(raw);if(!Array.isArray(list)||list.length>TEMPLATE_LIMIT)throw new Error('テンプレート一覧が不正です。');const ids=new Set();return list.map(t=>{if(typeof t.id!=='string'||!/^t\d+$/.test(t.id)||ids.has(t.id))throw new Error('テンプレートIDが不正です。');ids.add(t.id);return{id:t.id,...readTemplate(t)};});}
export function writeTemplates(storage,list){if(list.length>TEMPLATE_LIMIT)throw new Error('自作テンプレートは12件までです。');const data=JSON.stringify(list.map(t=>({id:t.id,...readTemplate(t)})));try{storage.setItem(TEMPLATE_KEY,data);}catch{throw new Error('端末の保存容量が不足しています。テンプレートを書き出してから不要なものを削除してください。');}}
export function appendTemplate(list,record){if(list.length>=TEMPLATE_LIMIT)throw new Error('自作テンプレートは12件までです。');let n=1;while(list.some(t=>t.id==='t'+n))n++;return [...copy(list),{id:'t'+n,...readTemplate(record)}];}
