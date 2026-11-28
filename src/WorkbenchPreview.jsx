import { demoScenarios } from './demo-scenarios.js';
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
const copy = {
  en: {
    window: 'MAVIQ Workspace',
    sample: 'Fictional data',
    industry: 'Business type',
    reset: 'Restart demo',
    tabs: ['Review receipt', 'Inspect stock', 'Check cash'],
    amount: 'Receipt total',
    original: 'Demo receipt',
    open: 'Read sample receipt',
    reading: 'Reading the sample…',
    opening: 'Start with a delivery',
    opened: 'Review the extracted draft',
    tip: 'Compare the extracted amount with the original receipt. Correct the first item’s quantity to continue.',
    start:
      'A delivery has arrived. Read the sample receipt to prepare a purchase draft.',
    confirmed: 'Purchase recorded',
    confirmation: 'Confirm purchase',
    inventory: 'Check updated inventory',
    cash: 'See the cash impact',
    stock: 'Inventory',
    before: 'Before',
    after: 'After',
    briefing: 'Daily briefing',
    actions: ['Cash before purchase', 'Cash out', 'Cash after purchase'],
    stockHint:
      'The purchase is now in inventory. Compare the quantities before and after recording it.',
    pendingHint: 'Record the receipt first to see this view update.',
    cashHint:
      'The payment is reflected in cash. Your sales figures stay the same.',
    inventoryCta: 'View inventory',
    cashCta: 'View daily briefing',
    back: 'Go to the receipt',
    complete: 'Demo complete',
    mismatch:
      'The draft must match the receipt. Check the first item’s quantity.',
  },
  id: {
    window: 'Ruang Kerja MAVIQ',
    sample: 'Data fiktif',
    industry: 'Jenis usaha',
    reset: 'Ulangi demo',
    tabs: ['Periksa struk', 'Cek stok', 'Cek kas'],
    amount: 'Total struk',
    original: 'Struk simulasi',
    open: 'Baca struk contoh',
    reading: 'Membaca struk…',
    opening: 'Mulai dari barang yang datang',
    opened: 'Periksa draf hasil pembacaan',
    tip: 'Bandingkan draf dengan struk asli. Koreksi jumlah barang pertama agar bisa lanjut.',
    start:
      'Kiriman barang sudah tiba. Baca struk contoh untuk menyiapkan draf pembelian.',
    confirmed: 'Pembelian tercatat',
    confirmation: 'Konfirmasi pembelian',
    inventory: 'Cek stok setelah pembelian',
    cash: 'Lihat dampak pada kas',
    stock: 'Inventaris',
    before: 'Sebelum',
    after: 'Sesudah',
    briefing: 'Briefing harian',
    actions: ['Kas sebelum pembelian', 'Kas keluar', 'Kas setelah pembelian'],
    stockHint:
      'Barang yang dibeli sudah masuk inventaris. Bandingkan jumlahnya sebelum dan sesudah pembelian.',
    pendingHint:
      'Catat struk terlebih dahulu untuk melihat perubahan pada bagian ini.',
    cashHint:
      'Pembayaran sudah tercatat sebagai kas keluar. Angka penjualan tetap sama.',
    inventoryCta: 'Lihat inventaris',
    cashCta: 'Lihat briefing harian',
    back: 'Kembali ke struk',
    complete: 'Demo selesai',
    mismatch:
      'Draf harus sesuai dengan struk. Periksa kembali jumlah barang pertama.',
  },
};

function ReceiptSheet({ t, receipt, receiptTotal, amount, quantity, reading }) {
  return (
    <div className="workbench-paper receipt-sheet" data-reading={reading}>
      <div className="workbench-heading">
        <span className="paper-icon">
          <ReceiptText size={22} aria-hidden="true" />
        </span>
        <div>
          <h3>{t.original}</h3>
        </div>
      </div>
      <dl className="workbench-rows">
        {receipt.map((item) => (
          <div key={item.label}>
            <dt>
              {item.label}
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

export default function WorkbenchPreview({ lang, active, onChange }) {
  const [scenarioId, setScenarioId] = useState(demoScenarios[0].id);
  const scenario = demoScenarios.find(({ id }) => id === scenarioId);
  const t = copy[lang];
  const language = lang === 'en' ? 0 : 1;
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
      <div className="scenario-picker">
        <label htmlFor="demo-scenario">{t.industry}</label>
        <select
          id="demo-scenario"
          value={scenarioId}
          onChange={(event) => {
            onChange(0);
            setScenarioId(event.target.value);
          }}
        >
          {demoScenarios.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label[language]}
            </option>
          ))}
        </select>
      </div>
      <ScenarioWorkbench
        key={scenarioId}
        lang={lang}
        active={active}
        onChange={onChange}
        scenario={scenario}
      />
    </section>
  );
}

function ScenarioWorkbench({ lang, active, onChange, scenario }) {
  const language = lang === 'en' ? 0 : 1;
  const receipt = scenario.items.map(
    ([label, quantity, unit, price, startingStock]) => ({
      label: label[language],
      quantity,
      unit,
      price,
      startingStock,
    }),
  );
  const receiptTotal = receipt.reduce((amount, item) => amount + item.price, 0);
  const { openingCash } = scenario;
  const first = receipt[0];
  const draftOptions = [first.quantity - 1, first.quantity, first.quantity + 1];
  const [scan, setScan] = useState('ready');
  const [draftQuantity, setDraftQuantity] = useState(draftOptions[0]);
  const [recorded, setRecorded] = useState(false);
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
    (lang === 'id' && unit === 'pcs' ? 'unit' : unit);
  const passed = draftQuantity === first.quantity;
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
    setDraftQuantity(draftOptions[0]);
    setError(false);
    setRecorded(false);
    moveTo(0);
  }

  function confirm() {
    if (!passed) {
      setError(true);
      return;
    }
    setError(false);
    setRecorded(true);
    moveTo(1);
  }

  return (
    <>
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
                  receipt={receipt}
                  receiptTotal={receiptTotal}
                  amount={amount}
                  quantity={quantity}
                  reading={scan === 'reading'}
                />
                {scan === 'read' && !recorded && (
                  <div className="guided-review">
                    <label htmlFor="demo-quantity">
                      {first.label} ({first.unit})
                    </label>
                    <select
                      id="demo-quantity"
                      value={draftQuantity}
                      aria-invalid={error || undefined}
                      aria-describedby={error ? 'demo-review-error' : undefined}
                      onChange={(event) => {
                        setDraftQuantity(Number(event.target.value));
                        setError(false);
                      }}
                    >
                      {draftOptions.map((value) => (
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
                    {receipt.map((item) => (
                      <tr key={item.label}>
                        <th scope="row">{item.label}</th>
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
    </>
  );
}
