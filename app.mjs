import {estimate} from "./calculator.mjs";
const form=document.querySelector("#form");
const result=document.querySelector("#resultado");
const error=document.querySelector("#error");
const write=(id,s)=>document.getElementById(id).textContent=s;
const fmt=(n)=>new Intl.NumberFormat("es-ES",{minimumFractionDigits:1,maximumFractionDigits:2}).format(n);
const euros=(n)=>new Intl.NumberFormat("es-ES",{style:"currency",currency:"EUR",maximumFractionDigits:2}).format(Math.abs(n));
form.addEventListener("submit",event=>{
  event.preventDefault();
  error.hidden=true;
  if(!form.reportValidity())return;
  const fd=new FormData(form);
  const values=Object.fromEntries(fd.entries());
  for(const key of ["horno","micro","lavadora","lavavajillas","secadora","congelador","piscina"])values[key]=fd.has(key);
  let r;
  try{r=estimate(values)}catch(ex){
    error.textContent=ex instanceof Error?ex.message:"Revisa los datos";
    error.hidden=false;
    error.scrollIntoView({behavior:"smooth",block:"center"});
    return;
  }
  write("p1",fmt(r.sugeridoP1));
  write("p2",fmt(r.sugeridoP2));
  write("actual",fmt(r.actualP1)+" / "+fmt(r.actualP2)+" kW");
  if(r.diferenciaAnual===null){
    write("dinero","Sin calcular");
    write("dinero-desc","Introduce ambos precios P1 y P2 de tu factura para estimar el coste.");
  }else if(r.diferenciaAnual>0){
    write("dinero","+"+euros(r.diferenciaAnual)+"/año");
    write("dinero-desc","Posible reducción del término fijo, sin impuestos ni costes de cambio.");
  }else if(r.diferenciaAnual<0){
    write("dinero","−"+euros(r.diferenciaAnual)+"/año");
    write("dinero-desc","Posible incremento del término fijo si se aplica la potencia simulada.");
  }else{
    write("dinero","0 €/año");
    write("dinero-desc","Sin diferencia estimada en el término fijo.");
  }
  const aviso=document.querySelector("#aviso");
  aviso.className="notice";
  if(r.requiereEstudio){
    aviso.classList.add("warning");
    aviso.textContent="El resultado supera 15 kW en algún periodo. Necesitas un estudio técnico específico y revisar el peaje de acceso.";
  }else if(r.subida){
    aviso.classList.add("warning");
    aviso.textContent="La simulación supera la potencia contratada en algún periodo. No supone que debas aumentarla automáticamente: revisa tu demanda real y los cortes que hayas podido sufrir.";
  }else if(r.bajada){
    aviso.classList.add("positive");
    aviso.textContent="La estimación queda por debajo de lo contratado. Podría merecer la pena comprobar máximas demandas antes de pedir una reducción.";
  }else{
    aviso.textContent="La potencia estimada es parecida a la contratada o inferior en algún periodo. Revisa tus máximas demandas antes de hacer cambios.";
  }
  write("explicacion","Demanda simultánea calculada: aproximadamente "+fmt(r.picoDia)+" kW en la hipótesis de punta y "+fmt(r.picoValle)+" kW en valle. Se ha añadido un margen de seguridad del 10 % y redondeado hacia arriba a décimas. "+(r.uso==="intenso"?"Has seleccionado alta simultaneidad de equipos.":"Has seleccionado simultaneidad habitual."));
  const msg="Hola, he utilizado la calculadora de Mejoradora Granada. Tengo contratados P1 "+fmt(r.actualP1)+" kW y P2 "+fmt(r.actualP2)+" kW. La estimación obtenida es P1 "+fmt(r.sugeridoP1)+" kW y P2 "+fmt(r.sugeridoP2)+" kW. ¿Podéis revisar mi factura y decirme si tiene sentido ajustar la potencia?";
  document.querySelector("#whatsapp").href="https://wa.me/34613685560?text="+encodeURIComponent(msg);
  result.hidden=false;
  result.scrollIntoView({behavior:"smooth",block:"start"});
});
form.addEventListener("input",()=>error.hidden=true);
document.querySelector("#editar").addEventListener("click",()=>document.querySelector("#calculadora").scrollIntoView({behavior:"smooth",block:"start"}));
