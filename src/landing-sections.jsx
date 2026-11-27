import { useEffect, useRef, useState } from 'react';
import { Wheat, MapPin, ArrowUpRight } from 'lucide-react';
const featuredMarkets = ['Beras', 'Telur Ayam', 'Gula Pasir'];

export function MarketSection({ app, en }) {
  const section = useRef(null);
  const [visible, setVisible] = useState(false);
  const [prices, setPrices] = useState(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '240px' },
    );
    observer.observe(section.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (!visible) return;
    const controller = new AbortController();
    fetch('/api/market-prices?region=national', { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error('Harga sedang tidak tersedia.');
        return response.json();
      })
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        if (!controller.signal.aborted)
          setPrices(
            featuredMarkets.map(
              (name) => items.find((item) => item.name === name) || { name },
            ),
          );
      })
      .catch(() => {
        if (!controller.signal.aborted) setPrices([]);
      });
    return () => controller.abort();
  }, [visible]);
  return (
    <section ref={section} data-reveal id="harga-pasar" className="land-screen land-market">
      <div className="land-wrap land-split">
        <div className="land-section-copy">
          <span className="land-eyebrow">
            <Wheat size={17} /> {en ? 'Ingredient prices' : 'Harga bahan pokok'}
          </span>
          <h2 tabIndex="-1">
            {en ? 'Check prices' : 'Cek harga'}
            <br />
            <em>{en ? 'before you shop.' : 'sebelum belanja.'}</em>
          </h2>
          <p>
            {en
              ? 'Compare traditional market prices from Bank Indonesia’s PIHPS. Open the dashboard to explore provinces and publication dates.'
              : 'Lihat harga referensi pasar tradisional dari PIHPS Bank Indonesia. Di dashboard, Anda bisa memilih provinsi dan melihat tanggal publikasi tiap bahan.'}
          </p>
          <a href={app + '#market'} className="land-button primary">
            {en ? 'Explore market prices' : 'Buka Harga Pasar'}{' '}
            <ArrowUpRight size={17} />
          </a>
        </div>
        <div className="land-market-card">
          <div className="land-card-heading">
            <span className="land-icon">
              <Wheat size={21} />
            </span>
            <div>
              <strong>{en ? 'Market prices' : 'Harga pasar'}</strong>
              <small>
                <MapPin size={12} />{' '}
                {en
                  ? 'National · Traditional markets'
                  : 'Nasional · Pasar tradisional'}
              </small>
            </div>
          </div>
          {prices === null ? (
            <p className="land-market-message" role="status">
              {en ? 'Loading PIHPS prices…' : 'Memuat harga dari PIHPS…'}
            </p>
          ) : prices.length ? (
            <dl className="land-price-list">
              {prices.map((item) => (
                <div key={item.name}>
                  <dt>
                    {en
                      ? {
                          Beras: 'Rice',
                          'Telur Ayam': 'Chicken eggs',
                          'Gula Pasir': 'Sugar',
                        }[item.name] || item.name
                      : item.name}
                    {item.latest && (
                      <small>
                        {new Date(item.latest.date).toLocaleDateString(
                          en ? 'en-GB' : 'id-ID',
                          { timeZone: 'Asia/Jakarta' },
                        )}
                      </small>
                    )}
                  </dt>
                  <dd>
                    {item.latest ? (
                      <>
                        {new Intl.NumberFormat(en ? 'en-ID' : 'id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          maximumFractionDigits: 0,
                        }).format(item.latest.price)}
                        <small>per {item.unit}</small>
                      </>
                    ) : en ? (
                      'Unavailable'
                    ) : (
                      'Belum tersedia'
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          ) : (
            <p className="land-market-message">
              {en
                ? 'Prices are currently unavailable. Check the market dashboard for updates.'
                : 'Data harga sedang belum tersedia. Coba cek lagi melalui menu Harga Pasar.'}
            </p>
          )}
          <a
            className="land-inline"
            href="https://www.bi.go.id/hargapangan/TabelHarga/PasarTradisionalDaerah"
            target="_blank"
            rel="noreferrer"
          >
            {en
              ? 'Source: Bank Indonesia PIHPS'
              : 'Sumber: PIHPS Bank Indonesia'}{' '}
            <ArrowUpRight size={13} />
          </a>
        </div>
      </div>
    </section>
  );
}
