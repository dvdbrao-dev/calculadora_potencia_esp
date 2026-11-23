import test from 'node:test';
import assert from 'node:assert/strict';
import {assessHousehold,evaluate2TD,parseDecimal} from '../calculator.mjs';

const months=Array.from({length:12},(_,i)=>({p1:2.8+i*0.1,p2:3.4+i*0.1}));
const base={currentP1:'5,75',currentP2:'4,60',months,source:'distribuidora',cutoffs:'no',changes:'no',targetP1:'4,5',targetP2:'5,0',priceUnit:'day',priceP1:'0,09',priceP2:'0,01'};
const report=changes=>evaluate2TD({...base,...changes});
test('modo rápido nunca sugiere una potencia contractual exacta',()=>{
 const x=assessHousehold({cooking:'induccion',hotWater:'termo',climate:'aire',ev:'wallbox'});
 assert.equal(x.hasPowerRecommendation,false);
 assert.equal(Object.hasOwn(x,'powerKW'),false);
 assert.ok(x.flags.some(m=>m.includes('gestión dinámica')));
});
test('no es posible inferir potencias a partir de electrodomésticos',()=>{
 const x=assessHousehold({cooking:'gas',hotWater:'gas',climate:'none',ev:'none'});
 assert.equal(x.hasPowerRecommendation,false);
 assert.equal(x.flags.length,1);
});
test('datos con coma decimal',()=>assert.equal(parseDecimal('4,25',{name:'Potencia'}),4.25));
test('decimales inválidos se rechazan',()=>assert.throws(()=>parseDecimal('3,1,2',{name:'Potencia'}),RangeError));
test('12 máximos mensuales independientes P1/P2 sin forzar valle mayor',()=>{
 const r=report({targetP1:'5',targetP2:'4'});
 assert.equal(r.fullHistory,true);assert.equal(r.historyMonths,12);
 assert.ok(Math.abs(r.maxP1-3.9)<1e-9);assert.ok(Math.abs(r.maxP2-4.5)<1e-9);
 assert.equal(r.currentP1,5.75);assert.equal(r.currentP2,4.6);
 assert.equal(r.scenario.targetP1,5);assert.equal(r.scenario.targetP2,4);
});
test('con 11 meses completos nunca se da por completo el historial anual',()=>{
 const partial=months.map(m=>({...m}));partial[0].p2='';
 const r=report({months:partial});
 assert.equal(r.fullHistory,false);assert.equal(r.historyMonths,11);
 assert.equal(r.maxP1,null);assert.equal(r.maxP2,null);
 assert.equal(r.scenario.peakCheck,'sin-historial');
 assert.equal(r.hasAutomaticRecommendation,false);
});
test('un mes medio cumplimentado no se considera mes válido',()=>{
 const partial=months.map(m=>({...m}));partial[5].p1='';
 assert.equal(report({months:partial}).historyMonths,11);
});
test('escenario con máximos históricos superiores: aviso obligatorio',()=>{
 const r=report({targetP1:3.8,targetP2:4.3});
 assert.equal(r.scenario.peakCheck,'picos-superiores');
 assert.ok(r.warnings.some(w=>w.includes('máximo histórico')));
});
test('margen inferior a 0,3 kW es aviso heurístico, no límite legal',()=>{
 const r=report({targetP1:4,targetP2:4.8});
 assert.equal(r.scenario.peakCheck,'margen-estrecho');
 assert.ok(r.warnings.some(w=>w.includes('orientativa')));
});
test('escenario por encima de máximos no es una recomendación',()=>{
 const r=report({targetP1:5,targetP2:5});
 assert.equal(r.scenario.peakCheck,'sin-superacion-observada');
 assert.equal(r.scenario.isAutomaticRecommendation,false);
});
test('contrato P2 menor que P1 permitido en 2.0TD',()=>{
 assert.equal(report({currentP1:'9',currentP2:'2'}).currentP2,2);
});
test('precio diario calcula término fijo de 365 días sin impuestos',()=>{
 const r=report({});
 const current=365*(5.75*.09+4.6*.01);
 const wanted=365*(4.5*.09+5*.01);
 assert.equal(r.scenario.currentYear,Math.round(current*100)/100);
 assert.equal(r.scenario.scenarioYear,Math.round(wanted*100)/100);
 assert.equal(r.scenario.differenceYear,Math.round((Math.round(current*100)/100-Math.round(wanted*100)/100)*100)/100);
});
test('precio anual se calcula sin factor de 365',()=>{
 const r=report({priceUnit:'year',priceP1:'42',priceP2:'2'});
 assert.equal(r.scenario.currentYear,250.7);
 assert.equal(r.scenario.scenarioYear,199);
 assert.equal(r.scenario.differenceYear,51.7);
});
test('no se inventa ahorro si falta un precio',()=>{
 assert.equal(report({priceP1:'',priceP2:''}).scenario.differenceYear,null);
 assert.throws(()=>report({priceP1:'0.08',priceP2:''}),RangeError);
});
test('no se calcula ahorro si falta potencia simulada',()=>{
 const r=report({targetP1:'',targetP2:''});
 assert.equal(r.scenario,null);
 assert.throws(()=>report({targetP1:'4',targetP2:''}),RangeError);
});
test('bloquea potencias fuera de alcance de tarifa 2.0TD',()=>{
 assert.throws(()=>report({currentP1:15.1}),RangeError);
 assert.throws(()=>report({targetP2:15.1}),RangeError);
});
test('máximos mensuales fuera de rango no se silencian',()=>{
 const bad=months.map(m=>({...m}));bad[1].p2='abc';
 assert.throws(()=>report({months:bad}),RangeError);
});
test('cortes y cambio de instalación se reflejan en advertencias',()=>{
 const r=report({cutoffs:'yes',changes:'yes'});
 assert.ok(r.warnings.some(w=>w.includes('cortes')));
 assert.ok(r.warnings.some(w=>w.includes('cambiado')));
});
test('12 meses con datos introducidos siguen sin verificación externa',()=>{
 const r=report({source:'unknown'});
 assert.ok(r.warnings.some(w=>w.includes('no se han verificado')));
 assert.equal(r.hasAutomaticRecommendation,false);
});
