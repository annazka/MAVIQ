import { jakartaDay, summarize } from './ledger.js';

const formatQuantity = value => new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(Number(value));
const rupiah = value => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0
}).format(Number(value));

export function chatContext(ledger, now = new Date()) {
  const day = jakartaDay(now);
  const { sales, gross, cash, cashIn, cashOut, low, entries } = summarize(ledger, day, day);
  return {
    day, sales, gross, cash, cashIn, cashOut, low,
    transactionCount: entries.filter(item => item.type !== 'opening').length
  };
}

export function chatPrompts({ low, transactionCount }, now = new Date()) {
  const hour = Number(new Intl.DateTimeFormat('en-GB', { hour: '2-digit', hourCycle: 'h23', timeZone: 'Asia/Jakarta' }).format(now));
  const greeting = hour < 4 || hour >= 19 ? 'Selamat malam' : hour < 11 ? 'Selamat pagi' : hour < 15 ? 'Selamat siang' : 'Selamat sore';
  const prompts = [];
  if (low.length) {
    const first = low[0];
    const state = Number(first.quantity) === 0 ? 'habis' : 'menipis';
    const others = low.length > 1 ? ' Ada ' + (low.length - 1) + ' bahan lain yang perlu dicek.' : '';
    prompts.push({ kind: 'stock', text: 'Stok ' + first.name + ' ' + state + '.' + others });
  }
  prompts.push({ kind: 'greeting', text: greeting + '! Gimana usaha hari ini?' });
  if (!transactionCount) prompts.push({ kind: 'activity', text: 'Belum ada transaksi hari ini. Mau mulai mencatat?' });
  prompts.push({ kind: 'help', text: 'Ada yang bisa saya bantu? Coba tanya soal stok, penjualan, atau harga pasar.' });
  return prompts;
}

export function chatTopic(text) {
  const question = text.toLowerCase();
  if (/harga pasar|bahan pokok|pihps/.test(question)) return 'market';
  if (/\bstok\b|\bhabis\b|persediaan/.test(question)) return 'stock';
  if (/\bkas\b|arus kas|saldo/.test(question)) return 'cash';
  if (/penjualan|laba|omzet|briefing|ringkasan/.test(question)) return 'summary';
  return null;
}

export function chatReply(topic, data) {
  switch (topic) {
    case 'stock': {
      if (!data.low.length) return { text: 'Saat ini belum ada bahan yang berada pada atau di bawah batas minimum.', action: 'stock' };
      const rows = data.low.slice(0, 5).map(item => '• ' + item.name + ': ' + formatQuantity(item.quantity) + ' ' + item.unit + ' (minimum ' + formatQuantity(item.minimum) + ' ' + item.unit + ')');
      if (data.low.length > rows.length) rows.push('• ' + (data.low.length - rows.length) + ' bahan lain di halaman stok.');
      return { text: 'Bahan yang perlu dicek:\n' + rows.join('\n'), action: 'stock' };
    }
    case 'market':
      return { text: 'Buka Harga Pasar untuk melihat harga referensi PIHPS Bank Indonesia. Tersedia filter provinsi, tanggal, dan komoditas.', action: 'market' };
    case 'cash':
      return { text: 'Saldo kas ' + rupiah(data.cash) + '. Hari ini kas masuk ' + rupiah(data.cashIn) + ' dan kas keluar ' + rupiah(data.cashOut) + '.', action: 'cash' };
    case 'summary':
      return {
        text: data.transactionCount ? 'Hari ini penjualan bersih ' + rupiah(data.sales) + ' dan estimasi laba kotor ' + rupiah(data.gross) + '.' : 'Belum ada transaksi hari ini. Setelah transaksi dicatat, ringkasannya akan muncul di Dashboard.',
        action: 'dashboard'
      };
    default:
      return { text: 'Coba tanya “Stok apa yang menipis?”, “Bagaimana penjualan hari ini?”, atau “Berapa saldo kas?”.' };
  }
}
