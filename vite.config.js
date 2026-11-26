import { defineConfig } from 'vite';
import marketPrices from './api/market-prices.js';

export default defineConfig({
  optimizeDeps: { entries: ['index.html'] },
  plugins: [{
    name: 'maviq-market-dev',
    configureServer(server) {
      server.middlewares.use('/api/market-prices', marketPrices);
    }
  }]
});
