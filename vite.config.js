import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import chatHandler from './api/chat.js';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode`
  const env = loadEnv(mode, process.cwd(), '');
  process.env.LITELLM_API_KEY ||= env.LITELLM_API_KEY;
  process.env.LITELLM_API_BASE ||= env.LITELLM_API_BASE;
  process.env.LITELLM_MODEL ||= env.LITELLM_MODEL;
  
  return {
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          splash: resolve(__dirname, 'splash.html')
        }
      }
    },
    // Use the same server-side chat handler locally that Vercel uses in production.
    server: {
      host: true // Expose to network (equivalent to --host)
    },
    plugins: [
      {
        name: 'local-api-and-slug-routes',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url === '/api/chat') {
              if (req.method !== 'POST') {
                res.setHeader('Allow', 'POST');
                res.statusCode = 405;
                res.end(JSON.stringify({ error: 'Method Not Allowed' }));
                return;
              }

              try {
                let rawBody = '';
                for await (const chunk of req) {
                  rawBody += chunk;
                }

                req.body = rawBody ? JSON.parse(rawBody) : {};

                const responseAdapter = {
                  setHeader: (...args) => res.setHeader(...args),
                  status(code) {
                    res.statusCode = code;
                    return this;
                  },
                  json(payload) {
                    if (!res.getHeader('Content-Type')) {
                      res.setHeader('Content-Type', 'application/json');
                    }
                    res.end(JSON.stringify(payload));
                  },
                  end: (...args) => res.end(...args)
                };

                await chatHandler(req, responseAdapter);
              } catch (err) {
                console.error('Local chat middleware error:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ error: 'Local chat middleware failed.' }));
              }
              return;
            }

            if (req.url === '/splash' || req.url === '/splash/') {
              req.url = '/splash.html';
            }
            next();
          });
        }
      }
    ]
  };
});
