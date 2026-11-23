// Estimación orientativa de demanda simultánea; no sustituye una medición.
const choices={cocina:{gas:0,vitro:2.4,induccion:2.2},acs:{gas:0,termo:1.5,aerotermia:1.1},ve:{no:0,lenta:2.3,medio:3.7,alto:7.4}};
function numeric(v,label,min,max){const n=Number(String(v).replace(",","."));if(v===""||v==null||!Number.isFinite(n)||n<min||n>max)throw new RangeError(label+": revisa el valor");return n}
function option(key,v){if(!Object.hasOwn(choices[key],v))throw new RangeError("Opción no válida");return choices[key][v]}
const up=x=>Math.ceil((x-1e-9)*10)/10;
export function estimate(i){
  const actualP1=numeric(i.actualP1,"Potencia punta",0.5,25);
  const actualP2=i.actualP2===""||i.actualP2==null?actualP1:numeric(i.actualP2,"Potencia valle",0.5,25);
  const personas=numeric(i.personas,"Personas",1,20),m2=numeric(i.m2,"Superficie",20,1000),motores=numeric(i.motores??0,"Motores",0,15);
  if(!Number.isInteger(personas))throw new RangeError("El número de personas debe ser entero");
  const cocina=option("cocina",i.cocina),acs=option("acs",i.acs),ve=option("ve",i.ve);
  const clima=i.clima==="no"?0:i.clima==="aire"?Math.min(3.4,.7+.012*m2):i.clima==="radiadores"?Math.min(7,.032*m2):i.clima==="aerotermia"?Math.min(4.2,.8+.012*m2):NaN;
  if(!Number.isFinite(clima)||!["normal","intenso"].includes(i.uso))throw new RangeError("Revisa las opciones");
  const base=Math.min(1.7,.2+.075*personas+.0018*m2);
  const cocinaBloque=cocina+Math.max(i.horno?1.2:0,i.micro?0.7:0);
  const fijos=motores+(i.congelador?.15:0);
  const cargas=[acs,i.lavadora?1.35:0,i.lavavajillas?1.45:0,i.secadora?1.9:0,i.piscina?.65:0].sort((a,b)=>b-a);
  const simultaneas=cargas[0]+(i.uso==="intenso"?cargas[1]*.65:0);
  const picoDia=base+cocinaBloque+clima+fijos+simultaneas;
  // En fines de semana también hay periodo valle: P2 no debe estimarse inferior al pico diurno.
  const picoValle=Math.max(picoDia,base+clima+fijos+ve+simultaneas);
  const sugeridoP1=up(Math.max(.5,picoDia*1.10));
  const sugeridoP2=up(Math.max(.5,picoValle*1.10));
  let diferenciaAnual=null;
  if(i.precioP1!==""&&i.precioP1!=null&&i.precioP2!==""&&i.precioP2!=null){
    const pp1=numeric(i.precioP1,"Precio punta",0,5),pp2=numeric(i.precioP2,"Precio valle",0,5);
    diferenciaAnual=Math.round((365*((actualP1-sugeridoP1)*pp1+(actualP2-sugeridoP2)*pp2)+Number.EPSILON)*100)/100;
  }
  return {actualP1,actualP2,sugeridoP1,sugeridoP2,picoDia:Math.round(picoDia*100)/100,picoValle:Math.round(picoValle*100)/100,diferenciaAnual,requiereEstudio:sugeridoP1>15||sugeridoP2>15,subida:sugeridoP1>actualP1||sugeridoP2>actualP2,bajada:sugeridoP1<actualP1&&sugeridoP2<actualP2,uso:i.uso};
}
