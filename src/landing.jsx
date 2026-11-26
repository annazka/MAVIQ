import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowDown, ArrowDownRight, ArrowRight, ArrowUpRight, Banknote, ChartNoAxesCombined, ChevronRight, Coffee, Package, ReceiptText, ScanLine, ShoppingCart } from 'lucide-react';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/instrument-serif/400.css';
import '@fontsource/instrument-serif/400-italic.css';
import './landing.css';
import LandingGuide from './LandingGuide.jsx';
import { AssistantSection, FaqSection, MarketSection } from './landing-sections.jsx';

const app = '/app/';
const signIn = app + '?mode=masuk';
const signUp = app + '?mode=daftar';
const appSections = new Set(['#dashboard', '#sales', '#purchases', '#stock', '#products', '#cash', '#market']);
const sample = [
  ['Susu full cream', '4 × 1 L', 'Rp112.000'],
  ['Biji kopi Arabika', '1 × 500 g', 'Rp82.000'],
  ['Gelas 16 oz', '2 × 50 pcs', 'Rp64.000']
];
const featureData = [
  { id: 'purchases', icon: ScanLine, title: 'Scan struk pembelian', short: 'Scan struk', copy: 'Unggah foto struk atau isi pembelian secara manual. Periksa rincian, lalu simpan untuk memperbarui stok dan kas.' },
  { id: 'stock', icon: Package, title: 'Pantau stok dan HPP', short: 'Stok & HPP', copy: 'Hubungkan bahan dengan resep. Lihat stok yang menipis dan estimasi biaya per porsi sebelum menetapkan harga jual.' },
  { id: 'dashboard', icon: ChartNoAxesCombined, title: 'Baca kondisi usaha', short: 'Laporan', copy: 'Lihat penjualan, estimasi laba kotor, dan kas dalam satu dashboard. Minta briefing harian untuk menentukan langkah berikutnya.' }
];

function Logo() {
  return <span className="land-logo"><img src="/maviq.svg" width="36" height="36" alt="" /><span>MAVIQ<span>.</span></span></span>;
}

function ReceiptPreview() {
  return <div className="land-receipt">
    <div className="land-preview-head"><span className="land-icon"><ReceiptText size={19} /></span><div><strong>Draf pembelian</strong><small>Toko Bahan Kopi</small></div><span className="land-badge">Perlu diperiksa</span></div>
    <div className="land-receipt-lines">{sample.map(([name, count, price]) => <div key={name}><span>{name}<small>{count}</small></span><strong>{price}</strong></div>)}</div>
    <div className="land-receipt-total"><span>Total dibayar</span><strong>Rp258.000</strong></div>
  </div>;
}

function StockPreview() {
  const stock = [
    ['Biji kopi Arabika', '324 g', 24],
    ['Susu full cream', '6.140 ml', 74],
    ['Gelas 16 oz', '208 pcs', 84]
  ];
  return <div className="land-receipt land-stock-preview">
    <div className="land-preview-head"><span className="land-icon"><Package size={19} /></span><div><strong>Bahan & Stok</strong><small>Persediaan Kedai Nusa</small></div><span className="land-badge">1 bahan menipis</span></div>
    <div className="land-receipt-lines">{stock.map(([name, count, fill]) => <div key={name}><span>{name}<span className={'stock-meter ' + (fill < 30 ? 'low' : '')}><i style={{ width: fill + '%' }} /></span></span><strong>{count}</strong></div>)}</div>
    <div className="land-receipt-total"><span>Estimasi HPP es kopi susu</span><strong>Rp7.200/porsi</strong></div>
  </div>;
}

function SalesPreview() {
  return <div className="land-receipt land-sales-preview">
    <div className="land-preview-head"><span className="land-icon"><ChartNoAxesCombined size={19} /></span><div><strong>Ringkasan usaha</strong><small>Kedai Nusa · 7 hari terakhir</small></div><span className="land-badge mint-label">Contoh</span></div>
    <div className="land-mini-kpis"><div><span>Penjualan bersih</span><strong>Rp3.204.000</strong></div><div><span>Saldo kas</span><strong>Rp5.244.000</strong></div></div>
    <div className="land-mini-chart" aria-hidden="true">{[29, 53, 37, 78, 48, 93, 69].map((height, i) => <i key={i} style={{ height: height + '%' }} />)}</div>
  </div>;
}

const previews = { purchases: ReceiptPreview, stock: StockPreview, dashboard: SalesPreview };

function Landing() {
  const [feature, setFeature] = useState(featureData[0]);
  const Preview = previews[feature.id];
  return <div id="beranda" className="landing">
    <a className="land-skip" href="#konten">Langsung ke konten</a>
    <header className="land-header">
      <div className="land-wrap land-header-inner">
        <a className="land-brand" href="/" aria-label="MAVIQ beranda"><Logo /></a>
        <nav className="land-nav" aria-label="Navigasi utama"><a href="#fitur">Fitur</a><a href="#cara-kerja">Cara kerja</a><a href="#harga-pasar">Harga Pasar</a><a href="#faq">FAQ</a></nav>
        <div className="land-header-actions"><a className="land-login" href={signIn}>Masuk</a><a className="land-button primary" href={signUp}>Daftar <ArrowUpRight size={16} /></a></div>
      </div>
    </header>
    <main id="konten">
      <section id="ringkasan" className="land-screen land-hero land-wrap">
        <div className="land-hero-copy" data-enter>
          <span className="land-eyebrow"><Coffee size={17} /> Untuk UMKM kuliner</span>
          <h1 tabIndex="-1">Kelola kedai <em>lebih tenang.</em></h1>
          <p>Foto struk belanja, catat penjualan, dan pantau stok serta kas dalam satu dashboard.</p>
          <div className="land-actions"><a className="land-button primary" href={signUp}>Daftar akun <ArrowRight size={19} /></a><a className="land-button text-link" href="#cara-kerja">Lihat cara kerja <ArrowDown size={17} /></a></div>
        </div>
        <figure className="land-hero-visual">
          <img className="land-kedai" src="/maviq-kedai.webp" alt="Pemilik kedai kopi menggunakan ponsel untuk memindai struk belanja di meja kasir" width="1100" height="825" fetchPriority="high" />
          <div className="land-hero-receipt" aria-hidden="true"><ReceiptPreview /></div>
        </figure>
      </section>

      <section id="fitur" className="land-screen land-features">
        <div className="land-wrap land-feature-inner">
          <div className="land-feature-copy">
            <h2 tabIndex="-1">Dari nota belanja <em>ke laporan usaha.</em></h2>
            <p>Pembelian dan penjualan memperbarui stok dan kas kedai.</p>
            <div className="land-feature-list" aria-label="Pilih contoh fitur">
              {featureData.map(item => <button key={item.id} aria-label={item.title} aria-pressed={feature.id === item.id} type="button" onClick={() => setFeature(item)}>
                <span className="land-icon"><item.icon size={19} /></span><span className="land-feature-label">{item.title}</span><span className="land-feature-short">{item.short}</span><ChevronRight className="land-feature-arrow" size={17} />
              </button>)}
            </div>
          </div>
          <div className="land-feature-visual">
            <div className="land-feature-window">
              <div className="land-window-bar"><span><i /><i /><i /></span><span>Contoh dashboard MAVIQ</span></div>
              <div className="land-feature-example" key={feature.id}><Preview /><p>{feature.copy}</p><a className="land-inline" href={signUp}>Daftar untuk mulai <ArrowUpRight size={15} /></a></div>
            </div>
          </div>
        </div>
      </section>

      <section id="cara-kerja" className="land-screen land-workflow land-wrap">
        <div className="land-workflow-heading"><h2 tabIndex="-1">Mulai dari <em>rutinitas harian.</em></h2><p>Tiga langkah untuk melihat bagaimana transaksi kedai terhubung.</p></div>
        <div className="land-steps">
          <article><span className="land-icon"><ScanLine size={23} /></span><h3>Catat belanja</h3><p>Foto struk atau masukkan pembelian manual. Periksa rincian bahan dan total sebelum menyimpan.</p></article>
          <article><span className="land-icon"><ShoppingCart size={23} /></span><h3>Catat penjualan</h3><p>Pilih produk dan jumlah pesanan. MAVIQ menghitung estimasi HPP dari resep dan memperbarui stok.</p></article>
          <article><span className="land-icon"><Banknote size={23} /></span><h3>Periksa hasilnya</h3><p>Lihat kas, penjualan, dan bahan yang perlu dibeli ulang. Gunakan briefing harian untuk meninjau prioritas.</p></article>
        </div>
      </section>
      <MarketSection app={app} />
      <AssistantSection signUp={signUp} />
      <FaqSection />

      <section id="daftar" className="land-screen land-final">
        <div className="land-wrap land-final-card">
          <h2 tabIndex="-1">Siapkan ruang<br /><em>untuk usaha Anda.</em></h2>
          <p>Daftar dengan Google atau email. Setelah masuk, buat ruang kerja untuk kedai Anda.</p>
          <a className="land-button primary" href={signUp}>Daftar akun <ArrowRight size={19} /></a>
        </div>
        <footer className="land-footer land-wrap"><a href="/" aria-label="MAVIQ beranda"><Logo /></a><span>Operasional usaha kuliner</span><a href={signIn}>Masuk ke MAVIQ <ArrowDownRight size={15} /></a></footer>
      </section>
    </main>
    <LandingGuide />
  </div>;
}

const hash = location.hash;
const params = new URLSearchParams(location.search);
if (appSections.has(hash) || hash.startsWith('#access_token=') || params.has('code') || ['masuk', 'daftar', 'oauth', 'aktivasi', 'pemulihan'].includes(params.get('mode'))) {
  location.replace(app + location.search + hash);
} else {
  createRoot(document.getElementById('root')).render(<Landing />);
}
