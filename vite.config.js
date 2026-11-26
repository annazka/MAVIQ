import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import marketPrices from './api/market-prices.js';

export default defineConfig({
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
});
