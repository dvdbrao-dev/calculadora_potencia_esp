import {assessHousehold,evaluate2TD,MONTHS_REQUIRED} from './calculator.mjs';

const $=selector=>document.querySelector(selector);
const fmt=(n,max=2)=>new Intl.NumberFormat('es-ES',{maximumFractionDigits:max}).format(n);
const euro=n=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(Math.abs(n));
const show=(el,shown)=>{el.hidden=!shown};
const write=(selector,value)=>{$(selector).textContent=value};
const addList=(selector,items)=>{
  const root=$(selector);root.replaceChildren();
  for(const value of items){const li=document.createElement('li');li.textContent=value;root.append(li)}
};
const quickTab=$('#tab-quick'),advancedTab=$('#tab-advanced');
function switchMode(mode){
  const quick=mode==='quick';
  quickTab.classList.toggle('active',quick);
  advancedTab.classList.toggle('active',!quick);
  quickTab.setAttribute('aria-selected',String(quick));
  advancedTab.setAttribute('aria-selected',String(!quick));
  show($('#quick-pane'),quick);
  show($('#advanced-pane'),!quick);
}
quickTab.addEventListener('click',()=>switchMode('quick'));
advancedTab.addEventListener('click',()=>switchMode('advanced'));
$('#move-advanced').addEventListener('click',()=>{
  switchMode('advanced');$('#advanced-pane').scrollIntoView({behavior:'smooth',block:'start'});
});

$('#quick-form').addEventListener('submit',event=>{
  event.preventDefault();
  const data=new FormData(event.currentTarget);
  try{
    const report=assessHousehold({
      cooking:data.get('cooking'),hotWater:data.get('hotWater'),climate:data.get('climate'),
      ev:data.get('ev'),pool:data.has('pool')
    });
    addList('#quick-list',report.flags);
    show($('#quick-result'),true);
    $('#quick-result').scrollIntoView({behavior:'smooth',block:'start'});
  }catch(error){addList('#quick-list',[error.message]);show($('#quick-result'),true)}
});
$('#quick-form').addEventListener('change',()=>show($('#quick-result'),false));

// Últimos 12 meses cerrados, en el orden de antigüedad a actualidad.
const today=new Date();
const rows=$('#month-rows');
for(let i=0;i<MONTHS_REQUIRED;i++){
  const date=new Date(today.getFullYear(),today.getMonth()-MONTHS_REQUIRED+i,1);
  const month=new Intl.DateTimeFormat('es-ES',{month:'short',year:'numeric'}).format(date);
  const tr=document.createElement('tr'),heading=document.createElement('th');
  heading.scope='row';heading.textContent=month;tr.append(heading);
  for(const period of ['p1','p2']){
    const td=document.createElement('td'),label=document.createElement('label');
    label.className='sr-only';
    const id='demand-'+i+'-'+period;
    label.htmlFor=id;
    label.textContent='Máxima '+period.toUpperCase()+' de '+month;
    const input=document.createElement('input');
    input.type='text';input.inputMode='decimal';input.autocomplete='off';
    input.placeholder='Ej. 3,42';input.id=id;input.name='peak-'+i+'-'+period;
    input.setAttribute('aria-label','Máxima '+period.toUpperCase()+' de '+month+' en kW');
    input.className='peak-field';
    td.append(label,input);tr.append(td);
  }
  rows.append(tr);
}
function collectHistory(data){
  return Array.from({length:MONTHS_REQUIRED},(_,i)=>({
    p1:data.get('peak-'+i+'-p1')??'',
    p2:data.get('peak-'+i+'-p2')??''
  }));
}
function updateCoverage(){
  const data=new FormData($('#advanced-form'));
  const count=collectHistory(data).filter(m=>String(m.p1).trim()!==''&&String(m.p2).trim()!=='').length;
  write('#coverage-summary',count+'/12 meses con ambos valores introducidos. '+(count===12?'Comprueba que sean datos reales en kW.':'Los meses incompletos no se usarán para evaluar máximos anuales.'));
}

$('#advanced-form').addEventListener('input',()=>{
  show($('#advanced-error'),false);
  show($('#advanced-result'),false);
  updateCoverage();
});
$('#advanced-form').addEventListener('change',()=>{
  show($('#advanced-error'),false);
  show($('#advanced-result'),false);
  updateCoverage();
});

$('#advanced-form').addEventListener('submit',event=>{
  event.preventDefault();
  show($('#advanced-error'),false);
  show($('#advanced-result'),false);
  const data=new FormData(event.currentTarget);
  const params=Object.fromEntries(data.entries());
  params.months=collectHistory(data);
  let report;
  try{
    report=evaluate2TD(params);
  }catch(error){
    $('#advanced-error').textContent=error instanceof Error?error.message:'Revisa los datos.';
    show($('#advanced-error'),true);
    $('#advanced-error').scrollIntoView({behavior:'smooth',block:'center'});
    return;
  }
  write('#out-months',report.historyMonths+'/12');
  write('#out-max-p1',report.fullHistory?fmt(report.maxP1):'No evaluable');
  write('#out-max-p2',report.fullHistory?fmt(report.maxP2):'No evaluable');
  const scenario=report.scenario;
  const verdict=$('#out-verdict');
  verdict.className='verdict';
  if(!report.fullHistory){
    verdict.classList.add('verdict-warn');
    verdict.textContent='Faltan máximas demandas de los 12 meses completos. No se puede evaluar la seguridad del escenario frente al historial anual.';
  }else if(!scenario){
    verdict.textContent='Historial completo introducido. Has registrado máximos históricos por periodo; no se ha elegido ninguna potencia de prueba ni se recomienda un cambio automático.';
  }else if(scenario.peakCheck==='picos-superiores'){
    verdict.classList.add('verdict-danger');
    verdict.textContent='Se han introducido máximos superiores a la potencia que quieres simular. El escenario requiere revisión: no garantiza continuidad del suministro.';
  }else if(scenario.peakCheck==='margen-estrecho'){
    verdict.classList.add('verdict-warn');
    verdict.textContent='El escenario está cerca de algún máximo observado (menos de 0,3 kW de separación). Esta alerta es orientativa, no normativa.';
  }else{
    verdict.classList.add('verdict-soft');
    verdict.textContent='Los máximos introducidos no superan la potencia simulada. No equivale a una recomendación: sigue siendo necesario revisar incidencias, cargas y condiciones del contrato.';
  }
  if(scenario?.differenceYear===null || scenario===null){
    write('#out-cost','Sin calcular');
    write('#out-cost-detail','Faltan potencias de prueba o ambos precios');
  }else{
    write('#out-cost',(scenario.differenceYear>0?'+':'')+euro(scenario.differenceYear)+(scenario.differenceYear>=0?' menos':' de coste adicional')+'/año');
    write('#out-cost-detail','Solo término fijo, antes de impuestos y trámites');
  }
  if(scenario){
    const deltas=report.fullHistory
      ? ' Frente a las máximas introducidas: P1 '+fmt(scenario.deltaP1)+' kW y P2 '+fmt(scenario.deltaP2)+' kW de diferencia.'
      : ' Sin 12 meses completos no podemos contrastar estas potencias con todos los máximos del año.';
    write('#out-sim-data','Contrato actual: P1 '+fmt(report.currentP1)+' y P2 '+fmt(report.currentP2)+' kW. Escenario elegido: P1 '+fmt(scenario.targetP1)+' y P2 '+fmt(scenario.targetP2)+' kW.'+deltas);
    if(scenario.differenceYear!==null){
      const p=scenario.differenceYear;
      write('#out-cost-data','Término fijo anual actual: '+euro(scenario.currentYear)+'. Escenario: '+euro(scenario.scenarioYear)+'. Diferencia: '+(p>0?'reducción de ':p<0?'incremento de ':'sin diferencia, ')+euro(p)+'. Impuestos y trámites no incluidos.');
    }else write('#out-cost-data','No se ha calculado el coste: introduce los dos precios de potencia de tu factura.');
    show($('#out-simulation'),true);
  }else show($('#out-simulation'),false);
  const warn=report.warnings.length?report.warnings:['Aunque el historial esté completo, revisa la instalación y el uso real antes de tramitar cambios.'];
  addList('#out-warnings',warn);
  const message='Hola, he probado el simulador 2.0TD de Mejoradora Granada. Mis potencias actuales son P1 '+fmt(report.currentP1)+' kW y P2 '+fmt(report.currentP2)+' kW. '
    +(report.fullHistory?'Mis máximas introducidas son P1 '+fmt(report.maxP1)+' kW y P2 '+fmt(report.maxP2)+' kW. ':'No tengo completo el historial anual. ')
    +(scenario?'Quiero revisar un escenario P1 '+fmt(scenario.targetP1)+' kW y P2 '+fmt(scenario.targetP2)+' kW. ':'')
    +'Quiero que comprobéis mi factura y los datos reales antes de decidir.';
  $('#result-whatsapp').href='https://wa.me/34613685560?text='+encodeURIComponent(message);
  show($('#advanced-result'),true);
  $('#advanced-result').scrollIntoView({behavior:'smooth',block:'start'});
});
updateCoverage();
