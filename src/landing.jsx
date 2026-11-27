import { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight,
  ArrowDown,
  ScanLine,
  Coffee,
  ChartNoAxesCombined,
  Plus,
  Languages,
} from 'lucide-react';
import '@fontsource-variable/plus-jakarta-sans';
import '@fontsource/instrument-serif/400-italic.css';
import './landing.css';
import './mascot.css';
import LandingGuide from './LandingGuide.jsx';
import { BusinessSections } from './business-sections.jsx';
import { MarketSection } from './landing-sections.jsx';

const app = '/app/',
  signIn = app + '?mode=masuk',
  signUp = app + '?mode=daftar';
const mascot = '/maviq-maskot.webp';
const appSections = new Set([
  '#dashboard',
  '#sales',
  '#purchases',
  '#stock',
  '#products',
  '#cash',
  '#market',
]);
const texts = {
  en: {
    title: 'MAVIQ — Small Business, Smarter Decisions.',
    intro: 'Small Business,',
    accent: 'Smarter Decisions.',
    lead: 'I’m MAVIQ, your AI-powered platform for running a small business in Indonesia. Manage records, stock, market prices, production costs and cash, then decide what to do next.',
    features: 'Features',
    flow: 'How it works',
    market: 'Market prices',
    login: 'Sign in',
    signup: 'Get started',
    tour: 'Explore MAVIQ',
    skip: 'Skip to content',
    home: 'Home',
    hello: 'Hey, I’m MAVIQ!',
    note: 'For Indonesian MSMEs',
    shift: 'From receipts to decisions.',
    examples: 'Follow a sample day at a food business.',
    steps: [
      [
        'Morning delivery',
        'Review a receipt',
        'Check quantities and prices before confirming. Once saved, ingredients enter stock and the payment comes out of cash.',
      ],
      [
        'First order',
        'Record a sale',
        'Choose a product and quantity. Its recipe determines the ingredients used and the estimated cost per serving.',
      ],
      [
        'Closing time',
        'Read your briefing',
        'See your sales, estimated gross profit and cash balance, then check which ingredients are running low.',
      ],
    ],
    ask: 'Ask your companion.',
    sample: 'Sample conversation · Nusa Bakery',
    questions: [
      [
        'What’s running low?',
        'You have 1.2 kg of flour left. Check your stock before the next rush.',
      ],
      [
        'How much cash is there?',
        'The bakery’s cash balance is Rp5,244,000. Open Finance to see the money coming in and going out.',
      ],
    ],
    faq: 'Before you get started',
    faqs: [
      [
        'How do I get started?',
        'Sign up with Google or email, then enter your business name and opening balance.',
      ],
      [
        'Can I correct a scanned receipt?',
        'Yes. Review and edit the draft before confirming the purchase. You can also record purchases manually.',
      ],
      [
        'Can the assistant change my records?',
        'You confirm and cancel transactions in your dashboard. The assistant helps you read the results.',
      ],
    ],
    close: 'Ready to run your business with MAVIQ?',
    alt: 'MAVIQ, the robot that guides you through the platform',
    scene: 'Open your business workspace',
    nav: 'Main navigation',
  },
  id: {
    title: 'MAVIQ — Bantu UMKM ambil keputusan',
    intro: 'Usaha Kecil,',
    accent: 'Keputusan Lebih Cerdas.',
    lead: 'Aku MAVIQ, platform berbasis AI untuk UMKM Indonesia. Kelola catatan, stok, harga pasar, HPP, dan kas, lalu tentukan langkah berikutnya.',
    features: 'Fitur',
    flow: 'Cara kerja',
    market: 'Harga pasar',
    login: 'Masuk',
    signup: 'Mulai sekarang',
    tour: 'Kenali MAVIQ',
    skip: 'Langsung ke konten',
    home: 'Beranda',
    hello: 'Halo, aku MAVIQ!',
    note: 'Untuk UMKM Indonesia',
    shift: 'Dari struk ke keputusan.',
    examples: 'Ikuti contoh kegiatan harian usaha kuliner.',
    steps: [
      [
        'Belanja pagi',
        'Periksa struk',
        'Periksa jumlah dan harga sebelum konfirmasi. Setelah disimpan, bahan masuk ke stok dan pembayaran mengurangi kas.',
      ],
      [
        'Pesanan pertama',
        'Catat penjualan',
        'Pilih produk dan jumlah pesanan. Resep menentukan bahan yang terpakai dan estimasi biaya per porsi.',
      ],
      [
        'Menjelang tutup',
        'Baca briefing',
        'Lihat penjualan, estimasi laba kotor, dan saldo kas, lalu cek bahan yang mulai menipis.',
      ],
    ],
    ask: 'Tanya asisten usahamu.',
    sample: 'Contoh percakapan · Toko Roti Nusa',
    questions: [
      [
        'Stok apa yang menipis?',
        'Tepung terigu tersisa 1,2 kg. Cek stok sebelum jam ramai berikutnya.',
      ],
      [
        'Berapa saldo kas?',
        'Saldo kas toko roti Rp5.244.000. Buka Keuangan untuk melihat rincian kas masuk dan keluar.',
      ],
    ],
    faq: 'Sebelum mulai',
    faqs: [
      [
        'Bagaimana cara memulai?',
        'Daftar dengan Google atau email, lalu masukkan nama usaha dan saldo awal.',
      ],
      [
        'Bisa koreksi hasil scan struk?',
        'Bisa. Periksa dan ubah draf sebelum konfirmasi pembelian. Pembelian juga bisa dicatat manual.',
      ],
      [
        'Apakah asisten bisa mengubah catatan saya?',
        'Kamu mengonfirmasi dan membatalkan transaksi lewat dashboard. Asisten membantu membaca hasilnya.',
      ],
    ],
    close: 'Siap kelola usaha dengan MAVIQ?',
    alt: 'MAVIQ, robot pemandu platform',
    scene: 'Buka ruang kerja usahamu',
    nav: 'Navigasi utama',
  },
};
const symbols = [ScanLine, Coffee, ChartNoAxesCombined];
function Landing() {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('maviq.landing.language') === 'id'
        ? 'id'
        : 'en';
    } catch {
      return 'en';
    }
  });
  const [step, setStep] = useState(0),
    [question, setQuestion] = useState(0);
  const t = texts[lang],
    en = lang === 'en',
    Symbol = symbols[step];
  useEffect(() => {
    document.documentElement.lang = lang;
    document.title = t.title;
    document.querySelector('meta[name=description]').content = t.lead;
    try {
      localStorage.setItem('maviq.landing.language', lang);
    } catch {}
  }, [lang, t]);
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter(({ isIntersecting }) => isIntersecting)
          .forEach(({ target }) => {
            target.classList.add('revealed');
            observer.unobserve(target);
          });
      },
      { threshold: 0.15 },
    );
    document
      .querySelectorAll('[data-reveal]')
      .forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);
  const cta = (
    <a className="go" href={signUp}>
      {t.signup}
      <ArrowRight size={18} />
    </a>
  );
  return (
    <div className="companion" id="beranda">
      <a className="land-skip" href="#konten">
        {t.skip}
      </a>
      <header className="mast">
        <a
          className="wordmark"
          href="#beranda"
          aria-label={'MAVIQ · ' + t.home}
        >
          <img src="/maviq.svg" width="32" height="32" alt="" />
          MAVIQ
        </a>
        <nav aria-label={t.nav}>
          <a href="#kapabilitas">{t.features}</a>
          <a href="#harga-pasar">{t.market}</a>
          <a href="#faq">FAQ</a>
        </nav>
        <div className="controls">
          <label>
            <Languages size={17} />
            <select
              aria-label={en ? 'Language' : 'Bahasa'}
              value={lang}
              onChange={(e) => setLang(e.target.value)}
            >
              <option value="en">English</option>
              <option value="id">Bahasa Indonesia</option>
            </select>
          </label>
          <a href={signIn}>{t.login}</a>
        </div>
      </header>
      <main id="konten">
        <section className="poster" id="ringkasan">
          <div className="pitch">
            <span className="hero-scope">{t.note}</span>
            <h1>
              {t.intro}
              <br />
              <em>{t.accent}</em>
            </h1>
            <p>{t.lead}</p>
            <div className="cta-row">
              {cta}
              <a href="#tentang">
                {t.tour} <ArrowDown size={16} />
              </a>
            </div>
          </div>
          <figure className="robot-stage">
            <span className="speech">{t.hello}</span>
            <img
              src="/maviq-maskot-hd.webp"
              srcSet="/maviq-maskot.webp 420w, /maviq-maskot-hd.webp 1260w"
              sizes="(max-width: 760px) 320px, 480px"
              width="1260"
              height="1236"
              fetchPriority="high"
              alt={t.alt}
            />
          </figure>
        </section>
        <BusinessSections lang={lang} />
        <section data-reveal className="shift frame" id="fitur">
          <div>
            <h2 tabIndex="-1">{t.shift}</h2>
            <p>{t.examples}</p>
          </div>
          <div className="shift-grid" id="cara-kerja">
            <div className="choices">
              {t.steps.map(([label], i) => {
                const Icon = symbols[i];
                return (
                  <button
                    key={i}
                    aria-pressed={step === i}
                    onClick={() => setStep(i)}
                  >
                    <Icon size={21} />
                    {label}
                    <ArrowRight size={18} />
                  </button>
                );
              })}
            </div>
            <div aria-live="polite">
              <article className="panel-change" key={step}>
                <Symbol size={27} />
                <h3>{t.steps[step][1]}</h3>
                <p>{t.steps[step][2]}</p>
              </article>
            </div>
          </div>
        </section>
        <section data-reveal className="conversation frame" id="asisten">
          <div>
            <h2 tabIndex="-1">{t.ask}</h2>
            <p>{t.sample}</p>
            <img src={mascot} alt="" loading="lazy" width="148" height="145" />
          </div>
          <div>
            <div className="prompts">
              {t.questions.map(([q], i) => (
                <button
                  aria-pressed={question === i}
                  key={i}
                  onClick={() => setQuestion(i)}
                >
                  {q}
                </button>
              ))}
            </div>
            <div aria-live="polite">
              <blockquote className="panel-change" key={question}>
                {t.questions[question][1]}
              </blockquote>
            </div>
          </div>
        </section>
        <MarketSection app={app} en={en} />
        <section data-reveal className="frame qna" id="faq">
          <h2 tabIndex="-1">{t.faq}</h2>
          <div>
            {t.faqs.map(([q, a], i) => (
              <details key={i}>
                <summary>
                  {q}
                  <Plus size={18} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="last" id="daftar">
          <img src={mascot} alt="" width="88" height="86" />
          <h2 tabIndex="-1">{t.close}</h2>
          {cta}
        </section>
      </main>
      <LandingGuide key={lang} en={en} />
    </div>
  );
}
const hash = location.hash;
const params = new URLSearchParams(location.search);
if (
  appSections.has(hash) ||
  hash.startsWith('#access_token=') ||
  params.has('code') ||
  ['masuk', 'daftar', 'oauth', 'aktivasi', 'pemulihan'].includes(
    params.get('mode'),
  )
) {
  location.replace(app + location.search + hash);
} else {
  createRoot(document.getElementById('root')).render(<Landing />);
}
