"use strict";
document.addEventListener("DOMContentLoaded",async()=>{const f=document.getElementById("footer-container");if(f&&!f.children.length){try{const r=await fetch("footer.html",{cache:"no-cache"});if(r.ok)f.innerHTML=await r.text();}catch(e){console.warn("FOOTER:",e)}}});
