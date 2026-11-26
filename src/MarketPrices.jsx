import { useEffect, useState } from 'react';
import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronDown, CircleAlert, ExternalLink, MapPin, Minus, RefreshCw, Store, Wheat } from 'lucide-react';
import { dayOffset, jakartaDay } from '../lib/ledger.js';
import { marketSource } from '../lib/market-prices.js';
import { Button, clock, dateLabel, Empty, money, shortDate } from './ui.jsx';

const cacheKey = 'maviq-market-latest-v1';

function cached(region, date) {
  try {
    const saved = JSON.parse(localStorage.getItem(cacheKey));
    if (saved?.region.id === region && saved.requestedDate === date) return saved;
  } catch {}
  return null;
}

function retain(data) {
  try { localStorage.setItem(cacheKey, JSON.stringify(data)); } catch {}
}

function PriceChange({ latest, previous }) {
  if (!latest || !previous) return <span className="muted">—</span>;
  const difference = latest.price - previous.price;
  const Icon = difference > 0 ? ArrowUpRight : difference < 0 ? ArrowDownRight : Minus;
  return <span className={'market-change ' + (difference > 0 ? 'higher' : difference < 0 ? 'lower' : '')}
    title={'Dibanding ' + dateLabel(previous.date)}>
    <Icon size={14} /> {difference ? (difference > 0 ? '+' : '−') + money(Math.abs(difference)) : 'Tetap'}
  </span>;
}

export default function MarketPrices() {
  const today = jakartaDay();
  const [region, setRegion] = useState('national');
  const [date, setDate] = useState(today);
  const [filter, setFilter] = useState('all');
  const [revision, setRevision] = useState(0);
  const [result, setResult] = useState(null);
  const [regions, setRegions] = useState(() => cached('national', today)?.regions || [{ id: 'national', name: 'Nasional' }]);
  const matches = result?.region === region && result.date === date && result.revision === revision;
  const loading = !matches;
  const data = matches ? result.data : null;
  const error = matches ? result.error : '';
  useEffect(() => {
    const controller = new AbortController();
    const query = new URLSearchParams({ region, date });
    fetch('/api/market-prices?' + query, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.items) throw new Error(payload?.error || 'Harga pasar sedang tidak tersedia.');
        return payload;
      })
      .then(payload => {
        if (controller.signal.aborted) return;
        setRegions(payload.regions);
        retain(payload);
        setResult({ region, date, revision, data: payload, error: '' });
      })
      .catch(failure => {
        if (controller.signal.aborted) return;
        setResult({ region, date, revision, data: cached(region, date), error: failure.message });
      });
    return () => controller.abort();
  }, [region, date, revision]);

  const categories = data?.items.filter(item => !item.category) || [];
  const items = data?.items.filter(item => filter === 'all' ? !item.category : item.category === filter) || [];
  const source = data?.source || marketSource;
  const daysOld = items.some(item => item.latest && item.latest.date < date);
  const latest = items.map(item => item.latest?.date).filter(Boolean).sort().at(-1);
  return <>
    <div className="dashboard-title subpage" data-enter>
      <div><div className="current-date"><Store size={15} />Pasar tradisional</div><h1>Harga bahan pokok</h1>
        <p>Pantau harga referensi harian untuk wilayah usaha Anda.</p></div>
      <Button icon={RefreshCw} disabled={loading} onClick={() => setRevision(value => value + 1)}>{loading ? 'Memuat harga…' : 'Muat ulang'}</Button>
    </div>
    <section className="panel list-panel market-panel" aria-busy={loading}>
      <div className="section-heading"><div><h2>Harga pasar</h2><p>{data ? data.region.name : regions.find(item => item.id === region)?.name} · {dateLabel(date)}</p></div>
        {latest && <span className={'status ' + (latest === date && !error ? 'confirmed' : 'attention')}><i />{error ? 'Data tersimpan' : latest === date ? 'Data tersedia' : 'Data terakhir'}</span>}
      </div>
      <div className="filters market-filters">
        <label className="filter"><MapPin size={16} /><select aria-label="Wilayah harga" value={region} onChange={event => setRegion(event.target.value)}>{regions.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={14} /></label>
        <label className="filter"><CalendarDays size={16} /><input type="date" aria-label="Tanggal harga" value={date} min={dayOffset(today, -365)} max={today} onChange={event => event.target.value && setDate(event.target.value)} /></label>
        <label className="filter"><Wheat size={16} /><select aria-label="Komoditas" value={filter} disabled={!categories.length} onChange={event => setFilter(event.target.value)}>
          <option value="all">Semua komoditas</option>{filter !== 'all' && !categories.some(item => item.id === filter) && <option value={filter}>Komoditas terpilih</option>}
          {categories.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select><ChevronDown size={14} /></label>
      </div>
      {error && <p className="form-warning market-note" role="alert"><CircleAlert size={16} />{data ? 'Sumber sedang tidak tersedia. Harga berikut berasal dari salinan terakhir yang tersimpan di peramban.' : error}</p>}
      {daysOld && <p className="form-warning market-note"><CircleAlert size={16} />Sebagian harga untuk tanggal pilihan belum tersedia. Tabel menampilkan tanggal publikasi terakhir per bahan.</p>}
      {loading ? <div className="market-loading" role="status">Mengambil harga dari PIHPS…</div> :
        !items.length || !items.some(item => item.latest) ? <Empty icon={Wheat} title="Harga belum tersedia">Pilih wilayah, tanggal, atau komoditas lain untuk melihat harga referensi.</Empty> :
        <table className="market-table">
          <thead><tr><th scope="col">Komoditas</th><th scope="col">Harga referensi</th><th scope="col">Perubahan</th><th scope="col">Tanggal data</th></tr></thead>
          <tbody>{items.map(item => <tr key={item.id}>
            <th scope="row">{item.name}<small>per {item.unit}</small>{item.latest && <small className="market-mobile-date">{shortDate(item.latest.date + 'T12:00:00Z')}</small>}</th>
            <td><strong>{item.latest ? money(item.latest.price) : '—'}</strong></td>
            <td><PriceChange latest={item.latest} previous={item.previous} /></td>
            <td>{item.latest ? dateLabel(item.latest.date) : '—'}</td>
          </tr>)}</tbody>
        </table>}
      <div className="market-source"><a href={source.url} target="_blank" rel="noreferrer">{source.name} <ExternalLink size={13} /></a>
        {data && <span>Diambil {shortDate(data.fetchedAt)} · {clock(data.fetchedAt)}</span>}</div>
    </section>
  </>;
}
