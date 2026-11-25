import assert from 'node:assert/strict';
import test from 'node:test';
import Decimal from 'decimal.js';
import { applyCommand, emptyLedger, productCost, summarize } from '../lib/ledger.js';
import { demoLedger } from '../lib/demo.js';

const date = '2026-11-26';
const at = date + 'T04:00:00Z';
const purchase = {
  supplier: 'Pemasok', receiptDate: date, fees: '0', rounding: '0', total: '25000',
  items: [{ ingredientId: 'ingredient-milk', packs: '1', size: '1000', price: '25000', discount: '0' }]
};
const write = (ledger, id, kind, fields) => applyCommand(ledger, { id, kind, fields }, at);
const closeTo = (actual, expected) => assert(new Decimal(actual).minus(expected).abs().lt('0.000001'));

function start() {
  const opening = emptyLedger('Kedai QA', 500000, at);
  const milk = write(opening, 'ingredient-milk', 'ingredient', { name: 'Susu', unit: 'ml', initial: '2000', cost: '20', minimum: '300' });
  const cups = write(milk, 'ingredient-cups', 'ingredient', { name: 'Gelas', unit: 'pcs', initial: '100', cost: '1000', minimum: '10' });
  return write(cups, 'product-milk', 'product', {
    name: 'Susu dingin', price: '12000', yield: '1', production: '0',
    recipe: [{ ingredientId: 'ingredient-milk', quantity: '200' }, { ingredientId: 'ingredient-cups', quantity: '1' }]
  });
}

test('mengikuti contoh workflow pembelian, penjualan, dan HPP historis', () => {
  const bought = write(start(), 'purchase-123', 'purchase', purchase);
  assert.equal(bought.ingredients[0].quantity, '3000');
  assert.equal(bought.ingredients[0].value, '65000');
  assert.equal(summarize(bought, date, date).cash, '475000');
  closeTo(productCost(bought, bought.products[0]), '5333.3333333333333333');
  const sold = write(bought, 'sale-12345', 'sale', { productId: 'product-milk', count: 3 });
  const summary = summarize(sold, date, date);
  assert.equal(sold.ingredients[0].quantity, '2400');
  assert.equal(sold.ingredients[1].quantity, '97');
  assert.equal(summary.sales, '36000');
  assert.equal(summary.cash, '511000');
  closeTo(summary.cogs, 16000);
  closeTo(summary.gross, 20000);
  const repriced = write(sold, 'product-update', 'product', {
    ...sold.products[0], productId: 'product-milk', price: '15000', production: '500'
  });
  assert.equal(repriced.entries.at(-1).snapshot.price, '12000');
  assert.equal(repriced.entries.at(-1).snapshot.version, 'product-milk');
  closeTo(summarize(repriced, date, date).cogs, 16000);
});

test('kiriman ulang, stok negatif, dan total salah menjaga saldo', () => {
  const initial = start();
  const bought = write(initial, 'purchase-123', 'purchase', purchase);
  assert.equal(write(bought, 'purchase-123', 'purchase', purchase), bought);
  assert.throws(() => write(initial, 'purchase-invalid', 'purchase', { ...purchase, total: '24999' }), /Total rincian/);
  const last = write(initial, 'sale-123456', 'sale', { productId: 'product-milk', count: '10' });
  assert.equal(last.ingredients[0].quantity, '0');
  assert.throws(() => write(last, 'sale-overstock', 'sale', { productId: 'product-milk', count: '1' }), /tidak mencukupi/);
  assert.equal(initial.ingredients[0].quantity, '2000');
  assert.equal(last.ingredients[1].quantity, '90');
});

test('pembalik memulihkan stok dan kas serta menahan pembelian yang sudah diikuti penggunaan', () => {
  const bought = write(start(), 'purchase-123', 'purchase', purchase);
  const undoPurchase = write(bought, 'reversal-first', 'reversal', { entryId: 'purchase-123', note: 'Data salah' });
  assert.equal(undoPurchase.ingredients[0].quantity, '2000');
  assert.equal(undoPurchase.ingredients[0].value, '40000');
  assert.equal(summarize(undoPurchase, date, date).cash, '500000');
  const sold = write(bought, 'sale-12345', 'sale', { productId: 'product-milk', count: 3 });
  assert.throws(() => write(sold, 'reversal-held', 'reversal', { entryId: 'purchase-123', note: 'Data salah' }), /pergerakan bahan/);
  const restored = write(sold, 'reversal-sale', 'reversal', { entryId: 'sale-12345', note: 'Bahan kembali', returnStock: true });
  assert.equal(restored.ingredients[0].quantity, '3000');
  closeTo(restored.ingredients[0].value, 65000);
  assert.equal(summarize(restored, date, date).sales, '0');
  assert.throws(() => write(restored, 'reversal-again', 'reversal', { entryId: 'sale-12345', note: 'Ulang' }), /sudah dibatalkan/);
});

test('pengeluaran dan pembatalan tanpa stok menjaga kas, biaya, dan kesegaran briefing', () => {
  let ledger = start();
  ledger = write(ledger, 'briefing-first', 'briefing', { day: date });
  assert.equal(ledger.briefings[date].version, ledger.dataVersion);
  ledger = write(ledger, 'briefing-other', 'briefing', { day: '2026-11-25' });
  assert.equal(ledger.briefings[date].version, ledger.dataVersion);
  ledger = write(ledger, 'expense-123', 'expense', { category: 'Sewa', note: 'Sewa harian', amount: 12000 });
  assert.notEqual(ledger.briefings[date].version, ledger.dataVersion);
  assert.equal(summarize(ledger, date, date).cogs, '0');
  assert.deepEqual(summarize(ledger, date, date).biggest, ['Sewa', '12000']);
  ledger = write(ledger, 'sale-12345', 'sale', { productId: 'product-milk', count: 1 });
  ledger = write(ledger, 'reversal-loss', 'reversal', { entryId: 'sale-12345', note: 'Bahan terpakai', returnStock: false });
  assert.equal(ledger.ingredients[0].quantity, '1800');
  assert.equal(ledger.entries.at(-1).waste, '5000');
  assert.equal(summarize(ledger, date, date).cash, '488000');
});

test('data simulasi memiliki transaksi, stok menipis, dan briefing yang konsisten', () => {
  const ledger = demoLedger();
  assert(ledger.entries.length > 10);
  const briefing = Object.values(ledger.briefings)[0];
  assert.equal(briefing.version, ledger.dataVersion);
  assert(briefing.snapshot.low.length > 0);
});
