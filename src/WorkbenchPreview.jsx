import { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  ChartNoAxesCombined,
  CircleCheck,
  Package,
  ReceiptText,
  Sparkles,
} from 'lucide-react';

const icons = [ReceiptText, Package, ChartNoAxesCombined];
const stockLevels = [28, 64, 71];
const updatedStockLevels = [78, 83, 92];
const copy = {
  en: {
    window: 'MAVIQ Workspace',
    sample: 'Sample data',
    record: 'Record sample purchase',
    reset: 'Reset sample purchase',
    posted:
      'Sample purchase recorded. The demo stock and cash figures are updated.',
    restocked: 'Stock is updated. You now have 5.2 kg of flour on hand.',
    newStock: ['5.2 kg', '5 kg', '72 pcs'],
    total: 'Rp148,000',
    label: 'Explore the MAVIQ workspace',
    tabs: ['Purchases', 'Inventory', 'Daily briefing'],
    receipt: {
      title: 'Purchase draft',
      subtitle: 'Nusantara Ingredients',
      rows: [
        ['Flour', 'Rp54,000'],
        ['Butter', 'Rp62,000'],
        ['Eggs', 'Rp32,000'],
      ],
      total: 'Total purchase',
      hint: 'I’ve read this receipt. Check the amounts before posting it to your records.',
    },
    stock: {
      title: 'Ingredient inventory',
      subtitle: 'Stock on hand',
      rows: [
        ['Flour', '1.2 kg'],
        ['Butter', '3.5 kg'],
        ['Eggs', '48 pcs'],
      ],
      hint: 'Flour is running low. Check what you’ll need before the next production batch.',
    },
    briefing: {
      title: 'Daily briefing',
      subtitle: 'Today’s business figures',
      rows: [
        ['Sales', 'Rp1,250,000'],
        ['Estimated gross profit', 'Rp460,000'],
        ['Cash out', 'Rp0'],
      ],
      hint: 'Here’s where your business stands today. Open the workspace to check the full figures.',
    },
  },
  id: {
    window: 'Ruang Kerja MAVIQ',
    sample: 'Data contoh',
    record: 'Catat pembelian contoh',
    reset: 'Atur ulang pembelian contoh',
    posted:
      'Pembelian contoh tercatat. Stok dan kas pada demo sudah diperbarui.',
    restocked: 'Stok sudah diperbarui. Tepung terigu kini tersedia 5,2 kg.',
    newStock: ['5,2 kg', '5 kg', '72 butir'],
    total: 'Rp148.000',
    label: 'Jelajahi ruang kerja MAVIQ',
    tabs: ['Pembelian', 'Inventaris', 'Briefing harian'],
    receipt: {
      title: 'Draf pembelian',
      subtitle: 'Bahan Nusantara',
      rows: [
        ['Tepung terigu', 'Rp54.000'],
        ['Mentega', 'Rp62.000'],
        ['Telur', 'Rp32.000'],
      ],
      total: 'Total pembelian',
      hint: 'Struknya sudah kubaca. Periksa jumlah dan harganya sebelum dicatat.',
    },
    stock: {
      title: 'Inventaris bahan',
      subtitle: 'Stok tersedia',
      rows: [
        ['Tepung terigu', '1,2 kg'],
        ['Mentega', '3,5 kg'],
        ['Telur', '48 butir'],
      ],
      hint: 'Tepung terigu mulai menipis. Cek kebutuhan bahan sebelum produksi berikutnya.',
    },
    briefing: {
      title: 'Briefing harian',
      subtitle: 'Ringkasan usaha hari ini',
      rows: [
        ['Penjualan', 'Rp1.250.000'],
        ['Estimasi laba kotor', 'Rp460.000'],
        ['Kas keluar', 'Rp0'],
      ],
      hint: 'Ini kondisi usahamu hari ini. Buka ruang kerja untuk melihat angka lengkapnya.',
    },
  },
};

export default function WorkbenchPreview({ lang }) {
  const [active, setActive] = useState(0);
  const [recorded, setRecorded] = useState(false);
  const t = copy[lang];
  const panel = [t.receipt, t.stock, t.briefing][active];
  const PanelIcon = icons[active];
  const rows =
    recorded && active === 1
      ? panel.rows.map(([name], index) => [name, t.newStock[index]])
      : recorded && active === 2
        ? [...panel.rows.slice(0, 2), [panel.rows[2][0], t.total]]
        : panel.rows;
  const hint =
    recorded && active === 0
      ? t.posted
      : recorded && active === 1
        ? t.restocked
        : panel.hint;

  return (
    <section
      id="demo-ruang-kerja"
      className="workbench"
      tabIndex={-1}
      aria-label={t.label}
    >
      <div className="workbench-bar">
        <span>
          <img src="/maviq.svg" alt="" width="26" height="26" />
          {t.window}
        </span>
        <span className="sample-label">{t.sample}</span>
      </div>
      <div className="workbench-switch" role="group" aria-label={t.label}>
        {t.tabs.map((label, index) => {
          const Icon = icons[index];
          return (
            <button
              type="button"
              key={index}
              aria-pressed={active === index}
              aria-controls="workbench-content"
              onClick={() => setActive(index)}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <div id="workbench-content" aria-live="polite">
        <div className="workbench-scene" key={active}>
          <div className="workbench-paper">
            <div className="workbench-heading">
              <span className="paper-icon">
                <PanelIcon size={23} aria-hidden="true" />
              </span>
              <div>
                <h2>{panel.title}</h2>
                <p>{panel.subtitle}</p>
              </div>
            </div>
            <dl
              className={
                'workbench-rows' +
                (active === 1 && !recorded ? ' stock-low' : '')
              }
            >
              {rows.map(([name, value], index) => (
                <div key={name}>
                  <dt>{name}</dt>
                  <dd>
                    {active === 2 &&
                      (index === 2 ? (
                        <ArrowDownLeft size={14} aria-hidden="true" />
                      ) : (
                        <ArrowUpRight size={14} aria-hidden="true" />
                      ))}
                    {value}
                  </dd>
                  {active === 1 && (
                    <span className="stock-track" aria-hidden="true">
                      <span
                        style={{
                          width:
                            (recorded ? updatedStockLevels : stockLevels)[
                              index
                            ] + '%',
                        }}
                      />
                    </span>
                  )}
                </div>
              ))}
            </dl>
            {active === 0 && (
              <>
                <div className="workbench-total">
                  <span>
                    <CircleCheck size={16} aria-hidden="true" />
                    {panel.total}
                  </span>
                  <strong>{t.total}</strong>
                </div>
                <button
                  type="button"
                  className="record-sample"
                  onClick={() => setRecorded(!recorded)}
                >
                  {recorded ? t.reset : t.record}
                </button>
              </>
            )}
          </div>
          <div className="workbench-assistant">
            <p>
              <Sparkles size={15} aria-hidden="true" />
              {hint}
            </p>
            <img
              src="/maviq-maskot-hd.webp"
              srcSet="/maviq-maskot.webp 420w, /maviq-maskot-hd.webp 1260w"
              sizes="(max-width: 600px) 100px, (max-width: 880px) 180px, 236px"
              fetchPriority="high"
              alt=""
              width="1260"
              height="1236"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
