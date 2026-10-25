import {useLayoutEffect,useMemo,useRef,useState} from 'react'
import {Data,EMPTY,Product} from './types'
import Row,{DragProps} from './Row'
import {matches} from './utils'
import {SortKey,SortSelect,sortProducts,useSort} from './sort'
export function List({data,sold,sort}:{data:Data;sold:boolean;sort:SortKey}){
 const {products,brands,unitsBy,api,canDelete}=data
 const [q,setQ]=useState('');const [ids,setIds]=useState<string[]|null>(null)
 const dragId=useRef<string|null>(null);const idsRef=useRef<string[]|null>(null);const root=useRef<HTMLDivElement>(null)
 const lastY=useRef(0),grab=useRef(0),tr=useRef(0),raf=useRef(0)
 const all=useMemo(()=>products.filter(p=>{const u=unitsBy.get(p.id)||EMPTY;return u.length>0&&u.every(x=>x.sold)===sold}),[products,unitsBy,sold])
 const listRef=useRef<string[]>([]);listRef.current=all.map(p=>p.id)
 const bm=useMemo(()=>new Map(brands.map(b=>[b.id,b])),[brands])
 const byId=new Map(all.map(p=>[p.id,p]))
 const sorted=useMemo(()=>sort==='manual'?all:sortProducts(all,sort,id=>bm.get(id||'')?.name||''),[all,sort,bm])
 const ordered=ids?(ids.map(id=>byId.get(id)).filter(Boolean) as Product[]):sorted
 const shown=q?ordered.filter(p=>matches(p,bm.get(p.brand_id||'')?.name||'',q)):ordered

 // La fila arrastrada sigue al dedo con transform (sin re-renderizar React)
 const follow=()=>{const d=dragId.current;if(!d||!root.current)return
  const me=root.current.querySelector<HTMLElement>(`[data-id="${d}"]`);if(!me)return
  const natural=me.getBoundingClientRect().top-tr.current
  tr.current=lastY.current-grab.current-natural
  me.style.transform=`translateY(${tr.current}px)`}
 useLayoutEffect(follow,[ids])

 const H=useMemo<DragProps>(()=>{
  const set=(a:string[]|null)=>{idsRef.current=a;setIds(a)}
  const step=()=>{const d=dragId.current,cur=idsRef.current;if(!d||!cur||!root.current)return
   const y=lastY.current
   if(y<90)window.scrollBy(0,-12);else if(y>window.innerHeight-90)window.scrollBy(0,12)
   const from=cur.indexOf(d)
   for(const el of Array.from(root.current.children) as HTMLElement[]){const id=el.dataset.id;if(!id||id===d)continue
    const r=el.getBoundingClientRect()
    if(y>r.top&&y<r.bottom){const to=cur.indexOf(id),mid=r.top+r.height/2
     if((to>from&&y>mid)||(to<from&&y<mid)){const a=cur.slice();a.splice(from,1);a.splice(to,0,d);set(a)}
     break}}
   follow();raf.current=requestAnimationFrame(step)}
  return{
   onDown:(id,y)=>{dragId.current=id;lastY.current=y;tr.current=0
    const el=root.current?.querySelector<HTMLElement>(`[data-id="${id}"]`);grab.current=el?y-el.getBoundingClientRect().top:0
    set(listRef.current);raf.current=requestAnimationFrame(step)},
   onMove:y=>{lastY.current=y},
   onUp:()=>{const d=dragId.current;if(!d)return;cancelAnimationFrame(raf.current)
    const el=root.current?.querySelector<HTMLElement>(`[data-id="${d}"]`);if(el)el.style.transform=''
    dragId.current=null;const a=idsRef.current
    if(a&&a.join()!==listRef.current.join())api.setOrder(a);set(null)}}
 // eslint-disable-next-line
 },[api])
 return <section><h2>{sold?'Vendidos':'Por vender'} ({all.length})</h2>
  <input className="search" placeholder="🔍 Buscar producto o marca…" value={q} onChange={e=>setQ(e.target.value)}/>
  <div ref={root}>{shown.map(p=><Row key={p.id} p={p} units={unitsBy.get(p.id)||EMPTY} brand={bm.get(p.brand_id||'')} brands={brands} methods={data.methods} sold={sold} canDelete={canDelete} api={api}
   drag={q||sort!=='manual'?undefined:H} dragging={ids!==null&&dragId.current===p.id}/>)}</div>
  {!shown.length&&<p className="empty">Sin productos</p>}</section>}
export default function Products({data}:{data:Data}){
 const [sort,setSort]=useSort('sort_productos')
 return <><div className="sortbar"><SortSelect value={sort} onChange={setSort}/></div><List data={data} sold={false} sort={sort}/><List data={data} sold={true} sort={sort}/></>}
