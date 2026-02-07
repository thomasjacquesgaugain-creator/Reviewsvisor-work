import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Charger les variables du .env (même noms que le client : VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, OUTSCRAPER_API_KEY)
  const env = loadEnv(mode, process.cwd(), "");
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      componentTagger(),
      {
        name: "api-reviews-import",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url !== "/api/reviews/import" || req.method !== "POST") return next();
            const chunks = [];
            req.on("data", (chunk) => chunks.push(chunk));
            req.on("end", async () => {
              try {
                const raw = Buffer.concat(chunks).toString("utf8");
                const body = raw ? JSON.parse(raw) : {};
                const authHeader = req.headers.authorization;
                const { handleImportReviews } = await import("./server/api/reviews/import.js");
                const result = await handleImportReviews(body, authHeader, env);
                res.statusCode = result.status;
                res.setHeader("Content-Type", "application/json");
                res.end(JSON.stringify(result.data));
              } catch (err) {
                console.error("[api/reviews/import] Erreur serveur:", err);
                res.statusCode = 500;
                res.setHeader("Content-Type", "application/json");
                res.end(
                  JSON.stringify({
                    error: "Internal server error",
                    message: String(err?.message || err),
                  })
                );
              }
            });
          });
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      dedupe: ["react", "react-dom"],
    },
  };
});
