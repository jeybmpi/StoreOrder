import {supabase} from './supabase'
import {Product} from './types'
/** Acepta "1.500,50", "1,500.50", "1500,5", "1.500" (miles) */
export function parsePrice(s:string):number{
 let t=s.replace(/[^\d.,]/g,'');if(!t)return 0
 const d=t.lastIndexOf('.'),c=t.lastIndexOf(','),last=Math.max(d,c)
 if(last<0)return Number(t)
 const dec=t.slice(last+1),sep=t[last],count=t.split(sep).length-1
 const other=sep==='.'?',':'.'
 const isDecimal=t.includes(other)||(count===1&&dec.length!==3)
 if(isDecimal)return Number(t.slice(0,last).replace(/[.,]/g,'')+'.'+dec)
 return Number(t.replace(/[.,]/g,''))
}
export const fmt=(n:number|null)=>n===null?'—':'$'+n.toLocaleString('es-CO',{maximumFractionDigits:2})
export const fmtDate=(s:string)=>new Date(s).toLocaleString('es-CO',{dateStyle:'medium',timeStyle:'short'})
const MAX=480
/** Reduce a 480px y WebP calidad 60 (o JPEG si el navegador no soporta WebP) */
export async function compress(f:Blob):Promise<Blob>{
 try{const b=await createImageBitmap(f);const k=Math.min(1,MAX/Math.max(b.width,b.height))
  const c=document.createElement('canvas');c.width=Math.round(b.width*k);c.height=Math.round(b.height*k)
  c.getContext('2d')!.drawImage(b,0,0,c.width,c.height)
  const to=(t:string,q:number)=>new Promise<Blob|null>(r=>c.toBlob(r,t,q))
  let o=await to('image/webp',0.6);if(!o||o.type!=='image/webp')o=await to('image/jpeg',0.6)
  return o&&o.size<f.size?o:f}catch{return f}}
export async function uploadBlob(b:Blob){
 const ext=b.type==='image/webp'?'webp':b.type==='image/jpeg'?'jpg':'img'
 const path=`${Date.now()}-${Math.random().toString(36).slice(2,7)}.${ext}`
 const {error}=await supabase.storage.from('products').upload(path,b,{contentType:b.type||undefined,cacheControl:'31536000'});if(error)throw error
 return supabase.storage.from('products').getPublicUrl(path).data.publicUrl}
export const uploadImage=async(f:File)=>uploadBlob(await compress(f))
export function removeImage(url:string){const i=url.indexOf('/products/');if(i<0)return
 supabase.storage.from('products').remove([decodeURIComponent(url.slice(i+10).split('?')[0])]).then(r=>{if(r.error)console.warn(r.error.message)})}
const norm=(s:string)=>s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'')
function lev(a:string,b:string){const m:number[][]=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j
 for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length]}
/** Búsqueda tolerante a faltas de ortografía, filtra mientras escribes */
export function matches(p:Product,brand:string,q:string){
 const toks=norm(q).split(/\s+/).filter(Boolean);if(!toks.length)return true
 const words=norm(p.name+' '+brand).split(/\s+/)
 return toks.every(t=>{const tol=t.length<4?0:t.length<7?1:2
  return words.some(w=>w.includes(t)||lev(t,w.slice(0,t.length))<=tol||lev(t,w)<=tol)})
}
