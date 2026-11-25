import { applyCommand, dayOffset, emptyLedger, jakartaDay } from './ledger.js';

export function demoLedger() {
  const today = jakartaDay();
  const at = (offset, hour = 9) => dayOffset(today, offset) + 'T' + String(hour).padStart(2, '0') + ':15:00+07:00';
  let ledger = emptyLedger('Kedai Nusa', '2350000', at(-8));
  const add = (id, kind, fields, date = at(-8)) => {
    ledger = applyCommand(ledger, { id, kind, fields }, date);
  };
  const beans = 'demo-beans';
  const milk = 'demo-milk';
  const cups = 'demo-cups';
  const syrup = 'demo-syrup';
  for (const [id, name, unit, initial, cost, minimum] of [
    [beans, 'Biji kopi Arabika', 'g', 2700, 145, 1200],
    [milk, 'Susu full cream', 'ml', 18400, 22, 2500],
    [cups, 'Gelas 16 oz', 'pcs', 240, 900, 30],
    [syrup, 'Sirup gula aren', 'ml', 3000, 30, 500]
  ]) add(id, 'ingredient', { name, unit, initial, cost, minimum });
  for (const [id, name, price, recipe] of [
    ['demo-aren', 'Es kopi susu gula aren', 24000, [[beans, 18], [milk, 120], [cups, 1], [syrup, 22]]],
    ['demo-latte', 'Iced latte', 27000, [[beans, 18], [milk, 155], [cups, 1]]],
    ['demo-amer', 'Iced americano', 19000, [[beans, 18], [cups, 1]]]
  ]) add(id, 'product', { name, price, recipe: recipe.map(([ingredientId, quantity]) => ({ ingredientId, quantity })), yield: 1, production: 0 });
  for (const [index, count] of [9, 15, 10, 22, 16, 25, 23].entries()) {
    const offset = index - 6;
    if (offset === -2) add('demo-beli-02', 'purchase', {
      supplier: 'Pasar Kemasan', receiptDate: dayOffset(today, offset), total: 113000, fees: 0, rounding: 0,
      items: [{ ingredientId: cups, packs: 2, size: 50, price: 56500, discount: 0 }]
    }, at(offset, 8));
    if (offset === 0) add('demo-beli-01', 'purchase', {
      supplier: 'Toko Bahan Kopi', receiptDate: today, total: 112000, fees: 0, rounding: 0,
      items: [{ ingredientId: milk, packs: 4, size: 1000, price: 28000, discount: 0 }]
    }, at(offset, 8));
    add('demo-harian-' + index, 'sale', { productId: 'demo-aren', count }, at(offset));
    if ([1, 3, 5].includes(index)) add('demo-latte-' + index, 'sale', { productId: 'demo-latte', count: 4 }, at(offset, 11));
  }
  add('demo-biaya-01', 'expense', { category: 'Utilitas', amount: 85000, note: 'Listrik kedai' }, at(0, 10));
  add('demo-briefing', 'briefing', { day: today }, at(0, 11));
  return ledger;
}
