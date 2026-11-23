import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.mjs',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../styles.css',import.meta.url),'utf8');

test('la interfaz referencia todos los elementos accesibles por ID desde la lógica',()=>{
  const ids=new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]));
  const selectors=new Set([...app.matchAll(/['"]#([A-Za-z][\w-]*)['"]/g)].map(x=>x[1]));
  for(const id of selectors)assert.ok(ids.has(id),'Falta ID '+id+' usado en app.mjs');
});
test('sin controles heredados ni cálculo directo de potencia doméstica',()=>{
 assert.ok(!html.includes('Tu Potencia Ideal Recomendada'));
 assert.ok(!app.includes('sugeridoP1'));
 assert.ok(!html.includes('Ahorro Estimado'));
});
test('los dos modos existen y las máximas no son kWh',()=>{
 for(const str of ['id="quick-form"','id="advanced-form"','id="month-rows"','name="currentP1"','name="currentP2"','name="targetP1"','name="targetP2"','Máxima P1','Máxima P2']){
  assert.ok(html.includes(str),'No se encontró '+str);
 }
 assert.ok(html.includes('No introduzcas consumos mensuales (kWh)'));
});
test('se cargan los ficheros estáticos correctos',()=>{
 assert.ok(html.includes('src="/app.mjs"'));
 assert.ok(html.includes('href="/styles.css"'));
 assert.ok(app.includes("from './calculator.mjs'"));
 assert.ok(css.includes('.mode-tab'));
});
