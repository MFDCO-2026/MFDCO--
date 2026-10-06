import {rgbaPNG} from './png-raster.mjs';
// Full-resolution raster cache: browser canvas and worker-safe PNG fallback.
const cache=new WeakMap();
export function invalidateMapRaster(p){cache.delete(p.terrain);cache.delete(p.elevation);}
export function rasterMap(p,colors,{elevation=false,shade=true,contours=true,radar=false}={}){
 if(p.terrain.length<=4096)return null;const key=elevation?p.elevation:p.terrain,variant=elevation?`${shade}/${contours}/${p.contourInterval??100}/${!!p.showBathymetry}`:radar?'radar':'terrain';let entries=cache.get(key);if(entries?.has(variant))return entries.get(variant);
 const width=p.terrainCols,height=p.terrainRows,canvas=typeof document!=='undefined'?document.createElement('canvas'):null;let ctx=null;if(canvas){canvas.width=width;canvas.height=height;try{ctx=canvas.getContext('2d');}catch{}}
 const img=ctx?ctx.createImageData(width,height):{data:new Uint8ClampedArray(width*height*4)},d=img.data,palette=Object.fromEntries(Object.entries(colors).map(([k,v])=>[k,v.color.match(/[a-f\d]{2}/gi).map(x=>parseInt(x,16))]));
 for(let i=0;i<p.terrain.length;i++){let rgb=palette[p.terrain[i]]||[0,0,0],a=217;
  if(radar){const t=p.terrain[i],adj=[];if(i%width+1<width)adj.push(p.terrain[i+1]);if(i+width<p.terrain.length)adj.push(p.terrain[i+width]);const diff=adj.filter(x=>x!==t),coast=diff.length&&(t==='water'||diff.includes('water'));rgb=coast?[128,179,148]:[87,131,105];a=diff.length?(coast?153:71):0;}
  else if(elevation){const band=Math.floor((p.elevation[i]||0)/200);a=shade?Math.round(Math.min(.45,Math.abs(band)*.025)*255):0;rgb=band>0?[238,229,198]:[7,35,48];if(contours){const b=Math.floor(p.elevation[i]/(p.contourInterval??100)),x=i%width;if((x+1<width&&b!==Math.floor(p.elevation[i+1]/(p.contourInterval??100)))||(i+width<p.elevation.length&&b!==Math.floor(p.elevation[i+width]/(p.contourInterval??100)))){rgb=[198,183,140];a=110;}}}
  if(elevation&&p.terrain[i]==='water'&&!p.showBathymetry)a=0;d[i*4]=rgb[0];d[i*4+1]=rgb[1];d[i*4+2]=rgb[2];d[i*4+3]=a;
 }
 let url;if(ctx){ctx.putImageData(img,0,0);url=canvas.toDataURL('image/png');}else url=rgbaPNG(width,height,d);
 const svg=`<image data-map-raster="${variant}" href="${url}" width="1000" height="625" preserveAspectRatio="none" style="image-rendering:pixelated"/>`;entries??=new Map();entries.set(variant,svg);cache.set(key,entries);return svg;
}
