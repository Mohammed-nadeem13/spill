import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Dev-only plugin: Vite's dev server doesn't run the Vercel function in /api,
// so we mount the SAME handler (api/chat.js) as middleware. This gives the local
// app real AI responses and keeps local dev in parity with the Vercel deployment.
function apiMiddleware(env) {
  return {
    name: 'spill-api-dev',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (req, res) => {
        // make the serverless function's env available to the handler
        Object.assign(process.env, env);
        // collect the request body (the Vercel handler expects req.body parsed)
        let raw = '';
        req.on('data', (c) => (raw += c));
        req.on('end', async () => {
          try {
            req.body = raw ? JSON.parse(raw) : {};
          } catch {
            req.body = {};
          }
          // shim Vercel's res.status().json() onto the node response
          res.status = (code) => {
            res.statusCode = code;
            return res;
          };
          res.json = (obj) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(obj));
            return res;
          };
          try {
            const mod = await server.ssrLoadModule('/api/chat.js');
            await mod.default(req, res);
          } catch (err) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: err.message }));
          }
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // load every var from .env (no VITE_ prefix needed — these stay server-side)
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react(), apiMiddleware(env)],
    server: {
      port: 3000,
      open: true,
    },
  };
});
