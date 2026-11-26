import { dayOffset, jakartaDay } from './ledger.js';

const base = 'https://www.bi.go.id/hargapangan/WebSite/TabelHarga/';
export const marketSource = {
  name: 'PIHPS Nasional · Bank Indonesia',
  url: 'https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalDaerah'
};
const nationwide = { id: 'national', name: 'Nasional' };
const referenceLifetime = 6 * 60 * 60 * 1000;
let references;

async function sourceRows(path, params) {
  const url = new URL(path, base);
  if (params) url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8500) });
  if (!response.ok) throw new Error('PIHPS unavailable');
  const payload = await response.json();
  if (!Array.isArray(payload.data)) throw new Error('Invalid PIHPS response');
  return payload.data;
}

async function getReferences() {
  if (references && references.expires > Date.now()) return references.result;
  const result = Promise.all([sourceRows('GetRefProvince'), sourceRows('GetRefCommodityAndCategory')]).then(([provinces, commodities]) => ({
    regions: [nationwide, ...provinces.filter(item => Number.isInteger(item.id) && typeof item.name === 'string')
      .map(item => ({ id: String(item.id), name: item.name }))],
    commodities
  })).catch(error => {
    if (references?.result === result) references = undefined;
    throw error;
  });
  references = { result, expires: Date.now() + referenceLifetime };
  return result;
}

export function isMarketDay(day) {
  if (typeof day !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const value = new Date(day + 'T12:00:00Z');
  return !Number.isNaN(value.getTime()) && value.toISOString().slice(0, 10) === day;
}

function sourceDay(key) {
  const parts = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(key);
  return parts ? parts[3] + '-' + parts[2] + '-' + parts[1] : '';
}

function sourcePrice(value) {
  if (typeof value === 'string' && !/^(?:\d+|\d{1,3}(?:,\d{3})+)$/.test(value.trim())) return null;
  const price = typeof value === 'string' ? Number(value.trim().replaceAll(',', '')) : value;
  return Number.isSafeInteger(price) && price > 0 ? price : null;
}

export function normalizePrices(rows, commodities, requestedDate, earliestDay) {
  const catalog = new Map(commodities.filter(item => typeof item.name === 'string' && item.denomination)
    .map(item => [item.name.trim(), item]));
  return rows.flatMap(row => {
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    const commodity = catalog.get(name);
    if (!commodity || ![1, 2].includes(row.level)) return [];
    const points = Object.entries(row).flatMap(([key, record]) => {
      const date = sourceDay(key);
      const price = sourcePrice(record);
      return isMarketDay(date) && date >= earliestDay && date <= requestedDate && price !== null ? [{ date, price }] : [];
    }).sort((first, second) => second.date.localeCompare(first.date));
    return [{
      id: commodity.id, name, unit: commodity.denomination, category: commodity.cat_id || null,
      latest: points[0] || null, previous: points[1] || null
    }];
  });
}

export async function marketPrices(regionId = nationwide.id, requestedDate = jakartaDay()) {
  const today = jakartaDay();
  if (!isMarketDay(requestedDate) || requestedDate > today || requestedDate < dayOffset(today, -365) ||
      (regionId !== nationwide.id && !/^\d{1,3}$/.test(regionId))) return null;
  const { regions, commodities } = await getReferences();
  const region = regions.find(item => item.id === regionId);
  if (!region) return null;
  const earliestDay = dayOffset(requestedDate, -8);
  const rows = await sourceRows('GetGridDataDaerah', {
    price_type_id: '1', tipe_laporan: '1', province_id: regionId === nationwide.id ? '' : regionId,
    comcat_id: '', regency_id: '', market_id: '', start_date: earliestDay, end_date: requestedDate
  });
  return {
    region, regions, requestedDate, source: marketSource, fetchedAt: new Date().toISOString(),
    items: normalizePrices(rows, commodities, requestedDate, earliestDay)
  };
}
