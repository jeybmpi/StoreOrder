import {Product} from './types'
import {fmt} from './utils'
export default function Summary({products}:{products:Product[]}){
 const sold=products.filter(p=>p.sold)
 const sug=sold.reduce((a,p)=>a+p.suggested_price,0),real=sold.reduce((a,p)=>a+(p.real_price??p.suggested_price),0)
 const pm:Record<string,number>={};sold.forEach(p=>{const k=p.payment_method||'Sin definir';pm[k]=(pm[k]||0)+1})
 const list=Object.entries(pm).sort((a,b)=>b[1]-a[1]),max=list[0]?.[1]||1
 return <section className="summary"><h2>Resumen</h2>
  <div className="cards"><div className="card"><small>Productos vendidos</small><b>{sold.length}</b><small>de {products.length}</small></div>
   <div className="card"><small>Total precio sugerido</small><b>{fmt(sug)}</b></div>
   <div className="card main"><small>Total precio real</small><b>{fmt(real)}</b><small>Diferencia: {fmt(real-sug)}</small></div></div>
  <h3>Métodos de pago más usados</h3>
  {list.map(([k,v])=><div className="bar" key={k}><span>{k}</span><div><i style={{width:v/max*100+'%'}}/></div><b>{v}</b></div>)}
  {!list.length&&<p className="empty">Aún no hay ventas</p>}</section>}
