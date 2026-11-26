import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Bell, Boxes, ChevronDown, ChevronsUpDown, CircleAlert, CircleCheck, Coffee, House, LayoutDashboard, LogIn, LogOut, Menu, PanelLeft, ShoppingBasket, ShoppingCart, Store, Wallet, Wheat, X } from 'lucide-react';
import '@fontsource-variable/plus-jakarta-sans';
import { applyCommand, emptyLedger } from '../lib/ledger.js';
import { demoLedger } from '../lib/demo.js';
import Dashboard from './Dashboard.jsx';
import Chatbot from './Chatbot.jsx';
import Pages from './Pages.jsx';
import MarketPrices from './MarketPrices.jsx';
import Modal from './forms.jsx';
import Account, { Brand } from './Account.jsx';
import { isAccountEntry, rememberRecovery, restoreAccount, supabase } from './supabase.js';
import { Button } from './ui.jsx';
import './style.css';

const key = 'maviq-demo-ledger-v1';
const bucket = 'maviq-private-receipts';
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

function App() {
  const [page, setPage] = useState(currentPage);
  const [demo, setDemo] = useState(readDemo);
  const [auth, setAuth] = useState({ ready: !supabase, session: null, recovery: false, error: '' });
  const [workspaceState, setWorkspaceState] = useState(null);
  const [entry, setEntry] = useState(() => isAccountEntry() ? 'login' : null);
  const { session, recovery } = auth;
  const ownerId = session?.user.id;
  const currentWorkspace = workspaceState?.ownerId === ownerId ? workspaceState : null;
  const real = currentWorkspace?.data;
  const loadError = currentWorkspace?.error;
  const [modal, setModal] = useState(null);
  const [drawer, setDrawer] = useState(false);
  const [popover, setPopover] = useState('');
  const [toast, setToast] = useState(null);
  const [busy, setBusy] = useState(false);
  const committing = useRef(false);
  const toastTimer = useRef(null);
  const setReal = data => {
    setWorkspaceState(current => current?.ownerId === ownerId ? { ownerId, data, error: '' } : current);
  };
  const refresh = async () => {
    setWorkspaceState({ ownerId, data: undefined, error: '' });
    try { setReal(await workspace(session)); }
    catch (failure) {
      setWorkspaceState(current => current?.ownerId === ownerId ? { ownerId, error: failure.message } : current);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    let starting = true;
    const { data } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!active || starting || event === 'INITIAL_SESSION') return;
      if (event === 'SIGNED_OUT') rememberRecovery(null);
      setAuth(previous => ({
        ready: true, session: nextSession, error: '',
        recovery: event === 'PASSWORD_RECOVERY' || Boolean(nextSession && previous.recovery && nextSession.user.id === previous.session?.user.id)
      }));
    });
    restoreAccount().then(restored => {
      if (active) setAuth({ ...restored, ready: true, error: '' });
    }).catch(error => {
      if (active) {
        setEntry('login');
        setAuth({ ready: true, session: null, recovery: false, error: error.message });
      }
    }).finally(() => { starting = false; });
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  useEffect(() => {
    if (!ownerId || recovery) {
      setWorkspaceState(null);
      setModal(null);
      return;
    }
    let ignore = false;
    setWorkspaceState({ ownerId, data: undefined, error: '' });
    setModal(null);
    workspace(session).then(result => {
      if (!ignore) setWorkspaceState({ ownerId, data: result, error: '' });
    }).catch(error => {
      if (!ignore) setWorkspaceState({ ownerId, error: error.message });
    });
    return () => { ignore = true; };
  }, [ownerId, recovery]);
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
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      notify('Sesi belum berhasil diakhiri. Coba lagi.', true);
      return;
    }
    rememberRecovery(null);
    setEntry(null);
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
  const switchAuthView = mode => {
    setAuth(current => ({ ...current, error: '' }));
    setEntry(mode);
    if (mode === null && location.search) history.replaceState(history.state, '', location.pathname + location.hash);
  };
  if (!auth.ready) return <main className="entry-page"><section className="panel entry-card"><Brand /><h1>Memeriksa sesi</h1><p role="status">Menyiapkan ruang kerja MAVIQ…</p></section></main>;
  if (recovery && session) return <>
    <Account key="recovery" mode="recovery" leave={signOut} recovered={() => {
      rememberRecovery(null);
      setAuth(current => ({ ...current, recovery: false }));
      setEntry(null);
      notify('Kata sandi berhasil diperbarui.');
    }} />{status}
  </>;
  if (entry && !session) return <><Account key={entry} mode={entry} initialError={auth.error}
    onView={switchAuthView} leave={() => switchAuthView(null)} />{status}</>;
  if (session && !ledger) {
    if (real === null) return <><Account mode="setup" setup={async fields => setReal(await workspace(session, { action: 'setup', ...fields }))} leave={signOut} />{status}</>;
    return <main className="entry-page"><section className="panel entry-card"><Brand /><h1>{loadError ? 'Data belum terbuka' : 'Memuat usaha'}</h1><p role="status">{loadError || 'Mengambil data usaha Anda…'}</p>{loadError && <div className="entry-actions"><Button onClick={refresh}>Coba lagi</Button><Button onClick={signOut}>Kembali ke demo</Button></div>}</section>{status}</main>;
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
        <Button icon={session ? LogOut : LogIn} onClick={session ? signOut : () => { setEntry('login'); setDrawer(false); setPopover(''); }}>{session ? 'Keluar' : 'Masuk ke MAVIQ'}</Button></div>}
      <p className="nav-section">Ruang kerja</p>
      <nav aria-label="Navigasi utama">{links.map(([id, label, Icon]) => <a href={'#' + id} key={id} onClick={() => go(id)} aria-current={id === page ? 'page' : undefined}>
        <Icon size={19} /><span>{label}</span>{page === id && <i />}
      </a>)}</nav>
      <div className="sidebar-bottom">{!session && <div className="demo-banner"><span className="demo-indicator" /><div><strong>Mode demo</strong><small>Data simulasi</small></div></div>}
        <button className="profile" onClick={() => { if (session) void signOut(); else { setEntry('login'); setDrawer(false); } }}>
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
          <button className="top-profile" aria-label={session ? 'Keluar dari akun' : 'Masuk ke MAVIQ'} onClick={session ? signOut : () => setEntry('login')}><span className="avatar">{initials}</span><ChevronDown size={14} /></button>
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
