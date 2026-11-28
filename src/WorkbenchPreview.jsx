import { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  ChartNoAxesCombined,
  Check,
  Package,
  ReceiptText,
  RotateCcw,
  ScanLine,
  Sparkles,
} from 'lucide-react';

const steps = [ReceiptText, Package, ChartNoAxesCombined];
const receipt = [
  { quantity: 4, unit: 'kg', price: 54000, startingStock: 1.2 },
  { quantity: 1.5, unit: 'kg', price: 62000, startingStock: 3.5 },
  { quantity: 24, unit: 'pcs', price: 32000, startingStock: 48 },
];
const receiptTotal = receipt.reduce((amount, item) => amount + item.price, 0);
const openingCash = 5244000;

const copy = {
  en: {
    window: 'MAVIQ Workspace',
    sample: 'Interactive demo',
    reset: 'Restart demo',
    account: 'Nusa Bakery',
    vendor: 'Nusantara Ingredients',
    tabs: ['Review receipt', 'Inspect stock', 'Check cash'],
    items: ['Flour', 'Butter', 'Eggs'],
    amount: 'Receipt total',
    original: 'Original receipt',
    open: 'Read sample receipt',
    reading: 'Reading the sample…',
    opening: 'Start with a delivery',
    opened: 'Review the extracted draft',
    flour: 'Flour quantity (kg)',
    tip: 'Compare the extracted amount with the original receipt. Fix the flour quantity to continue.',
    start:
      'Your bakery has received an ingredient delivery. Read the sample receipt to prepare a purchase draft.',
    confirmed: 'Purchase recorded',
    confirmation: 'Confirm purchase',
    inventory: 'Check updated inventory',
    cash: 'See the cash impact',
    stock: 'Ingredient inventory',
    before: 'Before',
    after: 'After',
    briefing: 'Daily briefing',
    actions: ['Cash before purchase', 'Cash out', 'Cash after purchase'],
    stockHint:
      'The delivery has been added to your inventory. See how much is available before planning the next batch.',
    pendingHint: 'Record the receipt first to see this view update.',
    cashHint:
      'The payment is reflected in cash. Your sales figures stay the same.',
    inventoryCta: 'View inventory',
    cashCta: 'View daily briefing',
    back: 'Go to the receipt',
    complete: 'Demo complete',
    mismatch: 'The draft must match the receipt. Check the flour quantity.',
  },
  id: {
    window: 'Ruang Kerja MAVIQ',
    sample: 'Demo interaktif',
    reset: 'Ulangi demo',
    account: 'Toko Roti Nusa',
    vendor: 'Bahan Nusantara',
    tabs: ['Periksa struk', 'Cek stok', 'Cek kas'],
    items: ['Tepung terigu', 'Mentega', 'Telur'],
    amount: 'Total struk',
    original: 'Struk asli',
    open: 'Baca struk contoh',
    reading: 'Membaca struk…',
    opening: 'Mulai dari bahan yang datang',
    opened: 'Periksa draf hasil pembacaan',
    flour: 'Jumlah tepung (kg)',
    tip: 'Bandingkan draf dengan struk asli. Koreksi jumlah tepung agar bisa lanjut.',
    start:
      'Toko rotimu baru menerima kiriman bahan. Baca struk contoh untuk menyiapkan draf pembelian.',
    confirmed: 'Pembelian tercatat',
    confirmation: 'Konfirmasi pembelian',
    inventory: 'Cek stok setelah pembelian',
    cash: 'Lihat dampak pada kas',
    stock: 'Inventaris bahan',
    before: 'Sebelum',
    after: 'Sesudah',
    briefing: 'Briefing harian',
    actions: ['Kas sebelum pembelian', 'Kas keluar', 'Kas setelah pembelian'],
    stockHint:
      'Bahan kiriman sudah masuk inventaris. Cek jumlahnya sebelum menyiapkan produksi berikutnya.',
    pendingHint:
      'Catat struk terlebih dahulu untuk melihat perubahan pada bagian ini.',
    cashHint:
      'Pembayaran sudah tercatat sebagai kas keluar. Angka penjualan tetap sama.',
    inventoryCta: 'Lihat inventaris',
    cashCta: 'Lihat briefing harian',
    back: 'Kembali ke struk',
    complete: 'Demo selesai',
    mismatch: 'Draf harus sesuai dengan struk. Periksa kembali jumlah tepung.',
  },
};

function ReceiptSheet({ t, amount, quantity, reading }) {
  return (
    <div className="workbench-paper receipt-sheet" data-reading={reading}>
      <div className="workbench-heading">
        <span className="paper-icon">
          <ReceiptText size={22} aria-hidden="true" />
        </span>
        <div>
          <h3>{t.original}</h3>
          <p>{t.vendor}</p>
        </div>
      </div>
      <dl className="workbench-rows">
        {receipt.map((item, index) => (
          <div key={item.unit + index}>
            <dt>
              {t.items[index]}
              <small>{quantity(item.quantity, item.unit)}</small>
            </dt>
            <dd>{amount(item.price)}</dd>
          </div>
        ))}
      </dl>
      <div className="workbench-total">
        <span>{t.amount}</span>
        <strong>{amount(receiptTotal)}</strong>
      </div>
    </div>
  );
}

export default function WorkbenchPreview({
  lang,
  active,
  onChange,
  recorded,
  onRecord,
}) {
  const [scan, setScan] = useState('ready');
  const [flour, setFlour] = useState(3);
  const [error, setError] = useState(false);
  const nextHeading = useRef(null);
  const moveFocus = useRef(false);
  const t = copy[lang];
  const locale = lang === 'en' ? 'en-US' : 'id-ID';
  const money = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  const units = new Intl.NumberFormat(locale, { maximumFractionDigits: 1 });
  const amount = (value) => 'Rp' + money.format(value);
  const quantity = (value, unit) =>
    units.format(value) +
    ' ' +
    (lang === 'id' && unit === 'pcs' ? 'butir' : unit);
  const passed = flour === receipt[0].quantity;
  const guidedTitle =
    active === 0
      ? recorded
        ? t.confirmed
        : scan === 'read'
          ? t.opened
          : t.opening
      : active === 1
        ? t.inventory
        : t.cash;
  const hint =
    active === 0
      ? recorded
        ? t.stockHint
        : scan === 'read'
          ? t.tip
          : t.start
      : recorded
        ? active === 1
          ? t.stockHint
          : t.cashHint
        : t.pendingHint;

  function moveTo(target) {
    moveFocus.current = true;
    onChange(target);
    if (active === target) {
      moveFocus.current = false;
      nextHeading.current?.focus();
    }
  }

  useEffect(() => {
    if (!moveFocus.current) return;
    moveFocus.current = false;
    nextHeading.current?.focus();
  }, [active]);

  useEffect(() => {
    if (scan !== 'reading') return;
    const reduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    const timer = window.setTimeout(
      () => {
        setScan('read');
        nextHeading.current?.focus();
      },
      reduced ? 0 : 650,
    );
    return () => window.clearTimeout(timer);
  }, [scan]);

  function reset() {
    setScan('ready');
    setFlour(3);
    setError(false);
    onRecord(false);
    moveTo(0);
  }

  function confirm() {
    if (!passed) {
      setError(true);
      return;
    }
    setError(false);
    onRecord(true);
    moveTo(1);
  }

  return (
    <section
      id="demo-ruang-kerja"
      className="workbench guided-workbench"
      tabIndex={-1}
      aria-label={t.window}
    >
      <div className="workbench-bar">
        <span>
          <img src="/maviq.svg" alt="" width="26" height="26" />
          {t.window}
        </span>
        <span className="sample-label">{t.sample}</span>
      </div>
      <div className="workbench-switch" role="group" aria-label={t.sample}>
        {t.tabs.map((label, index) => {
          const Icon =
            recorded && (index === 0 || (index === 1 && active === 2))
              ? Check
              : steps[index];
          return (
            <button
              type="button"
              key={label}
              aria-pressed={active === index}
              aria-controls="workbench-content"
              onClick={() => onChange(index)}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </div>
      <div id="workbench-content" className="guided-content">
        <div className="guided-heading">
          <div>
            <p>{t.account}</p>
            <h2 tabIndex={-1} ref={nextHeading}>
              {guidedTitle}
            </h2>
          </div>
          {(scan !== 'ready' || recorded) && (
            <button type="button" className="demo-reset" onClick={reset}>
              <RotateCcw size={15} aria-hidden="true" />
              {t.reset}
            </button>
          )}
        </div>
        <div className="guided-scene" key={active}>
          <div className="guided-task">
            {active === 0 && (
              <>
                <ReceiptSheet
                  t={t}
                  amount={amount}
                  quantity={quantity}
                  reading={scan === 'reading'}
                />
                {scan === 'read' && !recorded && (
                  <div className="guided-review">
                    <label htmlFor="demo-flour">{t.flour}</label>
                    <select
                      id="demo-flour"
                      value={flour}
                      aria-invalid={error || undefined}
                      aria-describedby={error ? 'demo-review-error' : undefined}
                      onChange={(event) => {
                        setFlour(Number(event.target.value));
                        setError(false);
                      }}
                    >
                      {[3, 4, 5].map((value) => (
                        <option key={value} value={value}>
                          {value}
                        </option>
                      ))}
                    </select>
                    {error && (
                      <p id="demo-review-error" role="alert">
                        {t.mismatch}
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
            {active === 1 && (
              <div className="workbench-paper">
                <div className="workbench-heading">
                  <span className="paper-icon">
                    <Package size={22} aria-hidden="true" />
                  </span>
                  <h3>{t.stock}</h3>
                </div>
                <table className="guided-stock">
                  <thead>
                    <tr>
                      <td></td>
                      <th scope="col">{t.before}</th>
                      <th scope="col">{t.after}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipt.map((item, index) => (
                      <tr key={t.items[index]}>
                        <th scope="row">{t.items[index]}</th>
                        <td>{quantity(item.startingStock, item.unit)}</td>
                        <td>
                          {recorded
                            ? quantity(
                                item.startingStock + item.quantity,
                                item.unit,
                              )
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {active === 2 && (
              <div className="workbench-paper">
                <div className="workbench-heading">
                  <span className="paper-icon">
                    <ChartNoAxesCombined size={22} aria-hidden="true" />
                  </span>
                  <h3>{t.briefing}</h3>
                </div>
                <dl className="workbench-rows">
                  {[
                    openingCash,
                    recorded ? receiptTotal : 0,
                    openingCash - (recorded ? receiptTotal : 0),
                  ].map((value, index) => (
                    <div key={t.actions[index]}>
                      <dt>{t.actions[index]}</dt>
                      <dd>{amount(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}
          </div>
          <div className="workbench-assistant guided-assistant">
            <div className="guided-note">
              <p>
                <Sparkles size={15} aria-hidden="true" />
                {hint}
              </p>
              {active === 0 && scan !== 'read' && (
                <button
                  type="button"
                  className="record-sample"
                  disabled={scan === 'reading'}
                  onClick={() => setScan('reading')}
                >
                  <ScanLine size={16} aria-hidden="true" />
                  {scan === 'reading' ? t.reading : t.open}
                </button>
              )}
              {active === 0 && scan === 'read' && (
                <button
                  type="button"
                  className="record-sample"
                  onClick={recorded ? () => moveTo(1) : confirm}
                >
                  {recorded ? t.inventoryCta : t.confirmation}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
              {active === 1 && (
                <button
                  type="button"
                  className="record-sample"
                  onClick={() => {
                    moveTo(recorded ? 2 : 0);
                  }}
                >
                  {recorded ? t.cashCta : t.back}
                  <ArrowRight size={16} aria-hidden="true" />
                </button>
              )}
              {active === 2 &&
                (recorded ? (
                  <span className="demo-complete">
                    <Check size={16} aria-hidden="true" />
                    {t.complete}
                  </span>
                ) : (
                  <button
                    type="button"
                    className="record-sample"
                    onClick={() => moveTo(0)}
                  >
                    {t.back}
                    <ArrowRight size={16} aria-hidden="true" />
                  </button>
                ))}
            </div>
            <img
              src="/maviq-maskot-hd.webp"
              srcSet="/maviq-maskot.webp 420w, /maviq-maskot-hd.webp 1260w"
              sizes="(max-width: 600px) 80px, 190px"
              loading="lazy"
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
