import { ArrowDownLeft, ArrowUpRight, CircleAlert, Coins, Package, ReceiptText, Repeat2, ShoppingBag, Wallet } from 'lucide-react';
import { types } from '../lib/ledger.js';

const rupiah = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 });
const number = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 });
export const money = value => (Number(value) < 0 ? '−' : '') + 'Rp' + rupiah.format(Math.abs(Number(value)));
export const amount = value => number.format(Number(value));
export const shortDate = date => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'short' }).format(new Date(date));
export const dateLabel = day => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(day + 'T12:00:00Z'));
export const clock = date => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' }).format(new Date(date)) + ' WIB';

export function Button({ icon: Icon, children, variant = 'secondary', className = '', ...props }) {
  return <button type="button" className={'button ' + variant + ' ' + className} {...props}>{Icon && <Icon size={17} aria-hidden="true" />}{children}</button>;
}

export function Empty({ icon: Icon = ReceiptText, title, children }) {
  return <div className="empty"><span className="tile mint"><Icon size={22} /></span><strong>{title}</strong>{children && <p>{children}</p>}</div>;
}

export const entryStyle = {
  sale: [ArrowDownLeft, 'mint'],
  purchase: [ShoppingBag, 'amber'],
  expense: [Wallet, 'lavender'],
  adjustment: [Package, 'slate'],
  reversal: [Repeat2, 'slate'],
  opening: [Coins, 'mint']
};

export function TransactionTable({ entries, onOpen }) {
  if (!entries.length) return <Empty title="Belum ada transaksi">Transaksi yang dikonfirmasi akan tampil di sini.</Empty>;
  return <div className="table-container"><table className="transactions">
    <thead><tr><th scope="col">Transaksi</th><th scope="col">Tanggal</th><th scope="col">Status</th><th scope="col">Nominal</th></tr></thead>
    <tbody>{entries.map(entry => {
      const [Icon, tone] = entryStyle[entry.type] || entryStyle.opening;
      return <tr key={entry.id}>
        <td><button className="transaction-link" onClick={() => onOpen(entry)}>
          <span className={'tile ' + tone}><Icon size={17} /></span>
          <span className="transaction-name"><strong>{entry.label}</strong><small>{types[entry.type] || 'Stok awal'}<span className="mobile-date"> · {shortDate(entry.at)}</span></small></span>
        </button></td>
        <td className="muted">{shortDate(entry.at)}</td>
        <td><span className={'status ' + (entry.cancelled ? 'cancelled' : 'confirmed')}><i />{entry.cancelled ? 'Dibatalkan' : 'Tercatat'}</span></td>
        <td className={'transaction-value ' + (Number(entry.cash) > 0 ? 'positive' : '')}>{Number(entry.cash) > 0 ? '+' : ''}{money(entry.cash)}</td>
      </tr>;
    })}</tbody>
  </table></div>;
}

export function StockList({ list, onOpen }) {
  if (!list.length) return <Empty icon={Package} title="Stok dalam batas aman">Bahan di bawah batas minimum akan tampil di sini.</Empty>;
  return <div className="stock-list">{list.map(item => <button className="stock-row" key={item.id} onClick={() => onOpen(item)}>
    <span className="tile amber"><CircleAlert size={17} /></span>
    <span><strong>{item.name}</strong><small>Minimum {amount(item.minimum)} {item.unit}</small></span>
    <b>{amount(item.quantity)} {item.unit}</b>
  </button>)}</div>;
}

export function Delta({ current, previous }) {
  if (!Number(previous)) return <small className="metric-context">Dalam periode ini</small>;
  const difference = (Number(current) - Number(previous)) / Math.abs(Number(previous)) * 100;
  const Up = difference >= 0 ? ArrowUpRight : ArrowDownLeft;
  return <small className="metric-context"><span className={'delta ' + (difference >= 0 ? 'gain' : 'decline')}><Up size={13} />{amount(Math.abs(difference))}%</span> vs periode lalu</small>;
}
