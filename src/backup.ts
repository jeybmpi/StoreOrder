import {supabase} from './supabase'
import {uploadBlob} from './utils'

async function all(t:string){const out:any[]=[]
 for(let i=0;;i+=1000){const {data,error}=await supabase.from(t).select('*').range(i,i+999);if(error)throw error;out.push(...data);if(data.length<1000)break}
 return out}
const toDataUrl=(b:Blob)=>new Promise<string>((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result as string);r.onerror=rej;r.readAsDataURL(b)})

/** Descarga un .json con TODOS los datos (y opcionalmente las fotos incrustadas) */
export async function exportAll(withImages:boolean){
 const [brands,payment_methods,products,units]=await Promise.all(['brands','payment_methods','products','units'].map(all))
 const images:Record<string,string>={}
 if(withImages)for(const p of products){if(!p.image_url)continue
  try{images[p.id]=await toDataUrl(await (await fetch(p.image_url)).blob())}catch{}}
 const json=JSON.stringify({app:'tienda',version:1,exported_at:new Date().toISOString(),brands,payment_methods,products,units,images})
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([json],{type:'application/json'}))
 a.download=`tienda-respaldo-${new Date().toISOString().slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),10000)
 localStorage.setItem('ultimo_respaldo',new Date().toISOString())
 return{products:products.length,units:units.length,images:Object.keys(images).length}}

const pick=(o:any,k:string[])=>Object.fromEntries(k.filter(x=>x in o).map(x=>[x,o[x]]))
async function up(t:string,rows:any[],conflict:string){
 for(let i=0;i<rows.length;i+=200){const {error}=await supabase.from(t).upsert(rows.slice(i,i+200),{onConflict:conflict});if(error)throw new Error(`${t}: ${error.message}`)}}

/** Carga un respaldo en el proyecto actual (se puede repetir sin duplicar: usa los mismos ids) */
export async function importAll(file:File,progress:(s:string)=>void=()=>{}){
 const d=JSON.parse(await file.text());if(d.app!=='tienda')throw new Error('Este archivo no es un respaldo de la tienda')
 progress('Cargando marcas y métodos de pago…')
 await up('brands',d.brands.map((b:any)=>pick(b,['id','name','color'])),'id')
 await up('payment_methods',d.payment_methods.map((m:any)=>pick(m,['id','name'])),'name')
 const products=[];let n=0
 for(const p of d.products){const row:any=pick(p,['id','name','image_url','suggested_price','real_price','payment_method','color','brand_id','position','created_at'])
  const img=d.images?.[p.id];if(img){progress(`Subiendo fotos… ${++n}`);try{row.image_url=await uploadBlob(await (await fetch(img)).blob())}catch{}}
  products.push(row)}
 progress('Cargando productos y unidades…')
 await up('products',products,'id')
 await up('units',d.units.map((u:any)=>pick(u,['id','product_id','sold','sold_at','real_price','payment_method'])),'id')
 return{products:products.length,units:d.units.length}}
