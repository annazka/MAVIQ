import { ArrowDownLeft, ArrowUpRight, Boxes, Coffee, Coins, Package, Plus, ReceiptText, ScanLine, SlidersHorizontal, Wallet } from 'lucide-react';
import { useState } from 'react';
import { dayOffset, jakartaDay, productCost, summarize, unitCost } from '../lib/ledger.js';
import { amount, Button, Empty, money, TransactionTable } from './ui.jsx';

const descriptions = {
  sales: ['Penjualan', 'Catat pesanan dan lihat HPP yang tersimpan untuk setiap transaksi.'],
  purchases: ['Pembelian', 'Kelola pembelian persediaan, struk, dan biaya bahan.'],
  stock: ['Bahan & Stok', 'Pantau ketersediaan bahan dan pergerakan persediaan.'],
  products: ['Produk & Resep', 'Atur komposisi, harga jual, dan estimasi HPP per porsi.'],
  cash: ['Keuangan', 'Periksa arus kas, biaya operasional, dan riwayat transaksi.']
};

function Records({ entries, open }) {
  return <section className="panel activity-card">
    <div className="section-heading"><div><h2>Riwayat transaksi</h2><p>{entries.length} catatan pada filter ini</p></div></div>
    <TransactionTable entries={[...entries].reverse()} onOpen={entry => open('detail', entry)} />
  </section>;
}

export default function Pages({ page, ledger, open }) {
  const [period, setPeriod] = useState('29');
  const [category, setCategory] = useState('all');
  const [search, setSearch] = useState('');
  const [title, description] = descriptions[page];
  const today = jakartaDay();
  const from = period === 'all' ? '0000-01-01' : dayOffset(today, -Number(period));
  const snapshot = summarize(ledger, from, today);
  const entries = snapshot.entries.filter(row => {
    const source = row.type === 'reversal' ? ledger.entries.find(item => item.id === row.originalId) : row;
    if (page === 'sales') return source?.type === 'sale';
    if (page === 'purchases') return source?.type === 'purchase';
    return row.type !== 'opening' && (category === 'all' || source?.type === category);
  });
  const filters = ['sales', 'purchases', 'cash'].includes(page) && <div className="filters records-filters">
    <label className="filter"><SlidersHorizontal size={16} /><select aria-label="Periode transaksi" value={period} onChange={event => setPeriod(event.target.value)}>
      <option value="0">Hari ini</option><option value="6">7 hari terakhir</option><option value="29">30 hari terakhir</option><option value="all">Semua tanggal</option>
    </select></label>
    {page === 'cash' && <label className="filter"><select aria-label="Jenis transaksi" value={category} onChange={event => setCategory(event.target.value)}>
      <option value="all">Semua jenis</option><option value="sale">Penjualan</option><option value="purchase">Pembelian</option><option value="expense">Pengeluaran</option>
    </select></label>}
  </div>;
  return <>
    <div className="dashboard-title subpage" data-enter><div><h1>{title}</h1><p>{description}</p></div><div className="page-actions">
      {page === 'sales' && <Button variant="primary" icon={Plus} onClick={() => open('sale')}>Catat Penjualan</Button>}
      {page === 'purchases' && <><Button icon={ScanLine} onClick={() => open('purchase', { scan: true })}>Scan struk</Button><Button variant="primary" icon={Plus} onClick={() => open('purchase')}>Catat Pembelian</Button></>}
      {page === 'stock' && <><Button icon={SlidersHorizontal} onClick={() => open('adjustment')}>Sesuaikan Stok</Button><Button variant="primary" icon={Plus} onClick={() => open('ingredient')}>Tambah Bahan</Button></>}
      {page === 'products' && <Button variant="primary" icon={Plus} onClick={() => open('product')}>Tambah Produk</Button>}
      {page === 'cash' && <Button variant="primary" icon={Plus} onClick={() => open('expense')}>Catat Pengeluaran</Button>}
    </div></div>
    {filters}
    {page === 'cash' && <div className="metrics financial">{[
      [Wallet, 'Saldo kas', snapshot.cash, 'mint'], [ArrowDownLeft, 'Kas masuk', snapshot.cashIn, 'lime'], [ArrowUpRight, 'Kas keluar', snapshot.cashOut, 'amber'],
      [Coins, 'Pengeluaran terbesar', snapshot.biggest?.[1], 'blue']
    ].map(([Icon, label, value, tone]) => <div className="panel metric" key={label}><span className={'tile ' + tone}><Icon size={18} /></span><span className="metric-label">{label}</span><strong>{value === undefined ? '—' : money(value)}</strong>{label === 'Pengeluaran terbesar' && <small>{snapshot.biggest?.[0] || 'Belum ada pengeluaran'}</small>}</div>)}</div>}
    {['sales', 'purchases', 'cash'].includes(page) && <Records entries={entries} open={open} />}
    {page === 'stock' && <>
      <section className="panel list-panel"><div className="section-heading"><div><h2>Persediaan bahan</h2><p>{ledger.ingredients.length} bahan terdaftar</p></div>
        <input className="search-input" type="search" placeholder="Cari bahan" aria-label="Cari bahan" value={search} onChange={event => setSearch(event.target.value)} /></div>
        {ledger.ingredients.length ? <div className="item-list">{ledger.ingredients.filter(item => item.name.toLowerCase().includes(search.toLowerCase())).map(item => <div className="list-item" key={item.id}>
          <span className="tile mint"><Package size={19} /></span><div><strong>{item.name}</strong><small>{money(unitCost(item))} / {item.unit} · Minimum {amount(item.minimum)} {item.unit}</small></div>
          <span className={'status ' + (Number(item.quantity) <= Number(item.minimum) ? 'attention' : 'confirmed')}>{amount(item.quantity)} {item.unit}{Number(item.quantity) <= Number(item.minimum) ? ' · Menipis' : ''}</span>
          <Button onClick={() => open('adjustment', { ingredientId: item.id })}>Sesuaikan</Button>
        </div>)}
        {!ledger.ingredients.some(item => item.name.toLowerCase().includes(search.toLowerCase())) && <p className="muted">Bahan tidak ditemukan.</p>}</div> : <Empty icon={Boxes} title="Belum ada bahan">Tambahkan satuan dasar, stok awal, dan biaya bahan.</Empty>}
      </section>
      <section className="panel activity-card page-gap"><div className="section-heading"><div><h2>Riwayat pergerakan</h2><p>Pilih catatan untuk melihat perubahan stok.</p></div></div>
        <TransactionTable entries={ledger.entries.filter(item => item.movements.length).slice().reverse()} onOpen={entry => open('detail', entry)} />
      </section>
    </>}
    {page === 'products' && (ledger.products.length ? <div className="product-grid">{ledger.products.map(item => {
      const hpp = productCost(ledger, item);
      const margin = 100 * (Number(item.price) - Number(hpp)) / Number(item.price);
      return <article className="panel product-card" key={item.id}><span className="tile mint"><Coffee size={22} /></span><h2>{item.name}</h2>
        <p>{item.recipe.length} bahan · {item.yield} porsi per resep</p>
        <dl><div><dt>Harga jual</dt><dd>{money(item.price)}</dd></div><div><dt>Estimasi HPP</dt><dd>{money(hpp)}</dd></div><div><dt>Estimasi margin</dt><dd>{amount(margin)}%</dd></div></dl>
        <Button icon={ReceiptText} onClick={() => open('product', item)}>Edit resep</Button>
      </article>;
    })}</div> : <section className="panel"><Empty icon={Coffee} title="Belum ada produk">Buat resep dan kaitkan bahan untuk menghitung HPP.</Empty></section>)}
  </>;
}
