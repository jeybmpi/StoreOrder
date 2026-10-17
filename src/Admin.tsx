import {useState} from 'react'
import {Session} from '@supabase/supabase-js'
import {supabase} from './supabase'
import {Brand,Product} from './types'
import Row,{Form} from './Row'
interface P{products:Product[];brands:Brand[];reload:()=>void;canDelete:boolean;session:Session|null}
export default function Admin({products,brands,reload,session}:P){
 const [email,setE]=useState('');const [pw,setPw]=useState('');const [adding,setAdding]=useState(false)
 const [bn,setBn]=useState('');const [bc,setBc]=useState('#6366f1')
 if(!session)return <section><h2>Admin</h2><div className="form">
  <input placeholder="Correo" value={email} onChange={e=>setE(e.target.value)}/><input type="password" placeholder="Contraseña" value={pw} onChange={e=>setPw(e.target.value)}/>
  <button onClick={async()=>{const {error}=await supabase.auth.signInWithPassword({email,password:pw});if(error)alert(error.message)}}>Entrar</button></div></section>
 const addBrand=async()=>{if(!bn.trim())return;const {error}=await supabase.from('brands').insert({name:bn.trim(),color:bc});if(error)alert(error.message);setBn('');reload()}
 return <section><h2>Admin <button className="ghost" onClick={()=>supabase.auth.signOut()}>Salir</button></h2>
  <h3>Marcas</h3>
  {brands.map(b=><div className="brand" key={b.id}>
   <input type="color" value={b.color} onChange={async e=>{await supabase.from('brands').update({color:e.target.value}).eq('id',b.id);reload()}}/>
   <input defaultValue={b.name} onBlur={async e=>{if(e.target.value!==b.name){await supabase.from('brands').update({name:e.target.value}).eq('id',b.id);reload()}}}/>
   <button onClick={async()=>{if(confirm(`¿Eliminar la marca "${b.name}"?`)){await supabase.from('brands').delete().eq('id',b.id);reload()}}}>✕</button></div>)}
  <div className="brand"><input type="color" value={bc} onChange={e=>setBc(e.target.value)}/><input placeholder="Nueva marca" value={bn} onChange={e=>setBn(e.target.value)}/><button onClick={addBrand}>Agregar</button></div>
  <h3>Productos ({products.length})</h3>
  {adding?<Form brands={brands} onCancel={()=>setAdding(false)} onSave={async d=>{
   const pos=Math.max(0,...products.map(p=>p.position))+1
   const {error}=await supabase.from('products').insert({...d,position:pos});if(error)throw error;setAdding(false);reload()}}/>
   :<button onClick={()=>setAdding(true)}>+ Agregar producto</button>}
  {products.map(p=><Row key={p.id} p={p} brands={brands} sold={p.sold} canDelete reload={reload}/>)}</section>}
