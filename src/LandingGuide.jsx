import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CircleStop } from 'lucide-react';
import './landing-guide.css';

const idStops = [
  { id: 'demo-ruang-kerja', label: 'Demo ruang kerja', detail: 'Jelajahi pembelian, stok, dan briefing', line: 'Catat pembelian contoh, lalu cek perubahannya di inventaris dan briefing.' },
  { id: 'fitur', label: 'Fitur', detail: 'Lihat fitur utama MAVIQ', line: 'Mulai dari struk. Periksa draf pembelian sebelum stok dan kas diperbarui.' },
  { id: 'asisten', label: 'Asisten', detail: 'Coba pertanyaan contoh', line: 'Pilih satu contoh pertanyaan untuk melihat cara asisten menjawab soal stok dan kas.' },
  { id: 'tentang', label: 'Tentang MAVIQ', detail: 'Kenali platform untuk UMKM Indonesia', line: 'MAVIQ membantu UMKM mengelola operasional dan mengambil keputusan berdasarkan data.' },
  { id: 'kapabilitas', label: 'Kapabilitas', detail: 'Pilih alat yang ingin dijelajahi', line: 'Coba pilihan alat untuk pencatatan, harga pasar, inventaris, keuangan, HPP, dan rekomendasi AI.' },
  { id: 'jenis-usaha', label: 'Jenis usaha', detail: 'Lihat contoh dari sektor kuliner', line: 'Pilih contoh warung makan, kedai kopi, katering, toko roti, atau usaha makanan rumahan.' },
  { id: 'harga-pasar', label: 'Harga Pasar', detail: 'Lihat harga bahan pokok', line: 'Cek harga referensi pasar tradisional dari PIHPS sebelum belanja.' },
  { id: 'faq', label: 'FAQ', detail: 'Cari jawaban sebelum mulai', line: 'Di sini ada jawaban singkat tentang pendaftaran, scan struk, dan penggunaan data.' },
  { id: 'daftar', label: 'Daftar', detail: 'Buat akun dan ruang usaha', line: 'Mulai dengan akun Google atau email, lalu buat ruang kerja untuk usaha Anda.' }
];

const enStops = [
  ['Workspace demo','Explore purchases, stock and briefing','Record a sample purchase, then check what changed in inventory and the daily briefing.'],
  ['Features','Explore the tools','See what happens when you record a purchase or sale.'],
  ['Assistant','Ask a sample question','Choose a question to see how I explain the numbers.'],
  ['About MAVIQ','Meet the platform for Indonesian MSMEs','MAVIQ helps Indonesian small businesses run their operations and make decisions based on their data.'],
  ['Capabilities','Choose a tool to explore','Explore recordkeeping, market prices, inventory, finance, production costs, and AI recommendations.'],
  ['Business types','See examples from the food sector','Choose a food stall, coffee shop, caterer, bakery, or home food business.'],
  ['Market prices','Check ingredient prices','Compare published prices before you shop.'],
  ['FAQ','Find an answer','Learn about sign-up, receipts and stock updates.'],
  ['Get started','Open your workspace','Sign up with Google or email to set up your business.']
].map(([label, detail, line], i) => ({id:idStops[i].id,label,detail,line}));

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function placePopup(mascot, popup) {
  const anchor = mascot.getBoundingClientRect();
  const edge = 10;
  const gap = 8;
  const width = popup.offsetWidth;
  const height = popup.scrollHeight + popup.offsetHeight - popup.clientHeight;
  const spaceAbove = anchor.top - gap - edge;
  const spaceBelow = window.innerHeight - anchor.bottom - gap - edge;
  const centered = clamp(anchor.left + (anchor.width - width) / 2, edge, window.innerWidth - width - edge);
  let left = centered;
  let top;
  let maxHeight = window.innerHeight - edge * 2;

  if (height <= spaceAbove) {
    top = anchor.top - gap - height;
  } else if (height <= spaceBelow) {
    top = anchor.bottom + gap;
  } else if (anchor.right + gap + width <= window.innerWidth - edge || anchor.left - gap - width >= edge) {
    left = anchor.right + gap + width <= window.innerWidth - edge ? anchor.right + gap : anchor.left - gap - width;
    top = clamp(anchor.top + (anchor.height - height) / 2, edge, window.innerHeight - height - edge);
  } else if (spaceAbove >= spaceBelow) {
    top = edge;
    maxHeight = spaceAbove;
  } else {
    top = anchor.bottom + gap;
    maxHeight = spaceBelow;
  }

  popup.style.left = left + 'px';
  popup.style.top = top + 'px';
  popup.style.maxHeight = maxHeight + 'px';
}

function scrollToStop(id, focusHeading = false) {
  const section = document.getElementById(id);
  if (!section) return;
  if (focusHeading) {
    const heading = section.querySelector('h1, h2');
    heading?.focus({ preventScroll: true });
  }
  section.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
}

function currentHint(stops,en) {
  const stop = [...stops].reverse().find(({ id }) => {
    const area = document.getElementById(id)?.getBoundingClientRect();
    return area && area.top < window.innerHeight * .55;
  });
  return stop?.line || (en ? 'Hi, I’m MAVIQ! Tap me for a quick tour.' : 'Halo, saya MAVIQ! Klik saya untuk tur singkat.');
}

export default function LandingGuide({en}) {
  const stops = en ? enStops : idStops;
  const [menu, setMenu] = useState(false);
  const [tour, setTour] = useState(null);
  const [hint, setHint] = useState('');
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const guide = useRef(null);
  const mascot = useRef(null);
  const popup = useRef(null);
  const firstOption = useRef(null);
  const stopTourButton = useRef(null);
  const activePointer = useRef(null);
  const skipClick = useRef(false);

  const setOnScreen = (x, y) => {
    const { width, height } = mascot.current.getBoundingClientRect();
    setPosition({ x: clamp(x, 8, window.innerWidth - width - 8), y: clamp(y, 8, window.innerHeight - height - 8) });
  };
  useEffect(() => {
    if (!position) return;
    const keepOnScreen = () => setOnScreen(position.x, position.y);
    window.addEventListener('resize', keepOnScreen);
    return () => window.removeEventListener('resize', keepOnScreen);
  }, [position]);

  const showHint = Boolean(hint && !menu && tour === null && !dragging);
  useLayoutEffect(() => {
    const panel = popup.current;
    const anchor = mascot.current;
    if (!panel || !anchor) return;
    const update = () => placePopup(anchor, panel);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(anchor);
    observer.observe(panel);
    window.addEventListener('resize', update);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', update);
    };
  }, [position, menu, tour, showHint, hint]);

  useEffect(() => {
    if (!menu) return;
    firstOption.current?.focus({ preventScroll: true });
    const dismiss = event => {
      if (!guide.current?.contains(event.target)) setMenu(false);
    };
    window.addEventListener('pointerdown', dismiss);
    window.addEventListener('focusin', dismiss);
    return () => {
      window.removeEventListener('pointerdown', dismiss);
      window.removeEventListener('focusin', dismiss);
    };
  }, [menu]);

  useEffect(() => {
    if (tour === null) return;
    scrollToStop(stops[tour].id);
    if (tour === 0) stopTourButton.current?.focus({ preventScroll: true });
    const restoreTourFocus = () => {
      if (document.activeElement === stopTourButton.current) mascot.current?.focus({ preventScroll: true });
    };
    const timer = window.setTimeout(() => {
      if (tour === stops.length - 1) restoreTourFocus();
      setTour(tour === stops.length - 1 ? null : tour + 1);
    }, 6500);
    const stop = () => {
      window.scrollTo({ top: window.scrollY, behavior: 'instant' });
      restoreTourFocus();
      setTour(null);
    };
    const onKey = event => {
      if (['Escape', 'ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End'].includes(event.key)) stop();
    };
    window.addEventListener('wheel', stop, { passive: true });
    window.addEventListener('touchmove', stop, { passive: true });
    window.addEventListener('keydown', onKey);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('wheel', stop);
      window.removeEventListener('touchmove', stop);
      window.removeEventListener('keydown', onKey);
    };
  }, [tour]);

  const closeMenu = () => {
    setMenu(false);
    mascot.current.focus({ preventScroll: true });
  };
  const startTour = () => {
    closeMenu();
    setHint('');
    setTour(0);
  };
  const jump = id => {
    setMenu(false);
    setHint('');
    setTour(null);
    scrollToStop(id, true);
  };
  const finishPointer = event => {
    if (activePointer.current?.id !== event.pointerId) return;
    activePointer.current = null;
    setDragging(false);
  };

  return <aside ref={guide} className="land-guide" aria-label={en ? "Page guide" : "Panduan landing page"} onKeyDown={event => {
    if (event.key === 'Escape' && menu) closeMenu();
  }}>
    {showHint && <div ref={popup} id="land-guide-hint" className="land-guide-hint">{hint}</div>}
    <button ref={mascot} type="button" className={'land-guide-launcher' + (dragging ? ' dragging' : '')}
      style={position ? { left: position.x, top: position.y, bottom: 'auto', right: 'auto' } : undefined}
      aria-label={en ? "MAVIQ guide" : "Panduan MAVIQ"} aria-expanded={menu} aria-controls={menu ? 'land-guide-menu' : undefined}
      aria-describedby={showHint ? 'land-guide-hint' : undefined}
      onPointerEnter={event => { if (event.pointerType === 'mouse' && !activePointer.current && !menu && tour === null) setHint(currentHint(stops,en)); }}
      onPointerLeave={() => setHint('')}
      onPointerDown={event => {
        if (!event.isPrimary || event.button !== 0) return;
        const rect = event.currentTarget.getBoundingClientRect();
        skipClick.current = false;
        activePointer.current = { id: event.pointerId, pointerX: event.clientX, pointerY: event.clientY, x: rect.left, y: rect.top };
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event => {
        const start = activePointer.current;
        if (start?.id !== event.pointerId) return;
        const dx = event.clientX - start.pointerX;
        const dy = event.clientY - start.pointerY;
        if (!skipClick.current && Math.hypot(dx, dy) < 7) return;
        if (!skipClick.current) {
          skipClick.current = true;
          setDragging(true);
          setHint('');
        }
        setOnScreen(start.x + dx, start.y + dy);
      }}
      onPointerUp={finishPointer} onPointerCancel={finishPointer} onLostPointerCapture={finishPointer}
      onClick={event => {
        if (event.detail > 0 && skipClick.current) return;
        setHint('');
        setTour(null);
        if (menu) closeMenu();
        else setMenu(true);
      }}>
      <img src="/maviq-maskot.webp" width="125" height="100" alt="" draggable="false" />
    </button>
    {menu && <section ref={popup} id="land-guide-menu" className="land-guide-panel land-guide-options" aria-label={en ? "Guide menu" : "Menu panduan"}>
      <button ref={firstOption} type="button" aria-labelledby="guide-tour-label" aria-describedby="guide-tour-detail" onClick={startTour}>
        <strong id="guide-tour-label">{en ? "Start guided tour" : "Mulai tur otomatis"}</strong>
        <span id="guide-tour-detail">{en ? "I’ll show you around" : "Saya pandu bagian demi bagian"}</span>
      </button>
      {stops.map(stop => <button type="button" key={stop.id} aria-labelledby={'guide-label-' + stop.id}
        aria-describedby={'guide-detail-' + stop.id} onClick={() => jump(stop.id)}>
        <strong id={'guide-label-' + stop.id}>{stop.label}</strong>
        <span id={'guide-detail-' + stop.id}>{stop.detail}</span>
      </button>)}
      <button type="button" aria-labelledby="guide-top-label" aria-describedby="guide-top-detail" onClick={() => jump('beranda')}>
        <strong id="guide-top-label">{en ? "Back to top" : "Kembali ke atas"}</strong>
        <span id="guide-top-detail">{en ? "Return to the introduction" : "Lihat beranda lagi"}</span>
      </button>
    </section>}
    {tour !== null && <div ref={popup} className="land-guide-panel land-guide-tour">
      <div role="status" className="land-tour-status"><strong>{tour + 1} / {stops.length} · {stops[tour].label}</strong><p>{stops[tour].line}</p></div>
      <button ref={stopTourButton} type="button" className="land-guide-stop" onClick={() => {
        window.scrollTo({ top: window.scrollY, behavior: 'instant' });
        setTour(null);
        mascot.current.focus({ preventScroll: true });
      }}><CircleStop size={16} /> {en ? "Stop tour" : "Hentikan tur"}</button>
    </div>}
  </aside>;
}
