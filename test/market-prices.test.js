import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isMarketDay, normalizePrices } from '../lib/market-prices.js';

test('uses dated PIHPS prices, preserves units, and skips missing publications', () => {
  const catalog = [{ id: 'com_14', name: 'Cabai Merah Keriting ', denomination: 'kg', cat_id: 'cat_7' }];
  const data = [{ name: 'Cabai Merah Keriting', level: 2, '27/11/2026': '52,500', '26/11/2026': '-', '25/11/2026': '50,500', '24/11/2026': '49,000' }];
  const [item] = normalizePrices(data, catalog, '2026-11-26', '2026-11-18');
  assert.equal(item.unit, 'kg');
  assert.equal(item.category, 'cat_7');
  assert.deepEqual(item.latest, { date: '2026-11-25', price: 50500 });
  assert.deepEqual(item.previous, { date: '2026-11-24', price: 49000 });
});

test('rejects invalid prices, dates, and rows without a reference unit', () => {
  const catalog = [{ id: 'cat_1', name: 'Beras', denomination: 'kg' }];
  const data = [
    { name: 'Beras', level: 1, '26/11/2026': '16,55', '25/11/2026': '0', '17/11/2026': '15,000' },
    { name: 'Komoditas tanpa satuan', level: 2, '26/11/2026': '9,000' }
  ];
  assert.equal(normalizePrices(data, catalog, '2026-11-26', '2026-11-18').length, 1);
  assert.equal(normalizePrices(data, catalog, '2026-11-26', '2026-11-18')[0].latest, null);
  assert.equal(isMarketDay('2026-02-30'), false);
});
