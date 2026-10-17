import {useRef,useState} from 'react'
import {supabase} from './supabase'
import {Brand,Product} from './types'
import Row from './Row'
import {matches} from './utils'
interface P{products:Product[];brands:Brand[];reload:()=>void;canDelete:boolean}
export function List({products,brands,reload,canDelete,sold}:P&{sold:boolean}){
 const [q,setQ]=useState('')
 const [ids,setIds]=useState<string[]|null>(null)
 const dragId=useRef<string|null>(null)
 const all=products.filter(p=>p.sold===sold)
 const ordered=ids?ids.map(id=>all.find(p=>p.id===id)).filter(Boolean) as Product[]:all
 const shown=ordered.filter(p=>matches(p,brands.find(b=>b.id===p.brand_id)?.name||'',q))

 const down=(id:string)=>()=>{dragId.current=id;setIds(all.map(p=>p.id))}
 const move=(e:React.PointerEvent)=>{
  const d=dragId.current;if(!d)return
  if(e.clientY<80)window.scrollBy(0,-12);else if(e.clientY>window.innerHeight-80)window.scrollBy(0,12)
  const els=document.querySelectorAll<HTMLElement>(`[data-list="${sold}"] [data-id]`)
  for(const el of Array.from(els)){const r=el.getBoundingClientRect()
   if(e.clientY>r.top&&e.clientY<r.bottom){const over=el.dataset.id!
    if(over!==d)setIds(prev=>{if(!prev)return prev;const a=prev.filter(x=>x!==d);a.splice(prev.indexOf(over),0,d);return a})
    break}}}
 const up=async()=>{
  if(!dragId.current)return;dragId.current=null
  const pos=all.map(p=>p.position).sort((a,b)=>a-b)
  const ups=(ids||[]).map((id,i)=>({id,position:pos[i]})).filter(u=>all.find(p=>p.id===u.id)?.position!==u.position)
  await Promise.all(ups.map(u=>supabase.from('products').update({position:u.position}).eq('id',u.id)))
  await reload();setIds(null)}

 return <section><h2>{sold?'Vendidos':'Por vender'} ({all.length})</h2>
  <input className="search" placeholder="🔍 Buscar producto o marca…" value={q} onChange={e=>setQ(e.target.value)}/>
  <div data-list={String(sold)}>
  {shown.map(p=><Row key={p.id} p={p} brands={brands} sold={sold} canDelete={canDelete} reload={reload}
   dragging={ids!==null&&dragId.current===p.id}
   drag={q?undefined:{onDown:down(p.id),onMove:move,onUp:up}}/>)}
  </div>
  {!shown.length&&<p className="empty">Sin productos</p>}</section>}
export default function Products(p:P){return <><List {...p} sold={false}/><List {...p} sold={true}/></>}