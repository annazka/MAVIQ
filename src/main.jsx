import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createClient } from '@supabase/supabase-js';
import { Bell, Boxes, ChevronDown, ChevronsUpDown, CircleAlert, CircleCheck, Coffee, House, LayoutDashboard, LogIn, LogOut, Menu, PanelLeft, ShoppingBasket, ShoppingCart, Store, Wallet, Wheat, X } from 'lucide-react';
import '@fontsource-variable/plus-jakarta-sans';
import { applyCommand, emptyLedger } from '../lib/ledger.js';
import { demoLedger } from '../lib/demo.js';
import Dashboard from './Dashboard.jsx';
import Chatbot from './Chatbot.jsx';
import Pages from './Pages.jsx';
import MarketPrices from './MarketPrices.jsx';
import Modal, { Field } from './forms.jsx';
import { Button } from './ui.jsx';
import './style.css';

const key = 'maviq-demo-ledger-v1';
const bucket = 'maviq-private-receipts';
const url = import.meta.env.VITE_SUPABASE_URL;
const publicKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = url && publicKey ? createClient(url, publicKey) : null;

const links = [
  ['dashboard', 'Dashboard', LayoutDashboard], ['sales', 'Penjualan', ShoppingCart], ['purchases', 'Pembelian', ShoppingBasket],
  ['stock', 'Bahan & Stok', Boxes], ['products', 'Produk & Resep', Coffee], ['cash', 'Keuangan', Wallet], ['market', 'Harga Pasar', Wheat]
];
const currentPage = () => links.find(([path]) => '#' + path === location.hash)?.[0] || 'dashboard';
const readDemo = () => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {}
  return { ledger: demoLedger(), revision: 0 };
};
const storeDemo = state => {
  localStorage.setItem(key, JSON.stringify(state));
  return state;
};

async function workspace(session, body) {
  const response = await fetch('/api/workspace', {
    method: body ? 'POST' : 'GET',
    headers: { Authorization: 'Bearer ' + session.access_token, ...(body && { 'Content-Type': 'application/json' }) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json().catch(() => ({ error: 'Backend tidak tersedia di alamat ini.' }));
  if (!response.ok || data?.error) throw Object.assign(new Error(data?.error || 'Layanan usaha tidak tersedia.'), { current: data?.current });
  return data;
}

function Brand() {
  return <span className="brand"><img src="/maviq.svg" width="37" height="37" alt="" /><span>MAVIQ<span className="brand-period">.</span></span></span>;
}

function Entry({ mode, goDemo, cancel, notify, setup }) {
  const [register, setRegister] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async event => {
    event.preventDefault();
    setError('');
    setBusy(true);
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'setup') {
        await setup(fields);
      } else {
        const auth = register ? await supabase.auth.signUp({ email: fields.email, password: fields.password, options: { emailRedirectTo: location.origin + '/app/' } }) : await supabase.auth.signInWithPassword({ email: fields.email, password: fields.password });
        if (auth.error) throw auth.error;
        if (register && !auth.data.session) notify('Periksa email untuk mengaktifkan akun.');
      }
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  return <main className="entry-page"><section className="panel entry-card">
    <Brand /><h1>{mode === 'setup' ? 'Buat usaha Anda' : register ? 'Daftar akun MAVIQ' : 'Masuk ke MAVIQ'}</h1>
    <p>{mode === 'setup' ? 'Mulai dengan nama usaha dan saldo kas operasional.' : 'Buka ruang kerja usaha Anda.'}</p>
    {!supabase ? <p className="form-warning"><CircleAlert size={17} />Akun usaha tersedia setelah Supabase dikonfigurasi. Anda bisa mencoba data simulasi.</p> :
      <form className="entry-form" onSubmit={submit}>
        {mode === 'setup' ? <><Field label="Nama usaha"><input name="name" required maxLength="160" /></Field>
          <Field label="Saldo kas awal (Rp)"><input type="number" name="cash" required defaultValue="0" min="0" step="1" /></Field></> :
          <><Field label="Email"><input type="email" name="email" required autoComplete="email" /></Field>
            <Field label="Kata sandi"><input type="password" name="password" required minLength="8" autoComplete={register ? 'new-password' : 'current-password'} /></Field></>}
        {error && <p className="form-error" role="alert">{error}</p>}
        <Button type="submit" variant="primary" disabled={busy}>{busy ? 'Memproses…' : mode === 'setup' ? 'Simpan usaha' : register ? 'Daftar' : 'Masuk'}</Button>
      </form>}
    <div className="entry-actions">{supabase && mode !== 'setup' && <button className="text-button" onClick={() => { setRegister(!register); setError(''); }}>{register ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}</button>}
      <button className="text-button" onClick={mode === 'setup' ? cancel : goDemo}>{mode === 'setup' ? 'Keluar' : 'Kembali ke demo'}</button></div>
  </section></main>;
}

function App() {
  const [page, setPage] = useState(currentPage);
  const [demo, setDemo] = useState(readDemo);
  const [session, setSession] = useState(null);
  const [real, setReal] = useState(undefined);
  const [entry, setEntry] = useState(() => new URLSearchParams(location.search).get('mode') === 'masuk');
  const [loadError, setLoadError] = useState('');
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [popover, setPopover] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const committing = useRef(false);
  const toastTimer = useRef(null);
  const refresh = async active => {
    setLoadError('');
    try { setReal(await workspace(active)); }
    catch (failure) { setLoadError(failure.message); }
  };
  const token = session?.access_token;

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((_event, active) => setSession(active));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    let ignore = false;
    setReal(undefined);
    setLoadError('');
    setModal(null);
    if (token) workspace({ access_token: token }).then(data => { if (!ignore) setReal(data); }).catch(error => { if (!ignore) setLoadError(error.message); });
    return () => { ignore = true; };
  }, [session?.user?.id]);
  useEffect(() => {
    const onHash = () => { setPage(currentPage()); setDrawer(false); setPopover(''); window.scrollTo(0, 0); };
    const onStorage = event => { if (event.key === key) setDemo(readDemo()); };
    window.addEventListener('hashchange', onHash);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('hashchange', onHash);
      window.removeEventListener('storage', onStorage);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const onKey = event => { if (event.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [drawer]);

  const state = session ? real : demo;
  const ledger = state?.ledger;
  const go = next => {
    if (page !== next) location.hash = next;
    setPage(next); setDrawer(false); setPopover(''); window.scrollTo(0, 0);
  };
  const notify = (message, error = false) => {
    clearTimeout(toastTimer.current);
    setToast({ message, error });
    toastTimer.current = setTimeout(() => setToast(null), 5200);
  };
  const open = (kind, data = null) => setModal({ kind, data, key: crypto.randomUUID() });
  const commit = async command => {
    if (committing.current) throw new Error('Tunggu hingga perubahan sebelumnya selesai.');
    committing.current = true;
    setBusy(true);
    try {
      if (session) {
        const next = await workspace(session, { action: 'commit', command, revision: state.revision });
        setReal(next);
      } else {
        const save = () => {
          const base = readDemo();
          const next = applyCommand(base.ledger, command);
          return storeDemo({ ledger: next, revision: base.revision + 1 });
        };
        setDemo(navigator.locks ? await navigator.locks.request(key, save) : save());
      }
    } catch (error) {
      if (error.current && session) setReal(error.current);
      throw error;
    } finally {
      committing.current = false;
      setBusy(false);
    }
  };
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    setEntry(false);
    setPopover('');
    go('dashboard');
  };
  const receiptTools = {
    upload: async file => {
      if (!session) {
        const digest = await crypto.subtle.digest('SHA-256', await file.arrayBuffer());
        return { hash: Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('') };
      }
      const path = session.user.id + '/' + crypto.randomUUID() + (file.type === 'image/png' ? '.png' : '.jpg');
      const { error } = await supabase.storage.from(bucket).upload(path, file);
      if (error) throw error;
      return { path };
    },
    scan: path => workspace(session, { action: 'scan', path }),
    discard: async path => {
      if (session && path) await supabase.storage.from(bucket).remove([path]);
    },
    view: async path => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60);
      if (error) throw error;
      return data.signedUrl;
    }
  };
  const status = toast && <div className={'toast ' + (toast.error ? 'error' : '')} role={toast.error ? 'alert' : 'status'}>
    {toast.error ? <CircleAlert size={18} /> : <CircleCheck size={18} />}<span>{toast.message}</span><button aria-label="Tutup pemberitahuan" onClick={() => setToast(null)}><X size={16} /></button>
  </div>;
  if (entry && !session) return <><Entry mode="login" goDemo={() => setEntry(false)} notify={notify} />{status}</>;
  if (session && !ledger) {
    if (real === null) return <Entry mode="setup" setup={async fields => setReal(await workspace(session, { action: 'setup', ...fields }))} cancel={signOut} />;
    return <main className="entry-page"><section className="panel entry-card"><Brand /><h1>{loadError ? 'Data belum terbuka' : 'Memuat usaha'}</h1><p role="status">{loadError || 'Mengambil data usaha Anda…'}</p>{loadError && <div className="entry-actions"><Button onClick={() => refresh(session)}>Coba lagi</Button><Button onClick={signOut}>Kembali ke demo</Button></div>}</section></main>;
  }
  const low = ledger.ingredients.filter(item => Number(item.quantity) <= Number(item.minimum));
  const initials = ledger.name.trim().split(/\s+/).slice(0, 2).map(word => word[0]).join('').toUpperCase();
  return <div className="app-shell">
    <a className="skip" href="#main-content">Langsung ke konten</a>
    {drawer && <button className="drawer-backdrop" aria-label="Tutup menu" onClick={() => setDrawer(false)} />}
    <aside id="sidebar" className={'sidebar ' + (drawer ? 'drawer-open' : '')}>
      <a className="brand-link" href="#dashboard" onClick={() => go('dashboard')} aria-label="MAVIQ Dashboard"><Brand /></a>
      <button className="workspace-card" aria-expanded={popover === 'workspace'} onClick={() => setPopover(popover === 'workspace' ? '' : 'workspace')}>
        <span className="tile mint"><Store size={18} /></span><span className="workspace-copy"><strong>{ledger.name}</strong><small>{session ? 'Ruang kerja usaha' : 'Ruang kerja demo'}</small></span><ChevronsUpDown size={15} />
      </button>
      {popover === 'workspace' && <div className="workspace-popover"><p>{session ? 'Satu usaha terhubung ke akun Anda.' : 'Data simulasi disimpan di peramban ini.'}</p>
        <Button icon={session ? LogOut : LogIn} onClick={session ? signOut : () => { setEntry(true); setDrawer(false); setPopover(''); }}>{session ? 'Keluar' : 'Masuk ke MAVIQ'}</Button></div>}
      <p className="nav-section">Ruang kerja</p>
      <nav aria-label="Navigasi utama">{links.map(([id, label, Icon]) => <a href={'#' + id} key={id} onClick={() => go(id)} aria-current={id === page ? 'page' : undefined}>
        <Icon size={19} /><span>{label}</span>{page === id && <i />}
      </a>)}</nav>
      <div className="sidebar-bottom">{!session && <div className="demo-banner"><span className="demo-indicator" /><div><strong>Mode demo</strong><small>Data simulasi</small></div></div>}
        <button className="profile" onClick={() => { if (session) void signOut(); else { setEntry(true); setDrawer(false); } }}>
          <span className="avatar">{initials}</span><span><strong>{session ? 'Pemilik usaha' : 'Akun demo'}</strong><small>{session ? 'Keluar dari akun' : 'Masuk ke MAVIQ'}</small></span>{session ? <LogOut size={17} /> : <LogIn size={17} />}
        </button></div>
    </aside>
    <div className="app-main">
      <header className="topbar"><div className="breadcrumb">
        <button className="mobile-menu" aria-label="Buka menu" aria-expanded={drawer} aria-controls="sidebar" onClick={() => setDrawer(true)}><Menu size={21} /><span>Menu</span></button>
        <span className="top-rail"><PanelLeft size={17} /></span><button className="breadcrumb-home" onClick={() => go('dashboard')} aria-label="Ke dashboard"><House size={17} /></button>
        <span className="slash">/</span><strong>{links.find(([id]) => id === page)[1]}</strong></div>
        <div className="top-right">{!session && <span className="demo-chip"><i />Data simulasi</span>}
          <button className="bell" aria-label="Pemberitahuan stok" aria-expanded={popover === 'alerts'} onClick={() => setPopover(popover === 'alerts' ? '' : 'alerts')}><Bell size={19} />{low.length > 0 && <i />}</button>
          <button className="top-profile" aria-label={session ? 'Keluar dari akun' : 'Masuk ke MAVIQ'} onClick={session ? signOut : () => setEntry(true)}><span className="avatar">{initials}</span><ChevronDown size={14} /></button>
          {popover === 'alerts' && <div className="panel alerts"><strong>Pemberitahuan stok</strong><p>{low.length ? low.length + ' bahan berada pada atau di bawah batas minimum.' : 'Stok berada dalam batas aman.'}</p><Button onClick={() => go('stock')}>Buka persediaan</Button></div>}
        </div>
      </header>
      <main id="main-content" className="main-content">
        {page === 'dashboard' ? <Dashboard ledger={ledger} demo={!session} go={go} open={open} commit={commit} busy={busy} notify={notify} /> :
          page === 'market' ? <MarketPrices /> : <Pages key={page} page={page} ledger={ledger} open={open} />}
      </main>
    </div>
    {modal && <Modal key={modal.key} modal={modal} ledger={ledger} close={() => setModal(null)} open={open} commit={commit} notify={notify} receiptTools={receiptTools} />}
    <Chatbot key={session?.user?.id || 'demo'} ledger={ledger} demo={!session} go={go} blocked={Boolean(modal || drawer)}
      ask={(question, previous) => workspace(session, { action: 'chat', question, previous })} />
    {status}
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
