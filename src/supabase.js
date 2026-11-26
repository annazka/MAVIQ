import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
export const supabase = url && publishableKey ? createClient(url, publishableKey, {
  auth: {
    flowType: 'pkce',
    detectSessionInUrl: false,
    experimental: { appendPkceFlowIdToRedirects: true }
  }
}) : null;

const recoveryKey = 'maviq-password-recovery';
export const redirectTo = mode => new URL('/app/?mode=' + mode, location.origin).href;

export function rememberRecovery(session) {
  try {
    if (session) sessionStorage.setItem(recoveryKey, session.user.id);
    else sessionStorage.removeItem(recoveryKey);
  } catch {}
}

function hasRecovery(session) {
  try {
    return Boolean(session && sessionStorage.getItem(recoveryKey) === session.user.id);
  } catch { return false; }
}

export async function beginGoogleLogin() {
  const settings = await fetch(new URL('/auth/v1/settings', url), {
    headers: { apikey: publishableKey },
    signal: AbortSignal.timeout(8000)
  });
  if (!settings.ok) throw new Error('Layanan login Google belum dapat dihubungi.');
  const { external } = await settings.json();
  if (!external?.google) throw new Error('Login Google belum diaktifkan untuk MAVIQ. Anda bisa masuk dengan email.');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectTo('oauth'), skipBrowserRedirect: true }
  });
  if (error || !data.url) throw new Error('Login Google gagal dimulai. Silakan coba lagi.');
  location.assign(data.url);
}

export function isAccountEntry() {
  const query = new URLSearchParams(location.search);
  return ['masuk', 'oauth', 'aktivasi', 'pemulihan'].includes(query.get('mode')) || query.has('code');
}

export async function restoreAccount() {
  const callback = new URL(location.href);
  const params = callback.searchParams;
  const hash = new URLSearchParams(callback.hash.slice(1));
  const code = params.get('code');
  const mode = params.get('mode');
  const invalid = [params, hash].some(part => part.has('error') || part.has('error_code') || part.has('access_token'));
  if (code || invalid || ['oauth', 'aktivasi', 'pemulihan'].includes(mode)) {
    const clean = new URL('/app/', callback.origin);
    history.replaceState(history.state, '', clean);
    if (invalid || !code) throw new Error('Tautan masuk atau pemulihan tidak berlaku. Silakan mulai lagi.');
    const { data, error } = await supabase.auth.exchangeCodeForSession(code, {
      flowId: params.get('sb_flow_id') || undefined
    });
    if (error || !data.session) throw new Error('Tautan tidak dapat diverifikasi. Coba ulangi dari peramban yang sama.');
    const recovery = data.redirectType === 'recovery';
    rememberRecovery(recovery ? data.session : null);
    return { session: data.session, recovery };
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error('Sesi Anda tidak dapat dipulihkan. Silakan masuk kembali.');
  return { session: data.session, recovery: hasRecovery(data.session) };
}
