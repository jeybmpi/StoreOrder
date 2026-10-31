import {memo,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {Api,Brand,Product,Unit} from './types'
import {chipStyle,fmt,fmtDate,parsePrice,uploadImage} from './utils'
import {burst,fxMap} from './fx'

const dragState={active:false}
document.addEventListener('touchmove',e=>{if(dragState.active&&e.cancelable)e.preventDefault()},{passive:false})
const openSet=new Set<string>() // filas con unidades desplegadas (se conserva al cambiar de tabla)

export function Swipe({onDone,red}:{onDone:(pt:{x:number;y:number})=>void;red?:boolean}){
 const [x,setX]=useState(0);const s=useRef<number|null>(null);const W=104,K=24
 return <div className={'swipe'+(red?' red':'')}><span>{red?'Devolver ▶▶':'Vendido ▶▶'}</span>
  <div className="knob" style={{transform:`translateX(${x}px)`}}
   onPointerDown={e=>{s.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId)}}
   onPointerMove={e=>{if(s.current!==null)setX(Math.max(0,Math.min(W-K-4,e.clientX-s.current)))}}
   onPointerUp={e=>{if(x>W-K-17){const r=e.currentTarget.getBoundingClientRect();onDone({x:r.left+r.width/2,y:r.top+r.height/2})}s.current=null;setX(0)}}
   onPointerCancel={()=>{s.current=null;setX(0)}}/></div>}

export function Form({init,qty0,brands,methods,onSave,onCancel}:{init?:Product;qty0:number;brands:Brand[];methods:string[];onSave:(d:Partial<Product>,qty:number)=>Promise<void>|void;onCancel:()=>void}){
 const [name,setName]=useState(init?.name||'');const [sp,setSp]=useState(String(init?.suggested_price??''))
 const [rp,setRp]=useState(init?.real_price!=null?String(init.real_price):'');const [pm,setPm]=useState(init?.payment_method||'')
 const [brand,setBrand]=useState(init?.brand_id||'');const [color,setColor]=useState(init?.color||'')
 const [qty,setQty]=useState(String(qty0));const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false)
 const save=async()=>{if(!name.trim())return alert('Falta el nombre');setBusy(true)
  try{const d:Partial<Product>={name:name.trim(),suggested_price:parsePrice(sp),real_price:rp?parsePrice(rp):null,payment_method:pm.trim(),brand_id:brand||null,color:color||null}
   if(file)d.image_url=await uploadImage(file);await onSave(d,Math.max(0,Math.floor(Number(qty)||0)))}catch(e:any){alert(e.message)}setBusy(false)}
 return <div className="form">
  <input placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)}/>
  <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)}/>
  <input placeholder="Precio sugerido (1.500,50)" inputMode="decimal" value={sp} onChange={e=>setSp(e.target.value)}/>
  <input placeholder="Precio real por defecto (opcional)" inputMode="decimal" value={rp} onChange={e=>setRp(e.target.value)}/>
  <label>Cantidad de unidades <input inputMode="numeric" style={{width:80}} value={qty} onChange={e=>setQty(e.target.value.replace(/\D/g,''))}/> <small>(0 = no se muestra en Productos)</small></label>
  <select value={pm} onChange={e=>setPm(e.target.value)}><option value="">Método de pago (opcional)</option>{(pm&&!methods.includes(pm)?[...methods,pm]:methods).map(m=><option key={m}>{m}</option>)}</select>
  <select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">Sin marca</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
  <label>Color <input type="color" value={color||'#ffffff'} onChange={e=>setColor(e.target.value)}/> <button type="button" className="ghost" onClick={()=>setColor('')}>Usar el de la marca</button></label>
  <div className="btns"><button disabled={busy} onClick={save}>Guardar</button><button className="ghost" onClick={onCancel}>Cancelar</button></div></div>}

function UnitLine({u,p,methods,api,canEdit}:{u:Unit;p:Product;methods:string[];api:Api;canEdit:boolean}){
 const def=p.real_price??p.suggested_price;const pay=u.payment_method??p.payment_method??''
 const [cls]=useState(()=>{const f=fxMap.get(u.id);if(f&&Date.now()-f.t<2000){fxMap.delete(u.id);return f.kind==='sell'?'flash-pink':'flash-red'};return ''})
 const go=(kind:'sell'|'back')=>(pt:{x:number;y:number})=>{fxMap.set(u.id,{kind,t:Date.now()});burst(kind,pt.x,pt.y)
  api.updUnit(u.id,kind==='sell'?{sold:true,sold_at:new Date().toISOString(),real_price:u.real_price??def,...((u.payment_method||p.payment_method)?{payment_method:u.payment_method||p.payment_method}:{})}:{sold:false,sold_at:null})}
 const opts=!pay||methods.includes(pay)?methods:[...methods,pay]
 if(!canEdit)return <div className="unit"><b>{fmt(u.real_price??def)}</b><span className="ro">{pay||'Sin método'}</span>{u.sold&&u.sold_at&&<small className="when">Vendida: {fmtDate(u.sold_at)}</small>}</div>
 return <div className={'unit '+cls}>
  <input key={u.real_price} inputMode="decimal" defaultValue={u.real_price??''} placeholder={String(def)} title="Precio de venta"
   onBlur={e=>{const v=e.target.value.trim()?parsePrice(e.target.value):null;if(v!==u.real_price)api.updUnit(u.id,{real_price:v})}}/>
  <select value={pay} title="Método de pago" onChange={e=>api.updUnit(u.id,{payment_method:e.target.value||null})}>
   <option value="">Método…</option>{opts.map(m=><option key={m}>{m}</option>)}</select>
  <Swipe red={u.sold} onDone={go(u.sold?'back':'sell')}/>
  <button className="ib" onClick={()=>{if(confirm('¿Eliminar esta unidad?'))api.delUnit(u.id)}}>✕</button>
  {u.sold&&u.sold_at&&<small className="when">Vendida: {fmtDate(u.sold_at)}</small>}</div>}

export interface DragProps{onDown:(id:string,y:number)=>void;onMove:(y:number)=>void;onUp:()=>void}
interface RowProps{p:Product;units:Unit[];brand?:Brand;brands:Brand[];methods:string[];sold:boolean;canDelete:boolean;api:Api;drag?:DragProps;dragging?:boolean}

const Row=memo(function Row({p,units,brand,brands,methods,sold,canDelete,api,drag,dragging}:RowProps){
 const [edit,setEdit]=useState(false);const [picker,setPicker]=useState(false);const [zoom,setZoom]=useState(false);const [pc,setPc]=useState('')
 const [open,setOpenS]=useState(openSet.has(p.id));const setOpen=(v:boolean)=>{if(v)openSet.add(p.id);else openSet.delete(p.id);setOpenS(v)}
 const g=useRef({x:0,y:0,t:0,active:false,moved:false,long:false})
 const color=p.color||brand?.color||'#f0b6f7'
 const avail=units.filter(u=>!u.sold),done=units.filter(u=>u.sold)
 const last=done.reduce((m,u)=>u.sold_at&&u.sold_at>m?u.sold_at:m,'')
 const openPicker=()=>{setPc(color.length===7?color:'#cccccc');setPicker(true)}

 const onDown=(e:React.PointerEvent)=>{
  if(e.button>0)return
  const s=g.current,mouse=e.pointerType==='mouse';s.x=e.clientX;s.y=e.clientY;s.moved=false;s.active=false;s.long=false
  const activate=()=>{if(!drag)return false;s.active=true;dragState.active=true;drag.onDown(p.id,s.y);return true}
  const cleanup=()=>{clearTimeout(s.t);window.removeEventListener('pointermove',mv);window.removeEventListener('pointerup',up);window.removeEventListener('pointercancel',up)}
  const mv=(ev:PointerEvent)=>{const far=Math.hypot(ev.clientX-s.x,ev.clientY-s.y)>8
   if(!s.active){if(far){if(mouse&&drag){clearTimeout(s.t);activate()}else cleanup()};return}
   if(far)s.moved=true;drag!.onMove(ev.clientY)}
  const up=(ev:PointerEvent)=>{const was=s.active;cleanup()
   if(was){s.active=false;dragState.active=false;drag!.onUp();if(!s.moved&&ev.type!=='pointercancel')openPicker()}}
  window.addEventListener('pointermove',mv);window.addEventListener('pointerup',up);window.addEventListener('pointercancel',up)
  s.t=window.setTimeout(()=>{s.long=true;if(!activate())openPicker()},350)}

 const del=()=>{if(confirm(`¿Eliminar "${p.name}" y todas sus unidades? Esta acción no se puede deshacer.`))api.delProduct(p.id)}

 if(edit)return <div className="row" style={{background:color+'33',borderLeftColor:color}}>
  <Form init={p} qty0={units.length} brands={brands} methods={methods} onCancel={()=>setEdit(false)} onSave={(d,qty)=>{
   if(qty===0&&units.length>0&&done.length===0&&!confirm('Con 0 unidades el producto dejará de mostrarse en Productos (seguirá en Admin). ¿Continuar?'))return
   api.updProduct(p.id,d);const diff=qty-units.length
   if(diff>0)api.addUnits(p.id,diff)
   else if(diff<0){const rm=avail.slice(0,-diff);if(rm.length<-diff)alert('Solo se pueden quitar unidades disponibles (no vendidas).');rm.forEach(u=>api.delUnit(u.id))}
   setEdit(false)}}/></div>

 return <div data-id={p.id} className={'row'+(dragging?' dragging':'')} style={{background:color+'33',borderLeftColor:color}}>
  <div className="info" onPointerDown={onDown} onContextMenu={e=>e.preventDefault()}>
   {p.image_url?<img src={p.image_url} draggable={false} loading="lazy" decoding="async" onClick={()=>{if(!g.current.long&&!g.current.moved)setZoom(true)}}/>:<div className="noimg">📦</div>}
   <div className="txt"><b>{p.name}</b>
    <small>{brand&&<span className="chip" style={chipStyle(brand.color)}>{brand.name}</span>}{fmt(p.suggested_price)}{sold&&last?` · ${fmtDate(last)}`:''}</small></div></div>
  <div className="ctl">
   <input key={p.real_price} inputMode="decimal" defaultValue={p.real_price??''} placeholder={'Real '+p.suggested_price} title="Precio real por defecto"
    onBlur={e=>{const v=e.target.value.trim()?parsePrice(e.target.value):null;if(v!==p.real_price)api.updProduct(p.id,{real_price:v})}}/>
   {canDelete&&<><button className="ib" onClick={()=>setEdit(true)}>✏️</button><button className="ib" onClick={del}>✕</button></>}</div>
  {picker&&<div className="picker">Color: <input type="color" value={pc} onChange={e=>setPc(e.target.value)}/>
   <button onClick={()=>{api.updProduct(p.id,{color:pc});setPicker(false)}}>Guardar</button>
   <button className="ghost" onClick={()=>{api.updProduct(p.id,{color:null});setPicker(false)}}>Quitar</button>
   <button className="ghost" onClick={()=>setPicker(false)}>Cerrar</button></div>}
  <div className="uhead" onClick={()=>setOpen(!open)}><span>{open?'▾':'▸'} Disponibles {avail.length} · Vendidas {done.length}</span>
   {canDelete&&<button onClick={e=>{e.stopPropagation();api.addUnits(p.id,1)}}>+</button>}</div>
  {open&&<div className="ugroups">
   <div><b>Disponibles ({avail.length})</b>{avail.map(u=><UnitLine key={u.id} u={u} p={p} methods={methods} api={api} canEdit={canDelete}/>)}</div>
   <div><b>Vendidas ({done.length})</b>{done.map(u=><UnitLine key={u.id} u={u} p={p} methods={methods} api={api} canEdit={canDelete}/>)}</div></div>}
  {zoom&&p.image_url&&createPortal(<div className="zoom" onClick={()=>setZoom(false)}><img src={p.image_url}/></div>,document.body)}
 </div>})
export default Row
