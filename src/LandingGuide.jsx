import { useEffect, useRef, useState } from 'react';
import { CircleStop } from 'lucide-react';
import './landing-guide.css';

const stops = [
  { id: 'fitur', label: 'Fitur', detail: 'Lihat fitur utama MAVIQ', line: 'Mulai dari struk. Periksa draf pembelian sebelum stok dan kas diperbarui.' },
  { id: 'cara-kerja', label: 'Cara kerja', detail: 'Ikuti alur pencatatan kedai', line: 'Catat belanja dan penjualan, lalu cek stok, HPP, dan saldo kas.' },
  { id: 'demo', label: 'Demo', detail: 'Coba dengan data simulasi', line: 'Mau mencoba sendiri? Kedai Nusa sudah punya data simulasi untuk Anda jelajahi.' }
];

const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function scrollToStop(id, focusHeading = false) {
  const section = document.getElementById(id);
  if (!section) return;
  if (focusHeading) {
    const heading = section.querySelector('h1, h2');
    heading?.focus({ preventScroll: true });
  }
  section.scrollIntoView({ behavior: reducedMotion() ? 'instant' : 'smooth', block: 'start' });
}

function currentHint() {
  const stop = [...stops].reverse().find(({ id }) => {
    const area = document.getElementById(id)?.getBoundingClientRect();
    return area && area.top < window.innerHeight * .55;
  });
  return stop?.line || 'Halo, saya MAVIQ! Klik saya untuk tur singkat.';
}

export default function LandingGuide() {
  const [menu, setMenu] = useState(false);
  const [tour, setTour] = useState(null);
  const [hint, setHint] = useState('');
  const [position, setPosition] = useState(null);
  const [dragging, setDragging] = useState(false);
  const guide = useRef(null);
  const mascot = useRef(null);
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

  return <aside ref={guide} className="land-guide" aria-label="Panduan landing page" onKeyDown={event => {
    if (event.key === 'Escape' && menu) closeMenu();
  }}>
    {hint && !menu && tour === null && !dragging && <div id="land-guide-hint" className="land-guide-hint" style={position ? {
      left: clamp(position.x + 45 - 114, 10, window.innerWidth - Math.min(228, window.innerWidth - 20) - 10),
      ...(position.y > 120 ? { top: position.y - 8, transform: 'translateY(-100%)' } : { top: position.y + 98 })
    } : undefined}>{hint}</div>}
    <button ref={mascot} type="button" className={'land-guide-launcher' + (dragging ? ' dragging' : '')}
      style={position ? { left: position.x, top: position.y, bottom: 'auto', right: 'auto' } : undefined}
      aria-label="Panduan MAVIQ" aria-expanded={menu} aria-controls={menu ? 'land-guide-menu' : undefined}
      aria-describedby={hint && !menu && tour === null ? 'land-guide-hint' : undefined}
      onPointerEnter={event => { if (event.pointerType === 'mouse' && !activePointer.current && !menu && tour === null) setHint(currentHint()); }}
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
      <img src="/maviq-maskot.webp" width="110" height="90" alt="" draggable="false" />
      <span className="land-guide-label">Panduan</span>
    </button>
    {menu && <section id="land-guide-menu" className="land-guide-panel land-guide-options" aria-label="Menu panduan">
      <button ref={firstOption} type="button" aria-labelledby="guide-tour-label" aria-describedby="guide-tour-detail" onClick={startTour}>
        <strong id="guide-tour-label">Mulai tur otomatis</strong>
        <span id="guide-tour-detail">Saya pandu bagian demi bagian</span>
      </button>
      {stops.map(stop => <button type="button" key={stop.id} aria-labelledby={'guide-label-' + stop.id}
        aria-describedby={'guide-detail-' + stop.id} onClick={() => jump(stop.id)}>
        <strong id={'guide-label-' + stop.id}>{stop.label}</strong>
        <span id={'guide-detail-' + stop.id}>{stop.detail}</span>
      </button>)}
      <button type="button" aria-labelledby="guide-top-label" aria-describedby="guide-top-detail" onClick={() => jump('beranda')}>
        <strong id="guide-top-label">Kembali ke atas</strong>
        <span id="guide-top-detail">Lihat beranda lagi</span>
      </button>
    </section>}
    {tour !== null && <div className="land-guide-panel land-guide-tour">
      <div role="status" className="land-tour-status"><strong>{tour + 1} / {stops.length} · {stops[tour].label}</strong><p>{stops[tour].line}</p></div>
      <button ref={stopTourButton} type="button" className="land-guide-stop" onClick={() => {
        window.scrollTo({ top: window.scrollY, behavior: 'instant' });
        setTour(null);
        mascot.current.focus({ preventScroll: true });
      }}><CircleStop size={16} /> Hentikan tur</button>
    </div>}
  </aside>;
}
