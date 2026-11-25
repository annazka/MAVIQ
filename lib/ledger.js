import Decimal from 'decimal.js';

const D = Decimal.clone({ precision: 32 });
export const units = ['g', 'ml', 'pcs'];
export const types = { sale: 'Penjualan', purchase: 'Pembelian', expense: 'Pengeluaran', adjustment: 'Penyesuaian', reversal: 'Pembatalan' };
const sum = values => values.reduce((total, value) => total.plus(value), new D(0));
const quantity = ingredient => new D(ingredient.quantity);
const value = ingredient => new D(ingredient.value);
export const unitCost = ingredient => quantity(ingredient).gt(0) ? value(ingredient).div(quantity(ingredient)) : new D(0);
const read = (input, label, minimum = 0) => {
  const raw = String(input ?? '').trim();
  if (!/^-?\d{1,12}(\.\d{1,6})?$/.test(raw) || new D(raw).lt(minimum)) throw new Error(label + ' tidak valid.');
  return new D(raw);
};
const text = (input, label) => {
  const clean = String(input ?? '').trim();
  if (!clean || clean.length > 160) throw new Error(label + ' wajib diisi dan maksimal 160 karakter.');
  return clean;
};
const dateValue = (input, label) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input || '')) throw new Error(label + ' tidak valid.');
  const parsed = new Date(input + 'T12:00:00Z');
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== input) throw new Error(label + ' tidak valid.');
  return input;
};
const positive = (input, label) => read(input, label, 0.000001);
const find = (rows, id, label) => {
  const row = rows.find(item => item.id === id);
  if (!row) throw new Error(label + ' tidak ditemukan.');
  return row;
};
const movement = (ingredient, change, cost) => ({ ingredientId: ingredient.id, quantity: change.toString(), value: cost.toString() });
export const jakartaDay = (date = new Date()) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Jakarta' }).format(date);
export const dayOffset = (day, offset) => new Date(Date.parse(day + 'T12:00:00Z') + offset * 86400000).toISOString().slice(0, 10);

export function emptyLedger(name, cash, createdAt = new Date().toISOString()) {
  return {
    name: text(name, 'Nama usaha'), openingCash: read(cash, 'Saldo awal').round().toString(), createdAt,
    ingredients: [], products: [], entries: [], briefings: {}, commands: [], dataVersion: 0
  };
}

export function productCost(ledger, product) {
  return sum(product.recipe.map(item => unitCost(find(ledger.ingredients, item.ingredientId, 'Bahan')).mul(item.quantity)))
    .div(product.yield).plus(product.production);
}

function applyMovements(ledger, movements) {
  for (const item of movements) {
    const ingredient = find(ledger.ingredients, item.ingredientId, 'Bahan');
    const nextQuantity = quantity(ingredient).plus(item.quantity);
    const nextValue = value(ingredient).plus(item.value);
    if (nextQuantity.lt(0) || (nextQuantity.gt(0) && nextValue.lt(0))) throw new Error('Stok ' + ingredient.name + ' tidak mencukupi.');
    ingredient.quantity = nextQuantity.toString();
    ingredient.value = nextQuantity.isZero() ? '0' : nextValue.toString();
  }
}

function purchase(ledger, fields) {
  if (!Array.isArray(fields.items) || !fields.items.length || fields.items.length > 40) throw new Error('Isi hingga 40 rincian pembelian.');
  const supplier = text(fields.supplier, 'Toko atau pemasok');
  const receiptDate = dateValue(fields.receiptDate, 'Tanggal struk');
  const existing = ledger.entries.find(entry => entry.type === 'purchase' && fields.receiptHash && entry.receiptHash === fields.receiptHash && !entry.cancelled);
  if (existing && !fields.acceptDuplicate) throw new Error('Struk ini pernah dibukukan. Centang konfirmasi duplikat jika pembelian ini berbeda.');
  const lines = fields.items.map(item => {
    const ingredient = find(ledger.ingredients, item.ingredientId, 'Bahan');
    const packs = positive(item.packs, 'Jumlah kemasan');
    const size = positive(item.size, 'Isi per kemasan');
    const price = read(item.price, 'Harga per kemasan');
    const discount = read(item.discount, 'Diskon');
    const net = packs.mul(price).minus(discount);
    if (net.lt(0)) throw new Error('Diskon melebihi harga bahan.');
    return { ingredient, amount: packs.mul(size), net };
  });
  const subtotal = sum(lines.map(line => line.net));
  const fees = read(fields.fees, 'Biaya tambahan');
  const rounding = read(fields.rounding, 'Penyesuaian pembulatan', -1000000);
  const total = read(fields.total, 'Total dibayar');
  if (!subtotal.plus(fees).plus(rounding).eq(total)) throw new Error('Total rincian, biaya tambahan, dan pembulatan harus sama dengan total dibayar.');
  const allocation = fees.plus(rounding);
  if (subtotal.isZero() && !allocation.isZero()) throw new Error('Alokasi membutuhkan nilai rincian di atas nol.');
  let remaining = allocation;
  const movements = lines.map(({ ingredient, amount, net }, index) => {
    const share = subtotal.isZero() ? new D(0) : index === lines.length - 1 ? remaining : allocation.mul(net).div(subtotal);
    remaining = remaining.minus(share);
    const acquisitionCost = net.plus(share);
    if (acquisitionCost.lt(0)) throw new Error('Biaya perolehan bahan harus minimal nol.');
    return movement(ingredient, amount, acquisitionCost);
  });
  return {
    label: supplier, cash: total.neg().toString(), movements, receiptDate,
    receiptPath: fields.receiptPath || null, receiptHash: fields.receiptHash || null,
    details: fields.items.map(item => ({ ...item }))
  };
}

function sale(ledger, fields) {
  const product = find(ledger.products, fields.productId, 'Produk');
  const count = positive(fields.count, 'Jumlah porsi');
  if (!count.isInteger()) throw new Error('Jumlah porsi harus berupa bilangan bulat.');
  const movements = product.recipe.map(item => {
    const ingredient = find(ledger.ingredients, item.ingredientId, 'Bahan');
    const used = new D(item.quantity).div(product.yield).mul(count);
    return movement(ingredient, used.neg(), used.mul(unitCost(ingredient)).neg());
  });
  const cash = count.mul(product.price);
  return {
    label: product.name, cash: cash.toString(), revenue: cash.toString(),
    cogs: productCost(ledger, product).mul(count).toString(), movements, count: count.toString(),
    snapshot: { productId: product.id, version: product.version, price: product.price, production: product.production, recipe: structuredClone(product.recipe), yield: product.yield }
  };
}

function adjustment(ledger, fields) {
  const ingredient = find(ledger.ingredients, fields.ingredientId, 'Bahan');
  const delta = read(fields.delta, 'Selisih stok', -999999999999);
  if (delta.isZero()) throw new Error('Selisih stok harus berbeda dari nol.');
  const cost = delta.gt(0) ? read(fields.cost, 'Biaya per satuan') : unitCost(ingredient);
  return { label: ingredient.name, note: text(fields.note, 'Alasan'), movements: [movement(ingredient, delta, delta.mul(cost))] };
}

function reverse(ledger, fields) {
  const origin = find(ledger.entries, fields.entryId, 'Transaksi');
  if (origin.cancelled || !['sale', 'purchase', 'expense'].includes(origin.type)) throw new Error('Transaksi sudah dibatalkan atau tidak dapat dibatalkan.');
  if (origin.type === 'purchase') {
    const ingredients = new Set(origin.movements.map(item => item.ingredientId));
    const later = ledger.entries.slice(ledger.entries.indexOf(origin) + 1);
    if (later.some(entry => entry.movements.some(item => ingredients.has(item.ingredientId)))) {
      throw new Error('Sudah ada pergerakan bahan berikutnya. Catat koreksi stok dengan alasan.');
    }
  }
  const returnStock = origin.type === 'purchase' || (origin.type === 'sale' && fields.returnStock === true);
  const movements = returnStock ? origin.movements.map(item => ({
    ingredientId: item.ingredientId, quantity: new D(item.quantity).neg().toString(), value: new D(item.value).neg().toString()
  })) : [];
  origin.cancelled = true;
  return {
    label: origin.label, note: text(fields.note, 'Alasan'), originalId: origin.id,
    cash: new D(origin.cash).neg().toString(), revenue: new D(origin.revenue).neg().toString(),
    cogs: new D(origin.cogs).neg().toString(), movements,
    waste: origin.type === 'sale' && !returnStock ? sum(origin.movements.map(item => item.value)).neg().toString() : '0'
  };
}

export function applyCommand(current, command, at = new Date().toISOString()) {
  const { id, kind, fields } = command;
  if (!/^[\w-]{8,80}$/.test(id || '') || !fields || typeof fields !== 'object') throw new Error('Permintaan tidak valid.');
  if (current.commands.includes(id)) return current;
  const ledger = structuredClone(current);
  if (kind === 'ingredient') {
    if (!units.includes(fields.unit)) throw new Error('Pilih satuan bahan.');
    const name = text(fields.name, 'Nama bahan');
    if (ledger.ingredients.some(item => item.name.toLowerCase() === name.toLowerCase())) throw new Error('Nama bahan sudah digunakan.');
    const initial = read(fields.initial, 'Stok awal');
    const cost = read(fields.cost, 'Biaya per satuan');
    ledger.ingredients.push({ id, name, unit: fields.unit, minimum: read(fields.minimum, 'Batas minimum').toString(), quantity: initial.toString(), value: initial.mul(cost).toString() });
    if (initial.gt(0)) ledger.entries.push({
      id, type: 'opening', at, label: name, cash: '0', revenue: '0', cogs: '0',
      movements: [movement(ledger.ingredients.at(-1), initial, initial.mul(cost))]
    });
  } else if (kind === 'product') {
    if (!Array.isArray(fields.recipe) || !fields.recipe.length || fields.recipe.length > 40) throw new Error('Tambahkan hingga 40 bahan untuk resep.');
    const seen = new Set();
    const recipe = fields.recipe.map(item => {
      const ingredient = find(ledger.ingredients, item.ingredientId, 'Bahan');
      if (seen.has(ingredient.id)) throw new Error('Satu bahan hanya boleh muncul sekali di resep.');
      seen.add(ingredient.id);
      return { ingredientId: ingredient.id, quantity: positive(item.quantity, 'Jumlah bahan').toString() };
    });
    const servings = positive(fields.yield, 'Hasil porsi');
    if (!servings.isInteger()) throw new Error('Hasil porsi harus berupa bilangan bulat.');
    const previous = fields.productId ? find(ledger.products, fields.productId, 'Produk') : null;
    const product = {
      id: previous?.id || id, version: id, name: text(fields.name, 'Nama produk'), price: read(fields.price, 'Harga jual', 1).round().toString(),
      production: read(fields.production, 'Biaya produksi').toString(), yield: servings.toString(), recipe
    };
    if (previous) Object.assign(previous, product);
    else ledger.products.push(product);
  } else if (kind === 'briefing') {
    dateValue(fields.day, 'Tanggal briefing');
    const snapshot = summarize(ledger, fields.day, fields.day);
    ledger.briefings[fields.day] = {
      at, version: ledger.dataVersion, snapshot, advice: fields.advice || null, source: fields.advice ? 'Gemini' : 'Ringkasan otomatis'
    };
  } else {
    const defaults = { id, type: kind, at, cash: '0', revenue: '0', cogs: '0', movements: [] };
    let entry;
    switch (kind) {
      case 'purchase': entry = purchase(ledger, fields); break;
      case 'sale': entry = sale(ledger, fields); break;
      case 'expense':
        entry = {
          label: text(fields.category, 'Kategori'), note: text(fields.note, 'Keterangan'),
          expenseDate: dateValue(fields.expenseDate || jakartaDay(new Date(at)), 'Tanggal pengeluaran'),
          cash: read(fields.amount, 'Jumlah', 1).round().neg().toString()
        };
        break;
      case 'adjustment': entry = adjustment(ledger, fields); break;
      case 'reversal': entry = reverse(ledger, fields); break;
      default: throw new Error('Aksi tidak dikenal.');
    }
    const complete = { ...defaults, ...entry };
    applyMovements(ledger, complete.movements);
    ledger.entries.push(complete);
  }
  if (kind !== 'briefing') ledger.dataVersion += 1;
  ledger.commands.push(id);
  return ledger;
}

export function summarize(ledger, from, to) {
  const inPeriod = ledger.entries.filter(entry => {
    const day = jakartaDay(new Date(entry.at));
    return day >= from && day <= to;
  });
  const sales = sum(inPeriod.map(row => row.revenue));
  const cogs = sum(inPeriod.map(row => row.cogs));
  const expenses = inPeriod.filter(entry => entry.type === 'expense' || (entry.type === 'reversal' && ledger.entries.some(source => source.id === entry.originalId && source.type === 'expense')));
  const byCategory = new Map();
  for (const entry of expenses) {
    const total = new D(byCategory.get(entry.label) || 0).minus(entry.cash);
    byCategory.set(entry.label, total.toString());
  }
  const ranked = [...byCategory].filter(([, amount]) => new D(amount).gt(0)).sort((a, b) => new D(b[1]).cmp(a[1]));
  const gross = sales.minus(cogs);
  return {
    sales: sales.toString(), cogs: cogs.toString(), gross: gross.toString(),
    margin: sales.gt(0) ? gross.div(sales).mul(100).toNumber() : null,
    cash: new D(ledger.openingCash).plus(sum(ledger.entries.filter(entry => jakartaDay(new Date(entry.at)) <= to).map(entry => entry.cash))).toString(),
    cashIn: sum(inPeriod.map(row => row.cash).filter(amount => new D(amount).gt(0))).toString(),
    cashOut: sum(inPeriod.map(row => row.cash).filter(amount => new D(amount).lt(0))).neg().toString(),
    low: ledger.ingredients.filter(item => quantity(item).lte(item.minimum)).map(({ id, name, quantity, unit, minimum }) => ({ id, name, quantity, unit, minimum })),
    biggest: ranked[0] || null, entries: inPeriod, saleCount: inPeriod.filter(row => row.type === 'sale' && !row.cancelled).length
  };
}

export function briefingPoints(snapshot) {
  const points = [];
  if (snapshot.low.length) {
    const item = snapshot.low[0];
    points.push({ title: 'Periksa stok ' + item.name, detail: 'Tersedia ' + item.quantity + ' ' + item.unit + ', dengan batas minimum ' + item.minimum + ' ' + item.unit + '.' });
  }
  if (snapshot.biggest) points.push({ title: 'Tinjau pengeluaran ' + snapshot.biggest[0], detail: 'Kategori ini memiliki pengeluaran operasional terbesar dalam periode terpilih.' });
  if (!points.length) points.push({ title: 'Lanjutkan pencatatan harian', detail: 'Periksa bahan dan catat transaksi untuk menjaga ringkasan usaha tetap mutakhir.' });
  return points;
}
