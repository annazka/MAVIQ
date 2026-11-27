import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import {
  ChevronsDown,
  CircleHelp,
  CircleStop,
  ListChecks,
  Play,
  X,
} from 'lucide-react';
import './landing-guide.css';

const idStops = [
  {
    id: 'demo-ruang-kerja',
    label: 'Demo ruang kerja',
    line: 'Catat pembelian contoh, lalu cek perubahannya di inventaris dan briefing.',
  },
  {
    id: 'fitur',
    label: 'Fitur',
    line: 'Mulai dari struk. Periksa draf pembelian sebelum stok dan kas diperbarui.',
  },
  {
    id: 'asisten',
    label: 'Asisten',
    line: 'Pilih satu contoh pertanyaan untuk melihat cara asisten menjawab soal stok dan kas.',
  },
  {
    id: 'tentang',
    label: 'Tentang MAVIQ',
    line: 'MAVIQ membantu UMKM mengelola operasional dan mengambil keputusan berdasarkan data.',
  },
  {
    id: 'kapabilitas',
    label: 'Kapabilitas',
    line: 'Coba pilihan alat untuk pencatatan, harga pasar, inventaris, keuangan, HPP, dan rekomendasi AI.',
  },
  {
    id: 'jenis-usaha',
    label: 'Jenis usaha',
    line: 'Pilih contoh warung makan, kedai kopi, katering, toko roti, atau usaha makanan rumahan.',
  },
  {
    id: 'harga-pasar',
    label: 'Harga Pasar',
    line: 'Cek harga referensi pasar tradisional dari PIHPS sebelum belanja.',
  },
  {
    id: 'faq',
    label: 'FAQ',
    line: 'Di sini ada jawaban singkat tentang pendaftaran, scan struk, dan penggunaan data.',
  },
  {
    id: 'daftar',
    label: 'Daftar',
    line: 'Mulai dengan akun Google atau email, lalu buat ruang kerja untuk usaha Anda.',
  },
];

const enStops = [
  [
    'Workspace demo',
    'Record a sample purchase, then check what changed in inventory and the daily briefing.',
  ],
  ['Features', 'See what happens when you record a purchase or sale.'],
  ['Assistant', 'Choose a question to see how I explain the numbers.'],
  [
    'About MAVIQ',
    'MAVIQ helps Indonesian small businesses run their operations and make decisions based on their data.',
  ],
  [
    'Capabilities',
    'Explore recordkeeping, market prices, inventory, finance, production costs, and AI recommendations.',
  ],
  [
    'Business types',
    'Choose a food stall, coffee shop, caterer, bakery, or home food business.',
  ],
  ['Market prices', 'Compare published prices before you shop.'],
  ['FAQ', 'Learn about sign-up, receipts and stock updates.'],
  ['Get started', 'Sign up with Google or email to set up your business.'],
].map(([label, line], index) => ({ id: idStops[index].id, label, line }));

const messages = {
  en: {
    scroll: 'Auto-scroll',
    about: 'What is MAVIQ?',
    capabilities: 'What can MAVIQ do?',
    demo: 'Try the demo',
    stop: 'Stop auto-scroll',
    close: 'Close answer',
    answer: 'Answer from MAVIQ',
    aboutText:
      'MAVIQ stands for Merchant Analytics & Venture Intelligence Quotient. I’m an AI-powered workspace for managing Indonesian MSMEs and making better business decisions, starting with food businesses.',
    capabilitiesText:
      'I can turn receipt photos into purchase drafts, track stock and market prices, estimate production costs, and summarize sales and cash flow. Ask me about your figures to help decide what to do next.',
  },
  id: {
    scroll: 'Gulir otomatis',
    about: 'Apa itu MAVIQ?',
    capabilities: 'MAVIQ bisa apa?',
    demo: 'Coba demo',
    stop: 'Hentikan gulir otomatis',
    close: 'Tutup jawaban',
    answer: 'Jawaban dari MAVIQ',
    aboutText:
      'MAVIQ adalah singkatan dari Merchant Analytics & Venture Intelligence Quotient. Aku platform berbasis AI untuk membantu UMKM Indonesia mengelola usaha dan mengambil keputusan, dengan fokus awal sektor kuliner.',
    capabilitiesText:
      'Aku bisa membuat draf pembelian dari foto struk, memantau stok dan harga pasar, menghitung estimasi HPP, serta merangkum penjualan dan arus kas. Kamu juga bisa bertanya tentang data usahamu untuk menentukan langkah berikutnya.',
  },
};

const clamp = (value, min, max) =>
  Math.min(Math.max(value, min), Math.max(min, max));
const reducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function placePopup(mascot, popup) {
  const anchor = mascot.getBoundingClientRect();
  const edge = 10;
  const gap = 8;
  const width = popup.offsetWidth;
  const height = popup.scrollHeight + popup.offsetHeight - popup.clientHeight;
  const spaceAbove = anchor.top - gap - edge;
  const spaceBelow = window.innerHeight - anchor.bottom - gap - edge;
  const centered = clamp(
    anchor.left + (anchor.width - width) / 2,
    edge,
    window.innerWidth - width - edge,
  );
  let left = centered;
  let top;
  let maxHeight = window.innerHeight - edge * 2;

  if (height <= spaceAbove) {
    top = anchor.top - gap - height;
  } else if (height <= spaceBelow) {
    top = anchor.bottom + gap;
  } else if (
    anchor.right + gap + width <= window.innerWidth - edge ||
    anchor.left - gap - width >= edge
  ) {
    left =
      anchor.right + gap + width <= window.innerWidth - edge
        ? anchor.right + gap
        : anchor.left - gap - width;
    top = clamp(
      anchor.top + (anchor.height - height) / 2,
      edge,
      window.innerHeight - height - edge,
    );
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
  section.scrollIntoView({
    behavior: reducedMotion() ? 'instant' : 'smooth',
    block: 'start',
  });
}

function TypedAnswer({ text }) {
  const [visible, setVisible] = useState(() =>
    reducedMotion() ? text.length : 0,
  );

  useEffect(() => {
    if (reducedMotion()) return;
    let count = 0;
    const timer = window.setInterval(() => {
      count += 1;
      setVisible(count);
      if (count >= text.length) window.clearInterval(timer);
    }, 16);
    return () => window.clearInterval(timer);
  }, [text]);

  const typing = visible < text.length;
  return (
    <>
      <p className="land-answer-text" aria-hidden="true">
        <span className="land-answer-size">{text}</span>
        <span className={typing ? 'land-answer-typing' : undefined}>
          {text.slice(0, visible)}
        </span>
      </p>
      <span className="land-answer-status" role="status">
        {typing ? '' : text}
      </span>
    </>
  );
}

export default function LandingGuide({ en }) {
  const stops = en ? enStops : idStops;
  const copy = messages[en ? 'en' : 'id'];
  const [menu, setMenu] = useState(false);
  const [tour, setTour] = useState(null);
  const [topic, setTopic] = useState(null);
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const guide = useRef(null);
  const mascot = useRef(null);
  const popup = useRef(null);
  const firstOption = useRef(null);
  const closeAnswerButton = useRef(null);
  const stopTourButton = useRef(null);
  const activePointer = useRef(null);
  const skipClick = useRef(false);

  const setOnScreen = (x, y) => {
    const { width, height } = mascot.current.getBoundingClientRect();
    setPosition({
      x: clamp(x, 8, window.innerWidth - width - 8),
      y: clamp(y, 8, window.innerHeight - height - 8),
    });
  };
  useEffect(() => {
    if (!position) return;
    const keepOnScreen = () => setOnScreen(position.x, position.y);
    window.addEventListener('resize', keepOnScreen);
    return () => window.removeEventListener('resize', keepOnScreen);
  }, [position]);

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
  }, [position, menu, tour, topic]);

  useEffect(() => {
    if (!menu) return;
    firstOption.current?.focus({ preventScroll: true });
    const dismiss = (event) => {
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
      if (document.activeElement === stopTourButton.current)
        mascot.current?.focus({ preventScroll: true });
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
    const onKey = (event) => {
      if (
        [
          'Escape',
          'ArrowUp',
          'ArrowDown',
          'PageUp',
          'PageDown',
          'Home',
          'End',
        ].includes(event.key)
      )
        stop();
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

  useEffect(() => {
    if (topic) closeAnswerButton.current?.focus({ preventScroll: true });
  }, [topic]);

  const closePanel = () => {
    setMenu(false);
    setTopic(null);
    mascot.current.focus({ preventScroll: true });
  };
  const startTour = () => {
    closePanel();
    setTour(0);
  };
  const explain = (answer) => {
    setMenu(false);
    setTopic(answer);
  };
  const openDemo = () => {
    closePanel();
    scrollToStop('demo-ruang-kerja', true);
  };
  const finishPointer = (event) => {
    if (activePointer.current?.id !== event.pointerId) return;
    activePointer.current = null;
    setDragging(false);
  };

  return (
    <aside
      ref={guide}
      className="land-guide"
      aria-label={en ? 'Page guide' : 'Panduan landing page'}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && (menu || topic)) closePanel();
      }}
    >
      <button
        ref={mascot}
        type="button"
        className={'land-guide-launcher' + (dragging ? ' dragging' : '')}
        style={
          position
            ? {
                left: position.x,
                top: position.y,
                bottom: 'auto',
                right: 'auto',
              }
            : undefined
        }
        aria-label={en ? 'MAVIQ guide' : 'Panduan MAVIQ'}
        aria-expanded={menu}
        aria-controls={menu ? 'land-guide-menu' : undefined}
        onPointerDown={(event) => {
          if (!event.isPrimary || event.button !== 0) return;
          const rect = event.currentTarget.getBoundingClientRect();
          skipClick.current = false;
          activePointer.current = {
            id: event.pointerId,
            pointerX: event.clientX,
            pointerY: event.clientY,
            x: rect.left,
            y: rect.top,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          const start = activePointer.current;
          if (start?.id !== event.pointerId) return;
          const dx = event.clientX - start.pointerX;
          const dy = event.clientY - start.pointerY;
          if (!skipClick.current && Math.hypot(dx, dy) < 7) return;
          if (!skipClick.current) {
            skipClick.current = true;
            setDragging(true);
          }
          setOnScreen(start.x + dx, start.y + dy);
        }}
        onPointerUp={finishPointer}
        onPointerCancel={finishPointer}
        onLostPointerCapture={finishPointer}
        onClick={(event) => {
          if (event.detail > 0 && skipClick.current) return;
          if (tour !== null)
            window.scrollTo({ top: window.scrollY, behavior: 'instant' });
          setTour(null);
          if (menu) closePanel();
          else {
            setTopic(null);
            setMenu(true);
          }
        }}
      >
        <img
          src="/maviq-maskot.webp"
          width="125"
          height="100"
          alt=""
          draggable="false"
        />
      </button>
      {menu && (
        <section
          ref={popup}
          id="land-guide-menu"
          className="land-guide-panel land-guide-options"
          aria-label={en ? 'Guide menu' : 'Menu panduan'}
        >
          <button ref={firstOption} type="button" onClick={startTour}>
            <ChevronsDown size={17} aria-hidden="true" />
            {copy.scroll}
          </button>
          <button type="button" onClick={() => explain('about')}>
            <CircleHelp size={17} aria-hidden="true" />
            {copy.about}
          </button>
          <button type="button" onClick={() => explain('capabilities')}>
            <ListChecks size={17} aria-hidden="true" />
            {copy.capabilities}
          </button>
          <button type="button" onClick={openDemo}>
            <Play size={17} aria-hidden="true" />
            {copy.demo}
          </button>
        </section>
      )}
      {topic && (
        <section
          ref={popup}
          className="land-guide-panel land-guide-answer"
          aria-label={copy.answer}
        >
          <div className="land-answer-header">
            <strong>{copy[topic]}</strong>
            <button
              ref={closeAnswerButton}
              type="button"
              aria-label={copy.close}
              onClick={closePanel}
            >
              <X size={17} aria-hidden="true" />
            </button>
          </div>
          <TypedAnswer key={topic} text={copy[topic + 'Text']} />
        </section>
      )}
      {tour !== null && (
        <div ref={popup} className="land-guide-panel land-guide-tour">
          <div role="status" className="land-tour-status">
            <strong>
              {tour + 1} / {stops.length} · {stops[tour].label}
            </strong>
            <p>{stops[tour].line}</p>
          </div>
          <button
            ref={stopTourButton}
            type="button"
            className="land-guide-stop"
            onClick={() => {
              window.scrollTo({ top: window.scrollY, behavior: 'instant' });
              setTour(null);
              mascot.current.focus({ preventScroll: true });
            }}
          >
            <CircleStop size={16} /> {copy.stop}
          </button>
        </div>
      )}
    </aside>
  );
}
