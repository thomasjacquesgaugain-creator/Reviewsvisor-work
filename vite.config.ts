import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';
import { componentTagger } from 'lovable-tagger';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables du .env (frontend: VITE_*, backend middleware: SUPABASE_* + OUTSCRAPER_API_KEY)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    server: {
      host: '::',
      port: 8080,
    },
    plugins: [
      react(),
      componentTagger(),
      {
        name: 'api-reviews-import',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url !== '/api/reviews/import' || req.method !== 'POST')
              return next();
            const chunks = [];
            req.on('data', (chunk) => chunks.push(chunk));
            req.on('end', async () => {
              try {
                const raw = Buffer.concat(chunks).toString('utf8');
                const body = raw ? JSON.parse(raw) : {};
                const authHeader = req.headers.authorization;
                const { handleImportReviews } =
                  await import('./server/api/reviews/import.js');
                const result = await handleImportReviews(body, authHeader, env);
                res.statusCode = result.status;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(result.data));
              } catch (err) {
                console.error('[api/reviews/import] Erreur serveur:', err);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(
                  JSON.stringify({
                    error: 'Internal server error',
                    message: String(err?.message || err),
                  }),
                );
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
      dedupe: ['react', 'react-dom'],
    },
    build: {
      target: 'es2022',
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks: {
            // Core React
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],

            // Radix UI components
            'radix-ui': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
              '@radix-ui/react-tooltip',
              '@radix-ui/react-popover',
              '@radix-ui/react-accordion',
              '@radix-ui/react-alert-dialog',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-radio-group',
              '@radix-ui/react-slider',
              '@radix-ui/react-switch',
              '@radix-ui/react-collapsible',
              '@radix-ui/react-context-menu',
              '@radix-ui/react-hover-card',
              '@radix-ui/react-label',
              '@radix-ui/react-menubar',
              '@radix-ui/react-navigation-menu',
              '@radix-ui/react-progress',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-slot',
              '@radix-ui/react-toggle',
              '@radix-ui/react-toggle-group',
              '@radix-ui/react-aspect-ratio',
              '@radix-ui/react-avatar',
            ],

            // Supabase
            supabase: ['@supabase/supabase-js'],

            // Charts — heavy, isolated
            highcharts: ['highcharts', 'highcharts-react-official'],
            recharts: ['recharts'],

            // PDF & document parsing — heavy, isolated
            pdf: ['jspdf'],

            // Stripe
            stripe: ['@stripe/stripe-js', '@stripe/react-stripe-js'],

            // Forms & validation
            forms: ['react-hook-form', '@hookform/resolvers', 'zod'],

            // i18n
            i18n: [
              'i18next',
              'react-i18next',
              'i18next-browser-languagedetector',
            ],

            // Utilities
            utils: [
              'date-fns',
              'clsx',
              'tailwind-merge',
              'class-variance-authority',
              'lucide-react',
              'zustand',
              'sonner',
            ],

            // TanStack Query
            query: ['@tanstack/react-query'],

            // Google Maps
            maps: ['@googlemaps/js-api-loader'],

            // Misc UI
            'ui-misc': [
              'embla-carousel-react',
              'react-day-picker',
              'react-resizable-panels',
              'vaul',
              'cmdk',
              'input-otp',
              'next-themes',
            ],
          },
        },
      },
    },
  };
});