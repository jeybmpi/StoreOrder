import {useCallback,useEffect,useMemo,useRef,useState} from 'react'
import {Session} from '@supabase/supabase-js'
import {supabase} from './supabase'
import {Api,Brand,Data,PayMethod,Product,Unit} from './types'
import Products from './Products'
import Summary from './Summary'
import Admin from './Admin'
import {removeImage} from './utils'

// El orden visual se guarda solo en este navegador (no se envía a Supabase)
const ORD='orden'
const readOrd=():string[]=>{try{return JSON.parse(localStorage.getItem(ORD)||'[]')}catch{return[]}}
const sortBy=(a:Product[],o:string[])=>{const i=new Map(o.map((id,n)=>[id,n]));return [...a].sort((x,y)=>(i.get(x.id)??1e9)-(i.get(y.id)??1e9)||x.position-y.position)}

export default function App(){
 const [tab,setTab]=useState<'p'|'s'>('p')
 const [admin,setAdmin]=useState(location.hash==='#admin')
 const [products,setP]=useState<Product[]>([]);const [units,setU]=useState<Unit[]>([]);const [brands,setB]=useState<Brand[]>([])
 const [session,setSession]=useState<Session|null>(null);const [pms,setPm]=useState<PayMethod[]>([])
 const pr=useRef(products);pr.current=products
 const load=useCallback(async()=>{
  const [a,b,c,d]=await Promise.all([supabase.from('products').select('*').order('position'),supabase.from('brands').select('*').order('name'),supabase.from('units').select('*').order('created_at').limit(10000),supabase.from('payment_methods').select('*').order('name')])
  setP(sortBy((a.data as Product[])||[],readOrd()));setB((b.data as Brand[])||[]);setU((c.data as Unit[])||[]);setPm((d.data as PayMethod[])||[])},[])
 const api=useMemo<Api>(()=>{
  const run=(q:PromiseLike<{error:{message:string}|null}>)=>{q.then(r=>{if(r.error){alert(r.error.message);load()}})}
  const addUnits=async(pid:string,n:number)=>{if(n<=0)return
   const {data,error}=await supabase.from('units').insert(Array.from({length:n},()=>({product_id:pid}))).select()
   if(error){alert(error.message);return};setU(a=>[...a,...(data as Unit[])])}
  return{reload:load,addUnits,
   updProduct:(id,d)=>{const old=pr.current.find(p=>p.id===id)?.image_url;if(d.image_url&&old&&old!==d.image_url)removeImage(old);setP(a=>a.map(p=>p.id===id?{...p,...d}:p));run(supabase.from('products').update(d).eq('id',id))},
   delProduct:id=>{const old=pr.current.find(p=>p.id===id)?.image_url;if(old)removeImage(old);setP(a=>a.filter(p=>p.id!==id));setU(a=>a.filter(u=>u.product_id!==id));run(supabase.from('products').delete().eq('id',id))},
   createProduct:async(d,qty)=>{const pos=Math.max(0,...pr.current.map(p=>p.position))+1
    const {data,error}=await supabase.from('products').insert({...d,position:pos}).select().single();if(error)throw error
    setP(a=>[...a,data as Product]);await addUnits((data as Product).id,qty)},
   updUnit:(id,d)=>{setU(a=>a.map(u=>u.id===id?{...u,...d}:u));run(supabase.from('units').update(d).eq('id',id))},
   delUnit:id=>{setU(a=>a.filter(u=>u.id!==id));run(supabase.from('units').delete().eq('id',id))},
   setOrder:ids=>{const cur=pr.current.map(p=>p.id)
    const slots=ids.map(id=>cur.indexOf(id)).sort((a,b)=>a-b)
    const next=cur.slice();ids.forEach((id,i)=>{next[slots[i]]=id})
    localStorage.setItem(ORD,JSON.stringify(next))
    setP(a=>sortBy(a,next))}}
 },[load])
 const cache=useRef(new Map<string,Unit[]>())
 const unitsBy=useMemo(()=>{const m=new Map<string,Unit[]>()
  for(const u of units){const a=m.get(u.product_id);a?a.push(u):m.set(u.product_id,[u])}
  for(const [k,a] of m){const o=cache.current.get(k);if(o&&o.length===a.length&&o.every((x,i)=>x===a[i]))m.set(k,o)}
  cache.current=m;return m},[units])
 useEffect(()=>{load();supabase.auth.getSession().then(r=>setSession(r.data.session))
  const {data}=supabase.auth.onAuthStateChange((_,s)=>setSession(s))
  const h=()=>setAdmin(location.hash==='#admin');window.addEventListener('hashchange',h)
  return()=>{data.subscription.unsubscribe();window.removeEventListener('hashchange',h)}},[load])
 const go=(k:'p'|'s')=>{setTab(k);if(admin){history.replaceState(null,'',location.pathname);setAdmin(false)}}
 const methods=useMemo(()=>pms.map(m=>m.name),[pms])
 const data:Data={products,brands,unitsBy,api,methods,pms,canDelete:!!session}
 return <div className="app">
  <nav>{([['p','Productos'],['s','Resumen']] as const).map(([k,l])=><button key={k} className={!admin&&tab===k?'on':''} onClick={()=>go(k)}>{l}</button>)}</nav>
  {admin?<Admin data={data} session={session}/>:tab==='p'?<Products data={data}/>:<Summary products={products} units={units}/>}
 </div>}
