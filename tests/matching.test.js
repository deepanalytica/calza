import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreMatch,extractLocally,communeKey} from '../shared/matching.js';
const d={operation:'venta',category:'departamento',commune:'Ñuñoa',max_amount:5000,currency:'UF',min_bedrooms:2,min_bathrooms:1,min_parking:1,min_area_m2:50};
const l={operation:'venta',category:'departamento',commune:'Nunoa',amount:4800,currency:'UF',bedrooms:2,bathrooms:2,parking:1,area_m2:75};
test('coincidencia válida y explicación',()=>{const r=scoreMatch(d,l);assert.equal(r.compatible,true);assert.ok(r.score>=86);assert.ok(r.positives.includes('Cumple dormitorios'))});
test('no cruza moneda diferente sin conversión',()=>assert.ok(scoreMatch(d,{...l,currency:'CLP'}).blockers.some(x=>x.includes('Moneda'))));
test('no supera presupuestos',()=>assert.ok(scoreMatch(d,{...l,amount:5500}).blockers.includes('Supera el presupuesto')));
test('respeta requisitos obligatorios',()=>assert.equal(scoreMatch(d,{...l,parking:0}).compatible,false));
test('no mezcla comunas',()=>assert.equal(scoreMatch(d,{...l,commune:'Providencia'}).compatible,false));
test('normaliza nombres de comunas',()=>assert.equal(communeKey('San Javier de Loncomilla'),communeKey('San Javier')));
test('extractor local identifica UF y tipo',()=>{const r=extractLocally('Vendo depto 2 dormitorios, 2 baños, UF 4.850');assert.equal(r.amount,4850);assert.equal(r.bedrooms,2);assert.equal(r.category,'departamento')});
test('extractor local no inventa ubicación',()=>assert.equal(extractLocally('Busco casa $120.000.000').commune,''));

test('no confunde coma final con parte del precio',()=>{const r=extractLocally('Busco departamento en Ñuñoa, hasta UF 5.000, 2d 2b 1e');assert.equal(r.amount,5000);assert.equal(r.bedrooms,2);assert.equal(r.bathrooms,2);assert.equal(r.parking,1)});
test('extrae superficie chilena escrita con miles',()=>{const r=extractLocally('Terreno de 6.200 m², UF 16.500');assert.equal(r.area_m2,6200);assert.equal(r.amount,16500)});
