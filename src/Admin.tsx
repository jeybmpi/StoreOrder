import {useState} from 'react'
import {Session} from '@supabase/supabase-js'
import {supabase} from './supabase'
import {Data,EMPTY} from './types'
import Row,{Form} from './Row'
import {compress,fmtDate,uploadBlob} from './utils'
import {exportAll,importAll} from './backup'
export default function Admin({data,session}:{data:Data;session:Session|null}){
 const {products,brands,unitsBy,api,methods,pms}=data
 const [email,setE]=useState('');const [pw,setPw]=useState('');const [adding,setAdding]=useState(false)
 const [bn,setBn]=useState('');const [bc,setBc]=useState('#e056fd');const [opt,setOpt]=useState('');const [mn,setMn]=useState('')
 if(!session)return <section><h2>Admin</h2><div className="form">
  <input placeholder="Correo" value={email} onChange={e=>setE(e.target.value)}/><input type="password" placeholder="Contraseña" value={pw} onChange={e=>setPw(e.target.value)}/>
  <button onClick={async()=>{const {error}=await supabase.auth.signInWithPassword({email,password:pw});if(error)alert(error.message)}}>Entrar</button></div></section>
 const addBrand=async()=>{if(!bn.trim())return;const {error}=await supabase.from('brands').insert({name:bn.trim(),color:bc});if(error)alert(error.message);setBn('');api.reload()}
 const optimize=async()=>{if(!confirm('Se recomprimirán las fotos pesadas (puede tardar). ¿Continuar?'))return
  let saved=0,n=0,i=0
  for(const p of products){i++;if(!p.image_url)continue
   try{setOpt(`Procesando ${i} de ${products.length}…`)
    const blob=await (await fetch(p.image_url)).blob();if(blob.size<60000)continue
    const small=await compress(blob);if(small.size>=blob.size)continue
    const url=await uploadBlob(small);api.updProduct(p.id,{image_url:url});saved+=blob.size-small.size;n++}catch(e){console.warn(e)}}
  setOpt(`Listo: ${n} fotos optimizadas, ahorro ${(saved/1048576).toFixed(1)} MB`)}
 const clean=async()=>{const {data,error}=await supabase.storage.from('products').list('',{limit:1000});if(error||!data)return alert(error?.message)
  const used=new Set(products.map(p=>p.image_url?decodeURIComponent(p.image_url.split('/products/')[1]?.split('?')[0]||''):'').filter(Boolean))
  const orphan=data.filter(f=>f.id&&!used.has(f.name)).map(f=>f.name)
  if(!orphan.length)return setOpt('No hay fotos sobrantes')
  if(!confirm(`Hay ${orphan.length} fotos que ningún producto usa. ¿Borrarlas?`))return
  const r=await supabase.storage.from('products').remove(orphan);setOpt(r.error?r.error.message:`Borradas ${orphan.length} fotos sobrantes`)}
 const backup=async(img:boolean)=>{try{setOpt('Preparando respaldo…');const r=await exportAll(img);setOpt(`Respaldo descargado: ${r.products} productos, ${r.units} unidades, ${r.images} fotos`)}catch(e:any){setOpt('Error: '+e.message)}}
 const restore=async(f?:File)=>{if(!f)return;if(!confirm('Se cargarán los datos del archivo en este proyecto (lo que tenga el mismo id se actualiza, nada se duplica). ¿Continuar?'))return
  try{const r=await importAll(f,setOpt);await api.reload();setOpt(`Restauración completa: ${r.products} productos, ${r.units} unidades`)}catch(e:any){setOpt('Error: '+e.message)}}
 const lastB=localStorage.getItem('ultimo_respaldo')
 return <section><h2>Admin <button className="ghost" onClick={()=>supabase.auth.signOut()}>Salir</button></h2>
  <h3>Marcas</h3>
  {brands.map(b=><div className="brand" key={b.id}>
   <input type="color" value={b.color} onChange={async e=>{await supabase.from('brands').update({color:e.target.value}).eq('id',b.id);api.reload()}}/>
   <input defaultValue={b.name} onBlur={async e=>{if(e.target.value!==b.name){await supabase.from('brands').update({name:e.target.value}).eq('id',b.id);api.reload()}}}/>
   <button onClick={async()=>{if(confirm(`¿Eliminar la marca "${b.name}"?`)){await supabase.from('brands').delete().eq('id',b.id);api.reload()}}}>✕</button></div>)}
  <div className="brand"><input type="color" value={bc} onChange={e=>setBc(e.target.value)}/><input placeholder="Nueva marca" value={bn} onChange={e=>setBn(e.target.value)}/><button onClick={addBrand}>Agregar</button></div>
  <h3>Métodos de pago</h3>
  {pms.map(m=><div className="brand" key={m.id}><input value={m.name} readOnly/><button onClick={async()=>{if(confirm(`¿Eliminar "${m.name}"? Las ventas ya registradas conservan su método.`)){await supabase.from('payment_methods').delete().eq('id',m.id);api.reload()}}}>✕</button></div>)}
  <div className="brand"><input placeholder="Nuevo método (Efectivo, Nequi…)" value={mn} onChange={e=>setMn(e.target.value)}/><button onClick={async()=>{const n=mn.trim();if(!n)return;const {error}=await supabase.from('payment_methods').insert({name:n});if(error)alert(error.message);setMn('');api.reload()}}>Agregar</button></div>
  <h3>Almacenamiento</h3>
  <div className="brand"><button className="ghost" onClick={optimize}>🗜️ Optimizar fotos</button><button className="ghost" onClick={clean}>🧹 Borrar fotos sobrantes</button></div>{opt&&<small>{opt}</small>}
  <h3>Respaldo</h3>
  <small>Último respaldo en este dispositivo: {lastB?fmtDate(lastB):'nunca'}</small>
  <div className="brand"><button onClick={()=>backup(true)}>⬇️ Descargar respaldo (con fotos)</button><button className="ghost" onClick={()=>backup(false)}>Sin fotos</button></div>
  <label className="brand">⬆️ Restaurar respaldo: <input type="file" accept="application/json,.json" onChange={e=>{restore(e.target.files?.[0]);e.target.value=''}}/></label>
  <h3>Productos ({products.length})</h3>
  {adding?<Form qty0={1} brands={brands} methods={methods} onCancel={()=>setAdding(false)} onSave={async(d,qty)=>{await api.createProduct(d,qty);setAdding(false)}}/>
   :<button onClick={()=>setAdding(true)}>+ Agregar producto</button>}
  <div style={{marginTop:8}}>{products.map(p=>{const u=unitsBy.get(p.id)||EMPTY
   return <Row key={p.id} p={p} units={u} brand={brands.find(b=>b.id===p.brand_id)} brands={brands} methods={methods} sold={u.length>0&&u.every(x=>x.sold)} canDelete api={api}/>})}</div></section>}
