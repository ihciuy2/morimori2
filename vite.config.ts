import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import https from 'https';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/keepa-api': {
        target: 'https://api.keepa.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/keepa-api/, ''),
        headers: {
          'Accept': 'application/json'
        },
        timeout: 180000, // Increased to 180 seconds (3 minutes)
        agent: new https.Agent({
          keepAlive: true,
          keepAliveMsecs: 30000, // Keep connections alive for 30 seconds
          maxSockets: 10, // Limit concurrent connections
          maxFreeSockets: 5, // Keep some connections in pool
        }),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request to the Target:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response from the Target:', proxyRes.statusCode, req.url);
          });
        },
      },
    },
  },
});