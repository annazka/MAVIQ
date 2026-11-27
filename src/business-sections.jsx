import { useState } from 'react';
import {
  Banknote,
  ChartNoAxesCombined,
  ChefHat,
  Coffee,
  Croissant,
  House,
  Package,
  ReceiptText,
  Sparkles,
  Store,
  TrendingUp,
  Utensils,
} from 'lucide-react';

const tools = [
  ReceiptText,
  TrendingUp,
  Package,
  Banknote,
  ChartNoAxesCombined,
  Sparkles,
];
const industries = [Utensils, Coffee, ChefHat, Croissant, House];

const content = {
  en: {
    about: 'What is MAVIQ?',
    definition:
      'An AI-powered, all-in-one business management and decision support platform for Indonesian micro, small and medium enterprises.',
    tools: 'One workspace for your operations.',
    capabilities: [
      [
        'Automated records',
        'Turn receipt photos into purchase drafts, review the details, and keep sales and purchases together.',
      ],
      [
        'Market prices',
        'Check traditional market reference prices before planning what to buy.',
      ],
      [
        'Inventory',
        'Track which ingredients come in, what each sale uses, and what needs restocking.',
      ],
      [
        'Financial analysis',
        'Review sales, estimated gross profit, and cash flow from your business records.',
      ],
      [
        'Cost of goods sold',
        'Use ingredient prices and recipes to estimate the production cost per serving or item.',
      ],
      [
        'AI recommendations',
        'Ask about your numbers and use daily briefings to decide which tasks to tackle first.',
      ],
    ],
    sectors: 'Built first for food businesses.',
    sectorNote:
      'MAVIQ starts with Indonesia’s food sector. Explore how it can support different ways of running a business.',
    examples: [
      [
        'Food stalls',
        'Know what to prepare tomorrow.',
        'Record each order and check which ingredients ran low after the lunch rush.',
      ],
      [
        'Coffee shops',
        'Know the cost of a cup.',
        'Link milk, coffee and packaging to a recipe to see how ingredient prices affect the cost per cup.',
      ],
      [
        'Catering',
        'Plan a larger order.',
        'Review stock and compare market prices before buying ingredients for a batch.',
      ],
      [
        'Bakeries',
        'Track the cost of a batch.',
        'Use recipes and current ingredient costs to estimate what each item costs to produce.',
      ],
      [
        'Home food businesses',
        'Keep daily finances in one place.',
        'Record purchases and sales, then review cash flow and estimated gross profit.',
      ],
    ],
  },
  id: {
    about: 'Apa itu MAVIQ?',
    definition:
      'Platform pengelolaan bisnis dan pendukung keputusan berbasis AI yang menyatukan operasional usaha mikro, kecil, dan menengah di Indonesia.',
    tools: 'Satu ruang untuk operasional usahamu.',
    capabilities: [
      [
        'Otomatisasi pencatatan',
        'Ubah foto struk menjadi draf pembelian, periksa rinciannya, dan simpan penjualan serta pembelian di satu tempat.',
      ],
      [
        'Harga pasar',
        'Cek harga referensi pasar tradisional sebelum merencanakan belanja.',
      ],
      [
        'Inventaris',
        'Pantau bahan masuk, pemakaian dari penjualan, dan stok yang perlu diisi ulang.',
      ],
      [
        'Analisis keuangan',
        'Tinjau penjualan, estimasi laba kotor, dan arus kas dari catatan usaha.',
      ],
      [
        'Harga Pokok Produksi (HPP)',
        'Gunakan harga bahan dan resep untuk memperkirakan biaya produksi per porsi atau per produk.',
      ],
      [
        'Rekomendasi AI',
        'Tanyakan arti angka usahamu dan gunakan briefing harian untuk menentukan prioritas.',
      ],
    ],
    sectors: 'Berangkat dari usaha kuliner.',
    sectorNote:
      'MAVIQ berfokus awal pada sektor kuliner Indonesia. Lihat contoh pemakaiannya di berbagai jenis usaha.',
    examples: [
      [
        'Warung makan',
        'Tahu apa yang perlu disiapkan besok.',
        'Catat setiap pesanan dan cek bahan yang menipis setelah jam makan siang.',
      ],
      [
        'Kedai kopi',
        'Tahu biaya per gelas.',
        'Hubungkan susu, kopi, dan kemasan ke resep untuk melihat dampak harga bahan terhadap biaya per gelas.',
      ],
      [
        'Katering',
        'Siapkan pesanan dalam jumlah besar.',
        'Cek stok dan bandingkan harga pasar sebelum membeli bahan untuk satu batch.',
      ],
      [
        'Toko roti',
        'Pantau biaya tiap batch.',
        'Gunakan resep dan harga bahan terkini untuk memperkirakan biaya produksi per produk.',
      ],
      [
        'Usaha makanan rumahan',
        'Satukan catatan keuangan harian.',
        'Catat pembelian dan penjualan, lalu tinjau arus kas dan estimasi laba kotor.',
      ],
    ],
  },
};

export function BusinessSections({ lang }) {
  const [tool, setTool] = useState(0);
  const [business, setBusiness] = useState(0);
  const copy = content[lang];
  const ToolIcon = tools[tool];
  const BusinessIcon = industries[business];

  return (
    <>
      <section className="frame about" id="tentang" data-reveal>
        <Store size={34} aria-hidden="true" />
        <div>
          <h2 tabIndex="-1">{copy.about}</h2>
          <p className="full-name">
            Merchant Analytics &amp; Venture Intelligence Quotient
          </p>
          <p>{copy.definition}</p>
        </div>
      </section>
      <section className="frame modules" id="kapabilitas" data-reveal>
        <h2 tabIndex="-1">{copy.tools}</h2>
        <div className="module-grid">
          <div className="module-buttons">
            {copy.capabilities.map(([title], index) => {
              const Icon = tools[index];
              return (
                <button
                  type="button"
                  key={index}
                  aria-pressed={tool === index}
                  onClick={() => setTool(index)}
                >
                  <Icon size={20} aria-hidden="true" /> {title}
                </button>
              );
            })}
          </div>
          <div aria-live="polite">
            <article className="insight-card" key={tool}>
              <ToolIcon size={32} aria-hidden="true" />
              <h3>{copy.capabilities[tool][0]}</h3>
              <p>{copy.capabilities[tool][1]}</p>
            </article>
          </div>
        </div>
      </section>
      <section className="frame business-types" id="jenis-usaha" data-reveal>
        <h2 tabIndex="-1">{copy.sectors}</h2>
        <p>{copy.sectorNote}</p>
        <div className="prompts">
          {copy.examples.map(([title], index) => (
            <button
              type="button"
              key={index}
              aria-pressed={business === index}
              onClick={() => setBusiness(index)}
            >
              {title}
            </button>
          ))}
        </div>
        <div aria-live="polite">
          <article className="insight-card" key={business}>
            <BusinessIcon size={32} aria-hidden="true" />
            <h3>{copy.examples[business][1]}</h3>
            <p>{copy.examples[business][2]}</p>
          </article>
        </div>
      </section>
    </>
  );
}
