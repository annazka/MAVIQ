import { useEffect, useRef } from 'react';
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Package,
  ReceiptText,
} from 'lucide-react';

const icons = [ReceiptText, Package, ChartNoAxesCombined];
const content = {
  en: {
    workspace: 'MAVIQ Workspace',
    explore: 'Explore the workspace',
    next: 'Next feature',
    tools: [
      [
        'Purchases',
        'Turn receipts into purchase records.',
        [
          'Upload a receipt or enter a purchase manually.',
          'Review the items, quantities, and prices before confirming.',
          'A confirmed purchase updates inventory and cash.',
        ],
      ],
      [
        'Inventory',
        'Keep track of ingredients.',
        [
          'See the stock available for each ingredient.',
          'Set a minimum stock level so you know when to restock.',
          'Link ingredients to recipes to estimate production costs.',
        ],
      ],
      [
        'Daily briefing',
        'Review the figures behind your decisions.',
        [
          'See net sales, estimated gross profit, and cash flow.',
          'Check low stock alongside recent transactions.',
          'Use your briefing to decide what needs attention first.',
        ],
      ],
    ],
  },
  id: {
    workspace: 'Ruang Kerja MAVIQ',
    explore: 'Jelajahi ruang kerja',
    next: 'Fitur berikutnya',
    tools: [
      [
        'Pembelian',
        'Ubah struk menjadi catatan pembelian.',
        [
          'Unggah struk atau masukkan pembelian secara manual.',
          'Periksa bahan, jumlah, dan harga sebelum konfirmasi.',
          'Pembelian yang dikonfirmasi memperbarui stok dan kas.',
        ],
      ],
      [
        'Inventaris',
        'Pantau persediaan bahan.',
        [
          'Lihat stok yang tersedia untuk setiap bahan.',
          'Atur batas minimum stok agar tahu kapan perlu belanja.',
          'Hubungkan bahan dengan resep untuk memperkirakan HPP.',
        ],
      ],
      [
        'Briefing harian',
        'Tinjau angka sebelum mengambil keputusan.',
        [
          'Lihat penjualan bersih, estimasi laba kotor, dan arus kas.',
          'Periksa stok yang menipis dan transaksi terbaru.',
          'Gunakan briefing untuk menentukan apa yang perlu ditangani lebih dulu.',
        ],
      ],
    ],
  },
};

export default function WorkbenchPreview({
  lang,
  active,
  onChange,
  signUp,
  signup,
}) {
  const t = content[lang];
  const heading = useRef(null);
  const focusNext = useRef(false);
  const Icon = icons[active];
  const [, title, details] = t.tools[active];
  const last = active === t.tools.length - 1;

  useEffect(() => {
    if (!focusNext.current) return;
    focusNext.current = false;
    heading.current?.focus({ preventScroll: true });
  }, [active]);

  return (
    <section
      id="demo-ruang-kerja"
      className="workbench"
      tabIndex={-1}
      aria-label={t.workspace}
    >
      <div className="workbench-bar">
        <span>
          <img src="/maviq.svg" alt="" width="26" height="26" />
          {t.workspace}
        </span>
      </div>
      <div className="workbench-switch" role="group" aria-label={t.explore}>
        {t.tools.map(([label], index) => {
          const TabIcon = icons[index];
          return (
            <button
              type="button"
              key={label}
              aria-pressed={active === index}
              aria-controls="workbench-content"
              onClick={() => onChange(index)}
            >
              <TabIcon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <div id="workbench-content" className="workspace-tour" aria-live="polite">
        <div key={active} className="workspace-tour-copy">
          <Icon size={30} aria-hidden="true" />
          <h2 ref={heading} tabIndex={-1}>
            {title}
          </h2>
          <ul>
            {details.map((line) => (
              <li key={line}>
                <Check size={16} aria-hidden="true" />
                {line}
              </li>
            ))}
          </ul>
          {last ? (
            <a className="go" href={signUp}>
              {signup}
              <ArrowRight size={17} />
            </a>
          ) : (
            <button
              type="button"
              className="go workspace-next"
              onClick={() => {
                focusNext.current = true;
                onChange(active + 1);
              }}
            >
              {t.next}
              <ArrowRight size={17} />
            </button>
          )}
        </div>
        <img
          src="/maviq-maskot-hd.webp"
          width="1260"
          height="1236"
          loading="lazy"
          alt=""
        />
      </div>
    </section>
  );
}
