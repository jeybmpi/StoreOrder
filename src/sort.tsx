import {useState} from 'react'
import {Product} from './types'
export type SortKey='manual'|'az'|'za'|'brand'|'price_asc'|'price_desc'|'newest'|'modified'
export const SORTS:[SortKey,string][]=[['manual','Orden manual'],['az','Nombre A → Z'],['za','Nombre Z → A'],['brand','Marca'],['price_asc','Precio: menor a mayor'],['price_desc','Precio: mayor a menor'],['newest','Último agregado'],['modified','Última modificación']]
const col=new Intl.Collator('es',{sensitivity:'base',numeric:true})
const t=(s?:string)=>s?Date.parse(s)||0:0
export function sortProducts(a:Product[],k:SortKey,brandName:(id:string|null)=>string):Product[]{
 if(k==='manual')return a
 const byName=(x:Product,y:Product)=>col.compare(x.name,y.name)
 const cmp:Record<Exclude<SortKey,'manual'>,(x:Product,y:Product)=>number>={
  az:byName,
  za:(x,y)=>byName(y,x),
  brand:(x,y)=>{const bx=brandName(x.brand_id),by=brandName(y.brand_id);if(!bx!==!by)return bx?-1:1;return col.compare(bx,by)||byName(x,y)},
  price_asc:(x,y)=>x.suggested_price-y.suggested_price||byName(x,y),
  price_desc:(x,y)=>y.suggested_price-x.suggested_price||byName(x,y),
  newest:(x,y)=>t(y.created_at)-t(x.created_at)||byName(x,y),
  modified:(x,y)=>t(y.updated_at||y.created_at)-t(x.updated_at||x.created_at)||byName(x,y)}
 return [...a].sort(cmp[k])}
export function useSort(key:string):[SortKey,(k:SortKey)=>void]{
 const [s,set]=useState<SortKey>(()=>{try{const v=localStorage.getItem(key) as SortKey;return SORTS.some(x=>x[0]===v)?v:'manual'}catch{return'manual'}})
 return[s,k=>{set(k);try{localStorage.setItem(key,k)}catch{}}]}
export function SortSelect({value,onChange}:{value:SortKey;onChange:(k:SortKey)=>void}){
 return <select className="sortsel" title="Ordenar productos" value={value} onChange={e=>onChange(e.target.value as SortKey)}>{SORTS.map(([k,l])=><option key={k} value={k}>{l}</option>)}</select>}
