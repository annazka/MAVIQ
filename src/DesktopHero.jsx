import HeroMascot from './HeroMascot.jsx';
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  ChartNoAxesCombined,
  Package,
  ReceiptText,
  Store,
} from 'lucide-react';

const shortcuts = {
  en: [
    ['Purchases', 'Review receipts and record incoming ingredients.'],
    ['Inventory', 'Track ingredients and know when to restock.'],
    ['Daily briefing', 'Review sales, cash flow, and stock alerts.'],
    ['Built for food businesses', 'Explore business types'],
  ],
  id: [
    ['Pembelian', 'Periksa struk dan catat bahan masuk.'],
    ['Inventaris', 'Pantau persediaan dan ketahui kapan perlu belanja.'],
    ['Briefing harian', 'Tinjau penjualan, arus kas, dan stok yang menipis.'],
    ['Untuk usaha kuliner', 'Lihat jenis usaha'],
  ],
};
const shortcutIcons = [ReceiptText, Package, ChartNoAxesCombined, Store];

export default function DesktopHero({ lang, copy, signup, onOpenDemo }) {
  const en = lang === 'en';
  return (
    <section
      className="desktop-hero"
      id="ringkasan"
      aria-labelledby="hero-title"
    >
      <div className="desktop-stage">
        <div className="desktop-intro">
          <HeroMascot />
          <h1 id="hero-title">MAVIQ</h1>
          <p className="desktop-tagline">
            {copy.intro} {copy.accent}
          </p>
          <p className="desktop-lead">
            {en
              ? 'The all-in-one workspace for Indonesian MSMEs. Track your business and decide what to do next with AI.'
              : 'Ruang kerja serba ada untuk UMKM Indonesia. Kelola usaha dan tentukan langkah berikutnya dengan AI.'}
          </p>
          <div className="desktop-actions">
            <a className="go" href={signup}>
              {copy.signup}
              <ArrowRight size={17} />
            </a>
            <a className="desktop-demo-link" href="#demo-ruang-kerja">
              {copy.tour}
              <ArrowDown size={16} />
            </a>
          </div>
        </div>
        <div
          className="desktop-shortcuts"
          aria-label={en ? 'Workspace shortcuts' : 'Pintasan ruang kerja'}
        >
          {shortcuts[lang].map(([title, label], index) => {
            const Icon = shortcutIcons[index];
            return (
              <a
                className={'desktop-shortcut shortcut-' + index}
                key={index}
                href={index === 3 ? '#jenis-usaha' : '#demo-ruang-kerja'}
                onClick={index < 3 ? () => onOpenDemo(index) : undefined}
              >
                <span className="shortcut-bar">
                  <Icon size={15} aria-hidden="true" />
                  {title}
                  <ArrowUpRight size={14} aria-hidden="true" />
                </span>
                {index === 3 ? (
                  <>
                    <img
                      src="/maviq-kedai.webp"
                      width="1100"
                      height="825"
                      alt=""
                      decoding="async"
                    />
                    <span className="shortcut-photo-label">{label}</span>
                  </>
                ) : (
                  <span className="shortcut-content">{label}</span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
