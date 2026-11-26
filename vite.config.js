import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import marketPrices from './api/market-prices.js';

function isPublishable(key) {
  if (key.startsWith('sb_publishable_')) return true;
  try {
    const token = key.split('.');
    return token.length === 3 && JSON.parse(Buffer.from(token[1], 'base64url').toString('utf8')).role === 'anon';
  } catch { return false; }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (env.VITE_SUPABASE_PUBLISHABLE_KEY && !isPublishable(env.VITE_SUPABASE_PUBLISHABLE_KEY)) {
    throw new Error('VITE_SUPABASE_PUBLISHABLE_KEY harus berisi publishable key atau anon key.');
  }
  const privateNames = Object.keys(env).filter(name => /SECRET|SERVICE_ROLE|PASSWORD|PRIVATE_KEY|VERYFI|GEMINI/.test(name));
  if (privateNames.length) throw new Error('Pindahkan variabel privat dari awalan VITE_: ' + privateNames.join(', '));

  return {
    optimizeDeps: { entries: ['index.html', 'app/index.html'] },
    build: {
      rolldownOptions: {
        input: [
          fileURLToPath(new URL('./index.html', import.meta.url)),
          fileURLToPath(new URL('./app/index.html', import.meta.url))
        ]
      }
    },
    plugins: [{
      name: 'maviq-market-dev',
      configureServer(server) {
        server.middlewares.use('/api/market-prices', marketPrices);
      }
    }]
  };
});
