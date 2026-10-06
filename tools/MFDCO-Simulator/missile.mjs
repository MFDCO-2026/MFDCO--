// Mach input uses an explicit, fixed reference sound speed: 343 m/s.
export const SPEED_FACTORS={'km/h':1,'km/s':3600,'Mach':1234.8,'knot':1.852};
export function speedToKmh(value,unit){const speed=value*SPEED_FACTORS[unit];if(!Number.isFinite(speed)||speed<.1||speed>20000)throw new Error('速度は換算後0.1〜20000 km/hで指定してください。');return Math.round(speed*1e9)/1e9;}
export function speedFromKmh(value,unit){return value/SPEED_FACTORS[unit];}
export function flightStep(p,s,target,speed){const dx=(target.x-s.x)*p.widthKm/1000,dy=(target.y-s.y)*p.heightKm/1000,d=Math.hypot(dx,dy),q=d<=speed/3600+1e-9?1:speed/3600/d;return{x:s.x+(target.x-s.x)*q,y:s.y+(target.y-s.y)*q,arrived:q===1};}
