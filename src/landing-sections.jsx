import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, CircleHelp, MapPin, Plus, Sparkles, Wheat } from 'lucide-react';
import { dateLabel, money } from './ui.jsx';

const topics = [
  ['Stok apa yang menipis?', 'Biji kopi Arabika tersisa 324 g. Cek persediaan sebelum jam ramai.'],
  ['Berapa saldo kas?', 'Saldo kas Kedai Nusa Rp5.244.000. Rincian kas masuk dan keluar tersedia di menu Keuangan.'],
  ['Di mana lihat harga pasar?', 'Buka Harga Pasar untuk melihat harga referensi bahan pokok. Pilih wilayah, komoditas, dan tanggal yang Anda perlukan.']
];

const questions = [
  ['Apakah saya harus membuat akun untuk mencoba MAVIQ?', 'Anda bisa membuka demo tanpa akun. Demo memakai data simulasi Kedai Nusa dan menyimpan perubahan di peramban ini.'],
  ['Apa yang terjadi setelah saya memindai struk?', 'Hasil pembacaan masuk ke draf. Anda dapat mengoreksi rincian bahan dan jumlahnya, lalu konfirmasi sebelum stok dan kas diperbarui. Pembelian juga bisa dicatat manual.'],
  ['Dari mana harga bahan pokok berasal?', 'MAVIQ mengambil harga referensi pasar tradisional dari PIHPS Bank Indonesia. Tanggal di setiap komoditas menunjukkan kapan harga itu dipublikasikan.'],
  ['Apakah asisten bisa mengubah transaksi?', 'Asisten membantu membaca stok, kas, dan penjualan. Anda mencatat atau membatalkan transaksi melalui formulir di dashboard.']
];

const featuredMarkets = ['Beras', 'Telur Ayam', 'Gula Pasir'];

export function MarketSection({ app }) {
  const section = useRef(null);
  const [visible, setVisible] = useState(false);
  const [prices, setPrices] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      setVisible(true);
      observer.disconnect();
    }, { rootMargin: '240px' });
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    fetch('/api/market-prices?region=national', { signal: controller.signal })
      .then(response => {
        if (!response.ok) throw new Error('Harga sedang tidak tersedia.');
        return response.json();
      })
      .then(data => {
        const items = Array.isArray(data.items) ? data.items : [];
        if (!controller.signal.aborted) setPrices(featuredMarkets.map(name => items.find(item => item.name === name) || { name }));
      })
      .catch(() => { if (!controller.signal.aborted) setPrices([]); });
    return () => controller.abort();
  }, [visible]);
  return <section ref={section} id="harga-pasar" className="land-screen land-market">
    <div className="land-wrap land-split">
      <div className="land-section-copy">
        <span className="land-eyebrow"><Wheat size={17} /> Harga bahan pokok</span>
        <h2 tabIndex="-1">Cek harga<br /><em>sebelum belanja.</em></h2>
        <p>Lihat harga referensi pasar tradisional dari PIHPS Bank Indonesia. Di dashboard, Anda bisa memilih provinsi dan melihat tanggal publikasi tiap bahan.</p>
        <a href={app + '#market'} className="land-button primary">Buka Harga Pasar <ArrowUpRight size={17} /></a>
      </div>
      <div className="land-market-card">
        <div className="land-card-heading"><span className="land-icon"><Wheat size={21} /></span><div><strong>Harga pasar</strong><small><MapPin size={12} /> Nasional · Pasar tradisional</small></div></div>
        {prices === null ? <p className="land-market-message" role="status">Memuat harga dari PIHPS…</p> : prices.length ? <dl className="land-price-list">
          {prices.map(item => <div key={item.name}><dt>{item.name}{item.latest && <small>{dateLabel(item.latest.date)}</small>}</dt>
            <dd>{item.latest ? <>{money(item.latest.price)}<small>per {item.unit}</small></> : 'Belum tersedia'}</dd></div>)}
        </dl> : <p className="land-market-message">Data harga sedang belum tersedia. Coba cek lagi melalui menu Harga Pasar.</p>}
        <a className="land-inline" href="https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalDaerah" target="_blank" rel="noreferrer">Sumber: PIHPS Bank Indonesia <ArrowUpRight size={13} /></a>
      </div>
    </div>
  </section>;
}

export function AssistantSection({ app }) {
  const [topic, setTopic] = useState(0);
  return <section id="asisten" className="land-screen land-assistant">
    <div className="land-wrap land-split">
      <div className="land-section-copy">
        <span className="land-eyebrow"><Sparkles size={17} /> Asisten MAVIQ</span>
        <h2 tabIndex="-1">Ada yang ingin <em>ditanyakan?</em></h2>
        <p>Tanya soal stok, kas, atau penjualan langsung dari data kedai.</p>
        <a href={app} className="land-button primary">Coba asisten <ArrowRight size={17} /></a>
      </div>
      <div className="land-assistant-card">
        <div className="land-card-heading"><img src="/maviq-maskot.webp" width="70" height="56" alt="" loading="lazy" /><div><strong>Asisten MAVIQ</strong><small>Contoh percakapan · Kedai Nusa</small></div></div>
        <div className="land-chat-example" aria-live="polite"><p>{topics[topic][0]}</p><p>{topics[topic][1]}</p></div>
        <div className="land-chat-topics" aria-label="Pilih pertanyaan contoh">
          {topics.map(([question], index) => <button type="button" key={question} aria-pressed={topic === index} onClick={() => setTopic(index)}>{question}</button>)}
        </div>
      </div>
    </div>
  </section>;
}

export function FaqSection() {
  return <section id="faq" className="land-screen land-faq">
    <div className="land-wrap land-split">
      <div className="land-section-copy"><span className="land-eyebrow"><CircleHelp size={17} /> FAQ</span>
        <h2 tabIndex="-1">Sebelum <em>mulai.</em></h2><p>Jawaban tentang demo, pembelian, sumber harga, dan asisten MAVIQ.</p></div>
      <div className="land-faq-list">{questions.map(([question, answer]) =>
        <details name="maviq-faq" key={question}><summary>{question}<Plus size={17} aria-hidden="true" /></summary><p>{answer}</p></details>
      )}</div>
    </div>
  </section>;
}
