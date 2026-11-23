import test from "node:test";
import assert from "node:assert/strict";
import {estimate} from "../calculator.mjs";
const x={actualP1:5.75,actualP2:"",personas:3,m2:90,motores:0,cocina:"induccion",acs:"termo",ve:"no",clima:"aire",uso:"normal",horno:true,micro:true,lavadora:true,lavavajillas:true,secadora:false,congelador:false,piscina:false,precioP1:"",precioP2:""};
test("la recomendación en valle contempla los fines de semana",()=>{const r=estimate(x);assert.ok(r.sugeridoP2>=r.sugeridoP1);assert.equal(r.actualP2,5.75);assert.equal(r.diferenciaAnual,null)});
test("vehículo eléctrico aumenta la estimación valle",()=>{assert.ok(estimate({...x,ve:"alto"}).sugeridoP2>estimate(x).sugeridoP2)});
test("simultaneidad mayor no reduce la estimación",()=>{assert.ok(estimate({...x,uso:"intenso"}).sugeridoP1>=estimate(x).sugeridoP1)});
test("ahorro anual procede exclusivamente de los precios introducidos",()=>{const r=estimate({...x,actualP1:14,actualP2:14,precioP1:.09,precioP2:.01});const e=Math.round(365*((14-r.sugeridoP1)*.09+(14-r.sugeridoP2)*.01)*100)/100;assert.equal(r.diferenciaAnual,e)});
test("rechaza valores inválidos",()=>{assert.throws(()=>estimate({...x,personas:-1}),RangeError)});
