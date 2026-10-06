// Session-local drafts: never mix values between different project sessions.
export class FormDrafts {
 constructor(){this.cache=new Map();}
 clear(){this.cache.clear();}
 discard(key){this.cache.delete(key);}
 mount(root,key){
  const fields=[...root.querySelectorAll('input,textarea,select')].filter(e=>!['file','hidden','button','submit','range'].includes(e.type));
  const values=this.cache.get(key)||new Map(),read=e=>e.type==='checkbox'?e.checked:e.multiple?[...e.selectedOptions].map(o=>o.value):e.value;
  fields.forEach((e,i)=>{const attr=[...e.attributes].find(a=>a.name.startsWith('data-')),id=e.id||e.name||(attr?attr.name+':'+attr.value:'field-'+i),baseline=JSON.stringify(read(e));
   if(values.has(id)){const v=values.get(id);if(JSON.stringify(v)===baseline)values.delete(id);else if(e.type==='checkbox')e.checked=v;else if(e.multiple){for(const o of e.options)o.selected=v.includes(o.value);}else if(e.tagName!=='SELECT'||[...e.options].some(o=>o.value===v))e.value=v;}
   const changed=()=>{const value=read(e);if(JSON.stringify(value)===baseline)values.delete(id);else values.set(id,value);if(values.size)this.cache.set(key,values);else this.cache.delete(key);while(this.cache.size>40)this.cache.delete(this.cache.keys().next().value);};
   e.addEventListener('input',changed);e.addEventListener('change',changed);
  });
  if(!values.size)this.cache.delete(key);
 }
}
