import {useEffect,useRef,useState} from 'react'
import {supabase} from './supabase'
import {Brand,Product} from './types'
import {fmt,fmtDate,parsePrice,uploadImage} from './utils'

export function Swipe({onDone,red}:{onDone:()=>void;red?:boolean}){
 const [x,setX]=useState(0);const s=useRef<number|null>(null);const W=150
 return <div className={'swipe'+(red?' red':'')}><span>{red?'Devolver ▶▶':'Vendido ▶▶'}</span>
  <div className="knob" style={{transform:`translateX(${x}px)`}}
   onPointerDown={e=>{s.current=e.clientX;e.currentTarget.setPointerCapture(e.pointerId)}}
   onPointerMove={e=>{if(s.current!==null)setX(Math.max(0,Math.min(W-40,e.clientX-s.current)))}}
   onPointerUp={()=>{if(x>W-55)onDone();s.current=null;setX(0)}} onPointerCancel={()=>{s.current=null;setX(0)}}/></div>}

export function Form({init,brands,onSave,onCancel}:{init?:Product;brands:Brand[];onSave:(d:Partial<Product>)=>Promise<void>;onCancel:()=>void}){
 const [name,setName]=useState(init?.name||'');const [sp,setSp]=useState(String(init?.suggested_price??''))
 const [rp,setRp]=useState(init?.real_price!=null?String(init.real_price):'');const [pm,setPm]=useState(init?.payment_method||'')
 const [brand,setBrand]=useState(init?.brand_id||'');const [color,setColor]=useState(init?.color||'')
 const [sold,setSold]=useState(init?.sold||false);const [file,setFile]=useState<File|null>(null);const [busy,setBusy]=useState(false)
 const save=async()=>{if(!name.trim())return alert('Falta el nombre');setBusy(true)
  try{const d:Partial<Product>={name:name.trim(),suggested_price:parsePrice(sp),real_price:rp?parsePrice(rp):null,payment_method:pm.trim(),brand_id:brand||null,color:color||null,sold,
   sold_at:sold?(init?.sold_at||new Date().toISOString()):null}
   if(file)d.image_url=await uploadImage(file);await onSave(d)}catch(e:any){alert(e.message)}setBusy(false)}
 return <div className="form">
  <input placeholder="Nombre" value={name} onChange={e=>setName(e.target.value)}/>
  <input type="file" accept="image/*" onChange={e=>setFile(e.target.files?.[0]||null)}/>
  <input placeholder="Precio sugerido (1.500,50)" inputMode="decimal" value={sp} onChange={e=>setSp(e.target.value)}/>
  <input placeholder="Precio de venta real" inputMode="decimal" value={rp} onChange={e=>setRp(e.target.value)}/>
  <input placeholder="Método de pago" value={pm} onChange={e=>setPm(e.target.value)}/>
  <select value={brand} onChange={e=>setBrand(e.target.value)}><option value="">Sin marca</option>{brands.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select>
  <label>Color <input type="color" value={color||'#ffffff'} onChange={e=>setColor(e.target.value)}/> <button type="button" onClick={()=>setColor('')}>Usar el de la marca</button></label>
  <label><input type="checkbox" checked={sold} onChange={e=>setSold(e.target.checked)}/> Vendido</label>
  <div className="btns"><button disabled={busy} onClick={save}>Guardar</button><button className="ghost" onClick={onCancel}>Cancelar</button></div></div>}

type DragProps={onDown:()=>void;onMove:(e:React.PointerEvent)=>void;onUp:()=>void}

export default function Row({p,brands,sold,canDelete,reload,drag,dragging}:{p:Product;brands:Brand[];sold:boolean;canDelete:boolean;reload:()=>void;drag?:DragProps;dragging?:boolean}){
 const [edit,setEdit]=useState(false);const [picker,setPicker]=useState(false)
 const g=useRef({x:0,y:0,active:false,moved:false,timer:0})
 const brand=brands.find(b=>b.id===p.brand_id);const color=p.color||brand?.color||'#e5e7eb'

 // Evita que el celular haga scroll mientras se arrastra
 useEffect(()=>{const h=(e:TouchEvent)=>{if(g.current.active&&e.cancelable)e.preventDefault()}
  document.addEventListener('touchmove',h,{passive:false});return()=>document.removeEventListener('touchmove',h)},[])

 const upd=async(d:Partial<Product>)=>{const {error}=await supabase.from('products').update(d).eq('id',p.id);if(error)alert(error.message);reload()}
 const del=async()=>{if(!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`))return
  const {error}=await supabase.from('products').delete().eq('id',p.id);if(error)alert(error.message);reload()}

 const activate=(el:HTMLElement,id:number)=>{const s=g.current;s.active=true;el.setPointerCapture(id);drag?.onDown()}
 const down=(e:React.PointerEvent<HTMLDivElement>)=>{
  const s=g.current,el=e.currentTarget,id=e.pointerId
  s.x=e.clientX;s.y=e.clientY;s.moved=false;s.active=false;clearTimeout(s.timer)
  s.timer=window.setTimeout(()=>{if(drag)activate(el,id);else setPicker(true)},350)}
 const move=(e:React.PointerEvent<HTMLDivElement>)=>{
  const s=g.current;const far=Math.hypot(e.clientX-s.x,e.clientY-s.y)>8
  if(!s.active){if(far){if(e.pointerType==='mouse'&&drag){clearTimeout(s.timer);activate(e.currentTarget,e.pointerId)}else clearTimeout(s.timer)}return}
  if(far)s.moved=true
  drag?.onMove(e)}
 const end=(cancel:boolean)=>()=>{
  const s=g.current;clearTimeout(s.timer)
  if(s.active){s.active=false;drag?.onUp();if(!s.moved&&!cancel)setPicker(true)}}

 if(edit)return <div className="row" style={{background:color+'33',borderLeftColor:color}}>
  <Form init={p} brands={brands} onCancel={()=>setEdit(false)} onSave={async d=>{await upd(d);setEdit(false)}}/></div>
 return <div data-id={p.id} className={'row'+(dragging?' dragging':'')} style={{background:color+'33',borderLeftColor:color}}>
  <div className="info" onPointerDown={down} onPointerMove={move} onPointerUp={end(false)} onPointerCancel={end(true)} onContextMenu={e=>e.preventDefault()}>
   {p.image_url?<img src={p.image_url} draggable={false}/>:<div className="noimg">📦</div>}
   <div className="txt"><b>{p.name}</b>{brand&&<span className="chip" style={{background:brand.color}}>{brand.name}</span>}
    <small>Sugerido: {fmt(p.suggested_price)} · Pago: {p.payment_method||'—'}</small>
    {sold&&p.sold_at&&<small>Vendido: {fmtDate(p.sold_at)}</small>}</div></div>
  <label className="real">Precio real<input key={p.real_price} inputMode="decimal" defaultValue={p.real_price??''} placeholder={String(p.suggested_price)}
   onBlur={e=>{const v=e.target.value.trim()?parsePrice(e.target.value):null;if(v!==p.real_price)upd({real_price:v})}}/></label>
  {picker&&<div className="picker">Color: <input type="color" value={color.length===7?color:'#cccccc'} onChange={e=>upd({color:e.target.value})}/><button onClick={()=>upd({color:null})}>Quitar</button><button onClick={()=>setPicker(false)}>Listo</button></div>}
  <div className="acts"><button onClick={()=>setEdit(true)}>✏️</button>{canDelete&&<button onClick={del}>✕</button>}</div>
  {sold?<Swipe red onDone={()=>upd({sold:false,sold_at:null})}/>:<Swipe onDone={()=>upd({sold:true,sold_at:new Date().toISOString(),real_price:p.real_price??p.suggested_price})}/>}
 </div>}