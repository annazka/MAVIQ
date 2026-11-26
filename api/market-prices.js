import { marketPrices } from '../lib/market-prices.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  const send = (status, body) => {
    res.statusCode = status;
    res.end(JSON.stringify(body));
  };
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    send(405, { error: 'Metode tidak didukung.' });
    return;
  }
  try {
    const query = new URL(req.url, 'http://localhost').searchParams;
    const data = await marketPrices(query.get('region') ?? undefined, query.get('date') ?? undefined);
    if (!data) {
      send(400, { error: 'Pilih wilayah PIHPS dan tanggal dalam 365 hari terakhir.' });
      return;
    }
    res.setHeader('Vercel-CDN-Cache-Control', 'max-age=900, stale-while-revalidate=3600');
    send(200, data);
  } catch {
    send(502, { error: 'Harga pasar sedang tidak dapat diambil dari PIHPS. Coba lagi.' });
  }
}
