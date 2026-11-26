import { useId, useState } from 'react';
import { AlertCircle, ArrowRight, Banknote, CalendarDays, ChevronDown, CircleDollarSign, Clock3, Coins, Plus, ScanLine, Sparkles, TrendingUp, Wallet } from 'lucide-react';
import { briefingPoints, dayOffset, jakartaDay, summarize } from '../lib/ledger.js';
import { amount, Button, clock, dateLabel, Delta, money, shortDate, StockList, TransactionTable } from './ui.jsx';

const periods = { 0: 'Hari ini', 6: '7 hari terakhir', 29: '30 hari terakhir' };

function chartPoints(ledger, from, days) {
  const count = Number(days) + 1;
  const size = count > 7 ? 5 : 1;
  return Array.from({ length: Math.ceil(count / size) }, (_, index) => {
    const first = dayOffset(from, index * size);
    const last = dayOffset(from, Math.min(count - 1, index * size + size - 1));
    const snapshot = summarize(ledger, first, last);
    return { day: first, sales: Number(snapshot.sales), gross: Number(snapshot.gross) };
  });
}

const axisMoney = value => {
  const abs = Math.abs(value);
  if (abs >= 1000000) return amount(value / 1000000) + ' jt';
  return abs >= 1000 ? amount(value / 1000) + ' rb' : amount(value);
};

function SalesChart({ points }) {
  const id = useId().replace(/:/g, '');
  const [selected, setSelected] = useState(null);
  const selectedIndex = selected === null ? null : Math.min(selected, points.length - 1);
  const active = selectedIndex === null ? null : points[selectedIndex];
  const values = points.flatMap(point => [point.sales, point.gross]);
  const peak = Math.max(100, ...values);
  const order = 10 ** Math.floor(Math.log10(peak / 4));
  const interval = Math.ceil(peak / 4 / order) * order;
  const bottom = Math.min(0, Math.floor(Math.min(...values) / interval) * interval);
  const top = interval * 4;
  const tickInterval = interval * Math.max(1, Math.ceil((top - bottom) / interval / 7));
  const alignedBottom = top - Math.ceil((top - bottom) / tickInterval) * tickInterval;
  const ticks = Array.from({ length: Math.round((top - alignedBottom) / tickInterval) + 1 }, (_, index) => top - index * tickInterval);
  const x = index => points.length === 1 ? 50 : 100 * index / (points.length - 1);
  const y = value => 100 * (top - value) / (top - alignedBottom);
  const line = key => points.map((point, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(point[key])}`).join(' ');
  return <>
    <div className="chart-frame">
      <div className="chart-axis">{ticks.map(tick => <span key={tick}>{axisMoney(tick)}</span>)}</div>
      <div className="chart-plot">
        <div className="chart-guides" aria-hidden="true">{ticks.map(tick => <i key={tick} />)}</div>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Grafik penjualan bersih dan estimasi laba kotor">
          <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopOpacity=".20" /><stop offset="100%" stopOpacity=".01" /></linearGradient></defs>
          {points.length > 1 && <path d={line('sales') + ` L 100 ${y(0)} L 0 ${y(0)} Z`} fill={`url(#${id})`} />}
          {points.length > 1 && <>
            <path d={line('gross')} className="gross-line" vectorEffect="non-scaling-stroke" />
            <path d={line('sales')} className="sales-line" vectorEffect="non-scaling-stroke" />
          </>}
        </svg>
        {points.map((point, i) => <button key={point.day} type="button" className={'chart-dot ' + (i === selectedIndex ? 'selected' : '')}
          style={{ left: x(i) + '%', top: y(point.sales) + '%' }}
          onClick={() => setSelected(i === selectedIndex ? null : i)}
          onMouseEnter={() => setSelected(i)} onMouseLeave={() => setSelected(null)}
          aria-label={shortDate(point.day + 'T12:00:00Z') + ', penjualan ' + money(point.sales) + ', laba kotor ' + money(point.gross)} />)}
        {active && <div role="status" className="chart-tooltip" style={{ left: Math.min(73, Math.max(4, x(selectedIndex))) + '%' }}>
          <strong>{shortDate(active.day + 'T12:00:00Z')}</strong><span>Penjualan {money(active.sales)}</span><span>Laba kotor {money(active.gross)}</span>
        </div>}
      </div>
      <div className="chart-days">{points.map((point, i) => <span className={i % 2 ? 'optional-date' : ''} key={point.day}>{shortDate(point.day + 'T12:00:00Z')}</span>)}</div>
    </div>
    <div className="legend"><span><i />Penjualan bersih</span><span><i />Estimasi laba kotor</span></div>
  </>;
}

export default function Dashboard({ ledger, demo, go, open, commit, busy, notify }) {
  const today = jakartaDay();
  const [day, setDay] = useState(today);
  const [period, setPeriod] = useState('6');
  const from = dayOffset(day, -Number(period));
  const previousEnd = dayOffset(from, -1);
  const current = summarize(ledger, from, day);
  const previous = summarize(ledger, dayOffset(previousEnd, -Number(period)), previousEnd);
  const daily = summarize(ledger, day, day);
  const briefing = ledger.briefings[day];
  const fresh = briefing && briefing.version === ledger.dataVersion;
  const displayed = briefing?.snapshot || daily;
  const points = briefingPoints(displayed);
  const metrics = [
    ['Penjualan bersih', current.sales, previous.sales, Banknote, 'mint'],
    ['Estimasi laba kotor', current.gross, previous.gross, TrendingUp, 'lime'],
    ['Saldo kas', current.cash, null, Wallet, 'blue'],
    ['Kas keluar', current.cashOut, null, Coins, 'amber']
  ];
  const recent = [...current.entries].filter(row => row.type !== 'opening').reverse().slice(0, 5);
  const generate = async () => {
    try {
      await commit({ id: crypto.randomUUID(), kind: 'briefing', fields: { day } });
      notify('Briefing diperbarui.');
    } catch (error) { notify(error.message, true); }
  };
  return <>
    <div className="dashboard-title" data-enter>
      <div><div className="current-date"><CalendarDays size={15} />{dateLabel(today)}</div><h1>Dashboard usaha</h1>
        <p>Pantau penjualan, stok, dan kas {ledger.name}.</p></div>
      <div className="page-actions"><Button icon={ScanLine} onClick={() => open('purchase', { scan: true })}>Scan struk</Button>
        <Button variant="primary" icon={Plus} onClick={() => open('sale')}>Catat Penjualan</Button></div>
    </div>
    <div className="section-heading report-heading">
      <div><h2>Ringkasan keuangan</h2><p>{from === day ? dateLabel(day) : shortDate(from + 'T12:00:00Z') + ' – ' + dateLabel(day)}</p></div>
      <div className="filters"><label className="filter date-filter" title="Tanggal akhir laporan"><CalendarDays size={16} /><input type="date" value={day} max={today} aria-label="Tanggal akhir laporan" onChange={event => event.target.value && setDay(event.target.value)} /></label>
        <label className="filter period-filter"><CalendarDays size={16} /><select aria-label="Periode laporan" value={period} onChange={event => setPeriod(event.target.value)}>{Object.entries(periods).map(([key, title]) => <option value={key} key={key}>{title}</option>)}</select><ChevronDown size={14} /></label></div>
    </div>
    <div className="metrics">{metrics.map(([title, value, comparison, Icon, tone], index) => <article key={title} className="panel metric">
      <span className={'tile ' + tone}><Icon size={19} /></span>
      <span className="metric-label">{title}</span><strong>{money(value)}</strong>
      {index < 2 ? <Delta current={value} previous={comparison} /> : <small className="metric-context">{index === 2 ? 'Kas masuk ' + money(current.cashIn) : 'Pembelian & pengeluaran'}</small>}
    </article>)}</div>
    <div className="dashboard-grid">
      <section className="panel chart-card">
        <div className="section-heading"><div><h2>Tren usaha</h2><p>Penjualan dan laba kotor per {Number(period) > 7 ? '5 hari' : 'hari'}</p></div><span className="chart-info"><CircleDollarSign size={16} /> IDR</span></div>
        <SalesChart key={from + day} points={chartPoints(ledger, from, period)} />
      </section>
      <section className="briefing-card panel">
        <div className="briefing-top"><span className="tile briefing-icon"><Sparkles size={20} /></span>
          {briefing && <span className={'status ' + (fresh ? 'confirmed' : 'attention')}><i />{fresh ? 'Terkini' : 'Perlu diperbarui'}</span>}
        </div>
        <h2>Briefing harian</h2>
        <p className="briefing-copy">{briefing?.advice || (briefing ? 'Ringkasan operasional untuk ' + dateLabel(day) + '.' : 'Rangkum kondisi usaha dan temukan hal yang perlu ditindaklanjuti.')}</p>
        <dl className="briefing-metrics"><div><dt>Penjualan bersih</dt><dd>{money(displayed.sales)}</dd></div>
          <div><dt>Estimasi laba kotor</dt><dd>{money(displayed.gross)}</dd></div></dl>
        <div className="briefing-note"><AlertCircle size={18} /><div><strong>{points[0].title}</strong><p>{points[0].detail}</p></div></div>
        <div className="briefing-bottom"><span>{briefing ? <><Clock3 size={13} /> {clock(briefing.at)} · {briefing.source}</> : demo ? 'Ringkasan data simulasi' : 'Belum dibuat'}</span>
          <button type="button" className="text-button" disabled={busy} onClick={generate}>{briefing ? 'Perbarui' : 'Buat briefing'} <ArrowRight size={15} /></button></div>
      </section>
    </div>
    <div className="dashboard-grid below">
      <section className="panel activity-card">
        <div className="section-heading"><div><h2>Transaksi terakhir</h2><p>Aktivitas pada periode terpilih</p></div><button className="text-button" onClick={() => go('cash')}>Lihat semua <ArrowRight size={15} /></button></div>
        <TransactionTable entries={recent} onOpen={entry => open('detail', entry)} />
      </section>
      <section className="panel stock-card">
        <div className="section-heading"><div><h2>Stok menipis</h2><p>Bahan yang perlu diperiksa</p></div><span className="status attention">{current.low.length} bahan</span></div>
        <StockList list={current.low} onOpen={item => open('adjustment', { ingredientId: item.id })} />
        <button className="text-button" onClick={() => go('stock')}>Buka persediaan <ArrowRight size={15} /></button>
      </section>
    </div>
  </>;
}
