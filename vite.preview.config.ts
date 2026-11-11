import { existsSync, readFileSync, statSync } from "node:fs";
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { resolve, sep } from "node:path";

// Inspect only the static HTML/assets, without a Start runtime or SPA fallback.
export default defineConfig({
  appType: "mpa",
  build: { outDir: "dist/client" },
  // Match same-origin static delivery; Vary: Origin causes duplicate WebKit font fetches.
  preview: { host: "127.0.0.1", cors: false },
  plugins: [
    {
      name: "static-pages-preview",
      configurePreviewServer(server) {
        const directory = fileURLToPath(new URL("./dist/client", import.meta.url));
        server.middlewares.use((_request, response, next) => {
          const headers = readFileSync(resolve(directory, "_headers"), "utf8");
          for (const line of headers.split("\n")) {
            const match = /^  ([\w-]+): (.+)$/.exec(line);
            if (match?.[1] && match[2]) response.setHeader(match[1], match[2]);
          }
          next();
        });
        return () => {
          server.middlewares.use((request, response, next) => {
            let pathname: string;
            try {
              pathname = decodeURIComponent(
                new URL(request.url ?? "/", "http://localhost").pathname,
              );
            } catch {
              response.statusCode = 400;
              response.end("Invalid URL");
              return;
            }
            const file = resolve(directory, `.${pathname}`);
            if (
              (file === directory || file.startsWith(directory + sep)) &&
              existsSync(file) &&
              statSync(file).isFile()
            )
              return next();
            response.statusCode = 404;
            response.setHeader("Content-Type", "text/html; charset=utf-8");
            response.end(
              request.method === "HEAD" ? undefined : readFileSync(resolve(directory, "404.html")),
            );
          });
        };
      },
    },
  ],
});
