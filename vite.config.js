import { defineConfig } from 'vite';

const devCloudStore = new Map();

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    host: true
  },
  plugins: [
    {
      name: 'dev-cloud-api',
      configureServer(server) {
        server.middlewares.use('/api/cloud', async (req, res) => {
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

          if (req.method === 'OPTIONS') {
            res.statusCode = 200;
            return res.end();
          }

          const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
          const key = url.searchParams.get('key') || url.searchParams.get('pin') || 'default';

          if (req.method === 'POST') {
            const buffers = [];
            for await (const chunk of req) {
              buffers.push(chunk);
            }
            try {
              const body = JSON.parse(Buffer.concat(buffers).toString());
              devCloudStore.set(key, body);
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              return res.end(JSON.stringify({ success: true, key }));
            } catch (e) {
              res.statusCode = 400;
              return res.end(JSON.stringify({ error: e.message }));
            }
          }

          if (req.method === 'GET') {
            if (devCloudStore.has(key)) {
              res.setHeader('Content-Type', 'application/json');
              res.statusCode = 200;
              return res.end(JSON.stringify(devCloudStore.get(key)));
            }
            res.statusCode = 404;
            return res.end(JSON.stringify({ error: 'Not found' }));
          }
        });
      }
    }
  ]
});
