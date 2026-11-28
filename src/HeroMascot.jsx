import { useEffect, useState } from 'react';

export default function HeroMascot() {
  const [blinking, setBlinking] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let timer;

    function schedule() {
      if (motion.matches || document.hidden) return;
      const delay = 2400 + Math.random() * 4200;
      timer = window.setTimeout(() => {
        setBlinking(true);
        timer = window.setTimeout(() => {
          setBlinking(false);
          schedule();
        }, 155);
      }, delay);
    }

    function reset() {
      window.clearTimeout(timer);
      setBlinking(false);
      schedule();
    }

    schedule();
    motion.addEventListener('change', reset);
    document.addEventListener('visibilitychange', reset);
    return () => {
      window.clearTimeout(timer);
      motion.removeEventListener('change', reset);
      document.removeEventListener('visibilitychange', reset);
    };
  }, []);

  return (
    <div
      className="desktop-hero-logo"
      data-blinking={blinking}
      aria-hidden="true"
    >
      <img
        src="/maviq-hero-open.svg"
        width="324"
        height="324"
        fetchPriority="high"
        alt=""
      />
      <img
        className="hero-blink-frame"
        src="/maviq.svg"
        width="324"
        height="324"
        alt=""
      />
    </div>
  );
}
