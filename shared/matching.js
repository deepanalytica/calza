/** Comparación determinista; nunca se atribuyen coincidencias a IA. */
export const categories = ['departamento', 'casa', 'terreno', 'local', 'oficina', 'bodega', 'otro'];
export const operations = ['venta', 'arriendo'];
export const currencies = ['UF', 'CLP'];

export function norm(text = '') {
  return String(text).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/\b(comuna de|comuna|sector|de la|de el)\b/g, '')
    .replace(/[^a-z0-9]+/g, ' ').trim();
}
const communeAliases = new Map([
  ['santiago centro','santiago'], ['stgo centro','santiago'],
  ['v del mar','vina del mar'], ['vina','vina del mar'],
  ['sanjavier','san javier'], ['san javier de loncomilla','san javier']
]);
export function communeKey(text) {
  const n = norm(text);
  return communeAliases.get(n) || n;
}

/** Evita comparar monedas distintas sin tipo de cambio verificable. */
export function scoreMatch(demand, listing) {
  const blockers = [];
  if (demand.operation !== listing.operation) blockers.push('Operación diferente');
  if (demand.category !== listing.category) blockers.push('Tipo de inmueble diferente');
  if (communeKey(demand.commune) !== communeKey(listing.commune)) blockers.push('Comuna diferente');
  if (demand.currency !== listing.currency) blockers.push('Moneda distinta; conversión pendiente');
  if (Number(listing.amount) > Number(demand.max_amount) && demand.currency === listing.currency) blockers.push('Supera el presupuesto');
  if (Number(listing.bedrooms) < Number(demand.min_bedrooms)) blockers.push('Faltan dormitorios');
  if (Number(listing.bathrooms) < Number(demand.min_bathrooms)) blockers.push('Faltan baños');
  if (Number(listing.parking) < Number(demand.min_parking)) blockers.push('Faltan estacionamientos');
  if (Number(listing.area_m2) < Number(demand.min_area_m2)) blockers.push('Superficie insuficiente');
  if (blockers.length) return {compatible:false,score:0,blockers,positives:[]};
  const positives = [
    'Operación y tipo correctos', 'Comuna solicitada', 'Dentro del presupuesto'
  ];
  if (Number(demand.min_bedrooms)) positives.push('Cumple dormitorios');
  if (Number(demand.min_bathrooms)) positives.push('Cumple baños');
  if (Number(demand.min_parking)) positives.push('Cumple estacionamientos');
  if (Number(demand.min_area_m2)) positives.push('Cumple superficie');
  const budgetRatio = Math.max(0,Math.min(1, Number(listing.amount)/Number(demand.max_amount)));
  const score = Math.round(86 + (1-budgetRatio)*14);
  return {compatible:true,score,blockers:[],positives};
}

/** Extracción local aproximada: el usuario confirma campos antes de guardar. */
export function extractLocally(raw) {
  const txt = String(raw).slice(0,4000), low = norm(txt);
  const category = categories.find(t=>new RegExp(`\\b${t}s?\\b`).test(low)) ||
    (/depto|dpto|dptos/.test(low) ? 'departamento' : (/parcela/.test(low)?'terreno':'otro'));
  const operation = /arriendo|arrendar|alquiler|renta mensual/.test(low) ? 'arriendo' : 'venta';
  // No se adivina comuna: sin diccionario de comunas completo.
  const currencyMatch = txt.match(/\bUF\s*([\d.,]+)/i) || txt.match(/\$\s*([\d.,]+)/);
  let amount=0,currency='UF';
  if(currencyMatch){
    currency=/^\s*UF/i.test(currencyMatch[0])?'UF':'CLP';
    const compact=currencyMatch[1].replace(/\s/g,'');
    const cleaned = compact.includes(',') && compact.includes('.')
      ? compact.replace(/\./g,'').replace(',','.')
      : (/^\d{1,3}(\.\d{3})+$/.test(compact)?compact.replace(/\./g,''):compact.replace(',','.'));
    amount = Number(cleaned) || 0;
  }
  const bed=txt.match(/(\d+)\s*(?:dormitorios?|habitaciones?|dorm\b)/i);
  const bath=txt.match(/(\d+)\s*(?:baños?|banos?)/i);
  const park=txt.match(/(\d+)\s*(?:estacionamientos?|parking)/i);
  const area=txt.match(/([\d.,]+)\s*m[²2]\b/i);
  return { title:txt.replace(/\s+/g,' ').slice(0,100),operation,category,commune:'',amount,
    currency,bedrooms:bed?Number(bed[1]):0,bathrooms:bath?Number(bath[1]):0,
    parking:park?Number(park[1]):0,area_m2:area?Number(area[1].replace(',','.')):0,
    description:txt,notes:txt,max_amount:amount,min_bedrooms:bed?Number(bed[1]):0,
    min_bathrooms:bath?Number(bath[1]):0,min_parking:park?Number(park[1]):0,
    min_area_m2:area?Number(area[1].replace(',','.')):0};
}
