import {useCallback,useEffect,useState} from 'react'
import {Session} from '@supabase/supabase-js'
import {supabase} from './supabase'
import {Brand,Product} from './types'
import Products from './Products'
import Summary from './Summary'
import Admin from './Admin'
export default function App(){
 const [tab,setTab]=useState<'p'|'s'|'a'>('p')
 const [products,setP]=useState<Product[]>([]);const [brands,setB]=useState<Brand[]>([])
 const [session,setSession]=useState<Session|null>(null)
 const load=useCallback(async()=>{
  const [a,b]=await Promise.all([supabase.from('products').select('*').order('position'),supabase.from('brands').select('*').order('name')])
  setP((a.data as Product[])||[]);setB((b.data as Brand[])||[])},[])
 useEffect(()=>{load();supabase.auth.getSession().then(r=>setSession(r.data.session))
  const {data}=supabase.auth.onAuthStateChange((_,s)=>setSession(s));return()=>data.subscription.unsubscribe()},[load])
 const shared={products,brands,reload:load,canDelete:!!session}
 return <div className="app">
  <nav>{([['p','Productos'],['s','Resumen'],['a','Admin']] as const).map(([k,l])=><button key={k} className={tab===k?'on':''} onClick={()=>setTab(k)}>{l}</button>)}</nav>
  {tab==='p'&&<Products {...shared}/>}{tab==='s'&&<Summary products={products}/>}{tab==='a'&&<Admin {...shared} session={session}/>}
 </div>}
