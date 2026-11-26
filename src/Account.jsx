import { useState } from 'react';
import { CircleAlert } from 'lucide-react';
import { Field } from './forms.jsx';
import { Button } from './ui.jsx';
import { beginGoogleLogin, redirectTo, supabase } from './supabase.js';

export function Brand() {
  return <span className="brand"><img src="/maviq.svg" width="37" height="37" alt="" /><span>MAVIQ<span className="brand-period">.</span></span></span>;
}

const copy = {
  login: ['Masuk ke MAVIQ', 'Buka ruang kerja usaha Anda.', 'Masuk'],
  signup: ['Daftar akun MAVIQ', 'Buat akun untuk menyimpan data usaha Anda.', 'Daftar'],
  forgot: ['Lupa kata sandi', 'Masukkan email yang Anda gunakan untuk masuk.', 'Kirim tautan reset'],
  recovery: ['Atur ulang kata sandi', 'Buat kata sandi baru untuk akun MAVIQ Anda.', 'Simpan kata sandi'],
  setup: ['Buat usaha Anda', 'Mulai dengan nama usaha dan saldo kas operasional.', 'Simpan usaha']
};

function GoogleMark() {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M43.6 24.5c0-1.5-.1-3-.4-4.5H24v8.5h11a9.4 9.4 0 0 1-4.1 6.2v5.4h6.5c3.8-3.5 6.2-8.7 6.2-15.6z" />
    <path fill="#34A853" d="M24 44c5.4 0 9.9-1.8 13.4-4.9l-6.5-5.4a12 12 0 0 1-18-6.4H6.2v5.5A20 20 0 0 0 24 44z" />
    <path fill="#FBBC05" d="M12.9 27.3a12 12 0 0 1 0-6.6v-5.5H6.2a20 20 0 0 0 0 17.6z" />
    <path fill="#EA4335" d="M24 12c2.9 0 5.4 1 7.4 2.9l5.7-5.7A19 19 0 0 0 24 4a20 20 0 0 0-17.8 11.2l6.7 5.5A12 12 0 0 1 24 12z" />
  </svg>;
}

export default function Account({ mode, onView, leave, setup, recovered, initialError }) {
  const [pending, setPending] = useState('');
  const [error, setError] = useState(initialError || '');
  const [message, setMessage] = useState('');
  const [title, description, button] = copy[mode];
  const isSignIn = mode === 'login' || mode === 'signup';

  const submit = async event => {
    event.preventDefault();
    if (pending) return;
    setPending('form');
    setError('');
    setMessage('');
    const { email, password, confirm, ...fields } = Object.fromEntries(new FormData(event.currentTarget));
    try {
      if (mode === 'setup') {
        await setup(fields);
      } else if (mode === 'forgot') {
        const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: redirectTo('pemulihan') });
        if (requestError && ![400, 404, 422].includes(requestError.status)) throw new Error('Tautan belum dapat dikirim. Coba lagi sebentar.');
        setMessage('Jika email terdaftar, tautan reset akan dikirim. Buka tautan di peramban yang sama.');
      } else if (mode === 'recovery') {
        if (password !== confirm) throw new Error('Konfirmasi kata sandi belum sama.');
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw new Error('Kata sandi belum berhasil diubah. Gunakan minimal 8 karakter dan coba lagi.');
        recovered();
      } else if (mode === 'signup') {
        const { data, error: signupError } = await supabase.auth.signUp({
          email: email.trim(), password, options: { emailRedirectTo: redirectTo('aktivasi') }
        });
        if (signupError) throw new Error('Pendaftaran belum berhasil. Periksa email dan gunakan minimal 8 karakter untuk kata sandi.');
        if (!data.session) setMessage('Periksa email untuk mengaktifkan akun. Buka tautan di peramban yang sama.');
      } else {
        const { error: loginError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (loginError) {
          throw new Error(loginError.code === 'email_not_confirmed' ? 'Konfirmasi email Anda sebelum masuk.' : 'Email atau kata sandi tidak dapat diverifikasi.');
        }
      }
    } catch (failure) { setError(failure.message); }
    finally { setPending(''); }
  };

  const google = async () => {
    if (pending) return;
    setPending('google');
    setError('');
    setMessage('');
    try { await beginGoogleLogin(); }
    catch (failure) { setError(failure.message); setPending(''); }
  };

  return <main className="entry-page"><section className="panel entry-card">
    <Brand /><h1>{title}</h1><p>{description}</p>
    {!supabase ? <p className="form-warning"><CircleAlert size={17} />Akun usaha tersedia setelah Supabase dikonfigurasi. Anda bisa mencoba data simulasi.</p> : <>
      {isSignIn && <div className="entry-google"><Button className="google-button" onClick={google} disabled={Boolean(pending)}>
        <GoogleMark />{pending === 'google' ? 'Menghubungkan ke Google…' : 'Lanjutkan dengan Google'}
      </Button><span>atau gunakan email</span></div>}
      <form className="entry-form" onSubmit={submit}>
        {mode === 'setup' ? <>
          <Field label="Nama usaha"><input name="name" required maxLength="160" /></Field>
          <Field label="Saldo kas awal (Rp)"><input type="number" name="cash" required defaultValue="0" min="0" step="1" /></Field>
        </> : <>
          {mode !== 'recovery' && <Field label="Email"><input type="email" name="email" required autoComplete="email" /></Field>}
          {mode !== 'forgot' && <Field label={mode === 'recovery' ? 'Kata sandi baru' : 'Kata sandi'}>
            <input type="password" name="password" required minLength={mode === 'login' ? undefined : 8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
          </Field>}
          {mode === 'recovery' && <Field label="Konfirmasi kata sandi"><input type="password" name="confirm" required minLength="8" autoComplete="new-password" /></Field>}
        </>}
        {error && <p className="form-error" role="alert">{error}</p>}
        {message && <p className="form-warning" role="status">{message}</p>}
        <Button type="submit" variant="primary" disabled={Boolean(pending)}>{pending === 'form' ? 'Memproses…' : button}</Button>
      </form>
    </>}
    <div className="entry-actions">
      {supabase && mode === 'login' && <button type="button" className="text-button" onClick={() => onView('forgot')}>Lupa kata sandi?</button>}
      {supabase && isSignIn && <button type="button" className="text-button" onClick={() => onView(mode === 'login' ? 'signup' : 'login')}>{mode === 'login' ? 'Daftar akun' : 'Sudah punya akun? Masuk'}</button>}
      {supabase && mode === 'forgot' && <button type="button" className="text-button" onClick={() => onView('login')}>Kembali ke masuk</button>}
      <button type="button" className="text-button" onClick={leave}>{mode === 'setup' || mode === 'recovery' ? 'Keluar' : 'Kembali ke demo'}</button>
    </div>
  </section></main>;
}
