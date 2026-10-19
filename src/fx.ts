export const fxMap=new Map<string,{kind:'sell'|'back';t:number}>()
/** Explosión de corazones rosados (venta) o cruces rojas (devolución) en la posición x,y de la pantalla */
export function burst(kind:'sell'|'back',x:number,y:number){
 const el=document.createElement('div');el.className='burst '+kind;el.style.left=x+'px';el.style.top=y+'px'
 const items=kind==='sell'?['💗','✨','🌸','💖','✨','💕','🎀']:['✖','💢','✖','💔']
 items.forEach((t,i)=>{const s=document.createElement('span');s.textContent=t
  const a=kind==='sell'?-Math.PI*(0.15+0.7*i/(items.length-1)):2*Math.PI*i/items.length
  const r=kind==='sell'?50+Math.random()*30:38
  s.style.setProperty('--dx',Math.cos(a)*r+'px');s.style.setProperty('--dy',Math.sin(a)*r+'px')
  s.style.animationDelay=i*30+'ms';el.appendChild(s)})
 document.body.appendChild(el);setTimeout(()=>el.remove(),1300)}
