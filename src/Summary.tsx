import {Product,Unit} from './types'
import {fmt} from './utils'
export default function Summary({products,units}:{products:Product[];units:Unit[]}){
 const pm=new Map(products.map(p=>[p.id,p]));let sug=0,real=0,n=0;const pay:Record<string,number>={}
 for(const u of units){if(!u.sold)continue;const p=pm.get(u.product_id);if(!p)continue;n++
  sug+=p.suggested_price;real+=u.real_price??p.real_price??p.suggested_price
  const k=u.payment_method||p.payment_method||'Sin definir';pay[k]=(pay[k]||0)+1}
 const list=Object.entries(pay).sort((a,b)=>b[1]-a[1]),max=list[0]?.[1]||1
 return <section className="summary"><h2>Resumen</h2>
  <div className="cards"><div className="card"><small>Unidades vendidas</small><b>{n}</b><small>de {units.length} · quedan {units.length-n}</small></div>
   <div className="card"><small>Total precio sugerido</small><b>{fmt(sug)}</b></div>
   <div className="card main"><small>Total precio real</small><b>{fmt(real)}</b><small>Diferencia: {fmt(real-sug)}</small></div></div>
  <h3>Métodos de pago más usados</h3>
  {list.map(([k,v])=><div className="bar" key={k}><span>{k}</span><div><i style={{width:v/max*100+'%'}}/></div><b>{v}</b></div>)}
  {!list.length&&<p className="empty">Aún no hay ventas</p>}</section>}
