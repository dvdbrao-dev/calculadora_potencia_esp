/**
 * Motor de evaluación 2.0TD basado en datos introducidos por el usuario.
 * NO estima la potencia "óptima" sumando electrodomésticos y NO prescribe
 * cambios contractuales. Muestra evidencia histórica y simula costes.
 * El usuario debe verificar que cada máximo sea potencia demandada (kW)
 * del periodo de potencia correspondiente, no energía (kWh).
 */
export const MONTHS_REQUIRED=12;
export const TARIFF_LIMIT_KW=15;
export const REVIEW_BUFFER_KW=0.3; // Umbral orientativo de alerta; NO es margen reglamentario.

export function parseDecimal(value,{name,min=0,max=30,allowEmpty=false}={}){
  if(value===undefined||value===null||String(value).trim()===''){
    if(allowEmpty)return null;
    throw new RangeError((name||'Dato')+': valor obligatorio');
  }
  const cleaned=String(value).trim().replace(',','.');
  if(!/^\d+(?:\.\d+)?$/.test(cleaned))throw new RangeError((name||'Dato')+': utiliza un número válido');
  const number=Number(cleaned);
  if(!Number.isFinite(number)||number<min||number>max)throw new RangeError((name||'Dato')+': fuera de rango');
  return number;
}
const money2 = n => Math.round((n+Number.EPSILON)*100)/100;
const epsilon = 1e-9;

export function assessHousehold(profile){
  const flags=[];
  const cooking=profile.cooking??'gas',hotWater=profile.hotWater??'gas';
  const climate=profile.climate??'none',ev=profile.ev??'none';
  if(!['gas','vitro','induccion'].includes(cooking)||!['gas','termo','aerotermia'].includes(hotWater)
      ||!['none','aire','radiadores','aerotermia'].includes(climate)
      ||!['none','schuko','wallbox'].includes(ev))throw new RangeError('Configuración de vivienda no válida');
  if(ev!=='none')flags.push('Si cargas un vehículo eléctrico, revisa horario, límite del cargador y gestión dinámica de carga.');
  if(climate==='radiadores')flags.push('La calefacción eléctrica resistiva puede concentrar consumos elevados en invierno.');
  if(cooking!=='gas'&&hotWater!=='gas')flags.push('Cocina eléctrica y agua caliente eléctrica pueden coincidir: conviene comprobar la demanda real.');
  if(climate==='aerotermia'||hotWater==='aerotermia')flags.push('Las bombas de calor modulan su consumo y pueden tener apoyos eléctricos: la etiqueta del sistema no permite deducir un pico fiable.');
  if(profile.pool)flags.push('Bombas y motores pueden tener arranque y funcionamiento que requieran comprobación.');
  if(flags.length===0)flags.push('Los equipos declarados no permiten determinar una potencia óptima. Comprueba las máximas demandas registradas.');
  return {kind:'orientation',flags,hasPowerRecommendation:false,
    message:'Este cuestionario orienta sobre qué revisar; no calcula kW contratables ni ahorros.'};
}

/** Evalúa doce meses completos, en orden cronológico (más antiguo -> reciente). */
export function evaluate2TD(input){
  const currentP1=parseDecimal(input.currentP1,{name:'Potencia actual P1',min:0.1,max:TARIFF_LIMIT_KW});
  const currentP2=parseDecimal(input.currentP2,{name:'Potencia actual P2',min:0.1,max:TARIFF_LIMIT_KW});
  const months=input.months;
  if(!Array.isArray(months)||months.length!==MONTHS_REQUIRED){
    throw new RangeError('Hay que incluir los 12 meses del historial, aunque falten datos en algunos.');
  }
  const measured=months.map((item,index)=>{
    if(!item||typeof item!=='object')throw new RangeError('Mes '+(index+1)+': estructura inválida');
    const p1=parseDecimal(item.p1,{name:'Mes '+(index+1)+' P1',min:0.01,max:30,allowEmpty:true});
    const p2=parseDecimal(item.p2,{name:'Mes '+(index+1)+' P2',min:0.01,max:30,allowEmpty:true});
    return {p1,p2,complete:p1!==null&&p2!==null};
  });
  const complete=measured.filter(m=>m.complete).length;
  const fullMonthly=complete===MONTHS_REQUIRED;
  const annualOne=input.annualMaxP1!==undefined&&input.annualMaxP1!==null&&String(input.annualMaxP1).trim()!==''
    ||input.annualMaxP2!==undefined&&input.annualMaxP2!==null&&String(input.annualMaxP2).trim()!=='';
  let annualP1=null,annualP2=null;
  if(annualOne){
    annualP1=parseDecimal(input.annualMaxP1,{name:'Máxima anual P1',min:0.01,max:30});
    annualP2=parseDecimal(input.annualMaxP2,{name:'Máxima anual P2',min:0.01,max:30});
  }
  const annualPeriodConfirmed=input.annualPeriodConfirmed===true||input.annualPeriodConfirmed==='on';
  const fullAnnual=annualP1!==null&&annualP2!==null&&annualPeriodConfirmed;
  if(fullMonthly&&annualP1!==null){
    const p1Monthly=Math.max(...measured.map(m=>m.p1)),p2Monthly=Math.max(...measured.map(m=>m.p2));
    if(Math.abs(p1Monthly-annualP1)>.05||Math.abs(p2Monthly-annualP2)>.05){
      throw new RangeError('Las máximas del resumen anual discrepan de las máximas de la tabla mensual. Revisa ambas fuentes.');
    }
  }
  const full=fullMonthly||fullAnnual;
  const dataMode=fullMonthly?'mensual':(fullAnnual?'resumen-anual':'incompleto');
  const maxP1=fullMonthly?Math.max(...measured.map(m=>m.p1)):(fullAnnual?annualP1:null);
  const maxP2=fullMonthly?Math.max(...measured.map(m=>m.p2)):(fullAnnual?annualP2:null);
  const hasOneCandidate=input.targetP1!==undefined&&input.targetP1!==null&&String(input.targetP1).trim()!==''
    ||input.targetP2!==undefined&&input.targetP2!==null&&String(input.targetP2).trim()!=='';
  let targetP1=null,targetP2=null;
  if(hasOneCandidate){
    targetP1=parseDecimal(input.targetP1,{name:'Escenario P1',min:0.1,max:TARIFF_LIMIT_KW});
    targetP2=parseDecimal(input.targetP2,{name:'Escenario P2',min:0.1,max:TARIFF_LIMIT_KW});
  }
  const hasOnePrice=input.priceP1!==undefined&&input.priceP1!==null&&String(input.priceP1).trim()!==''
    ||input.priceP2!==undefined&&input.priceP2!==null&&String(input.priceP2).trim()!=='';
  const priceUnit=input.priceUnit??'day';
  if(!['day','year'].includes(priceUnit))throw new RangeError('Unidad de precio desconocida');
  let priceP1=null,priceP2=null;
  if(hasOnePrice){
    const priceMax=priceUnit==='day'?5:1800;
    priceP1=parseDecimal(input.priceP1,{name:'Precio potencia P1',min:0,max:priceMax});
    priceP2=parseDecimal(input.priceP2,{name:'Precio potencia P2',min:0,max:priceMax});
  }
  const source=input.source??'unknown';
  if(!['unknown','distribuidora','factura','otro'].includes(source))throw new RangeError('Origen del historial inválido');
  const cutoffs=input.cutoffs??'unknown',changes=input.changes??'unknown';
  if(!['yes','no','unknown'].includes(cutoffs)||!['yes','no','unknown'].includes(changes))throw new RangeError('Revisa las incidencias');
  const warnings=[];
  if(!full)warnings.push('Historial incompleto: '+complete+'/12 meses con máximas P1 y P2. No se puede comprobar el escenario frente a un año completo.');
  if(annualOne&&!annualPeriodConfirmed&&!fullMonthly)warnings.push('El resumen no confirma 12 meses completos. No sirve para comparar un año.');
  if(dataMode==='resumen-anual')warnings.push('La cobertura de 12 meses del resumen anual ha sido declarada por el usuario, no verificada; confirma fechas y origen.');
  if(dataMode==='resumen-anual'&&complete>0)warnings.push('Se han introducido algunas filas mensuales pero no las 12: se compara solo con el resumen anual declarado.');
  if(source==='unknown')warnings.push('Indica si los máximos proceden de la distribuidora o de las facturas; no se han verificado externamente.');
  if(source==='otro')warnings.push('Confirma que los valores sean máximas demandas por periodo expresadas en kW; las curvas de consumo en kWh no son equivalentes.');
  if(cutoffs==='yes')warnings.push('Hay cortes o actuaciones del control de potencia: requiere diagnóstico antes de modificar el contrato.');
  if(cutoffs==='unknown')warnings.push('No consta si ha habido disparos del control de potencia.');
  if(changes==='yes')warnings.push('La instalación o los hábitos han cambiado: el historial podría no representar la demanda futura.');
  if(changes==='unknown')warnings.push('No consta si han cambiado las cargas o los hábitos.');

  let scenario=null;
  if(targetP1!==null&&targetP2!==null){
    let peakCheck='sin-historial';
    let deltaP1=null,deltaP2=null;
    if(full){
      deltaP1=money2(targetP1-maxP1);
      deltaP2=money2(targetP2-maxP2);
      if(deltaP1 < -epsilon || deltaP2 < -epsilon){
        peakCheck='picos-superiores';
        warnings.push('Al menos un máximo histórico supera la potencia del escenario. Esto no demuestra que se produzca un corte, pero exige revisión técnica.');
      }else if(deltaP1 < REVIEW_BUFFER_KW-epsilon || deltaP2 < REVIEW_BUFFER_KW-epsilon){
        peakCheck='margen-estrecho';
        warnings.push('En algún periodo la distancia hasta el máximo observado es inferior a 0,3 kW; es una alerta orientativa, no un umbral legal.');
      }else{
        peakCheck='sin-superacion-observada';
        warnings.push('No aparecen picos superiores al escenario en el historial facilitado. Esto NO garantiza ausencia de cortes futuros.');
      }
    }
    let currentYear=null,scenarioYear=null,differenceYear=null;
    if(priceP1!==null&&priceP2!==null){
      const factor=priceUnit==='day'?365:1;
      currentYear=money2(factor*(currentP1*priceP1+currentP2*priceP2));
      scenarioYear=money2(factor*(targetP1*priceP1+targetP2*priceP2));
      differenceYear=money2(currentYear-scenarioYear);
    }
    scenario={targetP1,targetP2,peakCheck,deltaP1,deltaP2,
      currentYear,scenarioYear,differenceYear,
      isAutomaticRecommendation:false};
    if(targetP1>currentP1||targetP2>currentP2){
      warnings.push('El escenario aumenta potencia en algún periodo. Un aumento puede generar costes adicionales y exige revisar condiciones.');
    }
  }
  return {
    tariff:'2.0TD',currentP1,currentP2,historyMonths:complete,fullHistory:full,dataMode,
    maxP1,maxP2,source,cutoffs,changes,warnings,scenario,
    hasAutomaticRecommendation:false,
    status:!full?'datos-insuficientes':(!scenario?'historial-completo':scenario.peakCheck),
    note:'El historial ha sido introducido por el usuario y no se verifica contra la distribuidora. Ningún resultado es orden de cambio de potencia.'
  };
}
