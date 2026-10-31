import {useState} from 'react'
import {supabase} from './supabase'
export default function Login({title}:{title:string}){
 const [email,setE]=useState('');const [pw,setPw]=useState('')
 const enter=async()=>{const {error}=await supabase.auth.signInWithPassword({email,password:pw});if(error)alert(error.message)}
 return <section><h2>{title}</h2><p className="empty">Inicia sesión para ver esta sección.</p><div className="form">
  <input placeholder="Correo" value={email} onChange={e=>setE(e.target.value)}/>
  <input type="password" placeholder="Contraseña" value={pw} onChange={e=>setPw(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')enter()}}/>
  <button onClick={enter}>Entrar</button></div></section>}
