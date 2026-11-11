import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import mdx from "@mdx-js/rollup";
import { readPosts } from "./scripts/posts.ts";
import { markdownOptions } from "./scripts/markdown.ts";
import { isProductionBuild } from "./scripts/deployment.ts";

export default defineConfig(async ({ command }) => {
  const posts = await readPosts({ includeDrafts: command === "serve" });
  const paths = ["/", ...posts.map((post) => `/posts/${post.slug}/`), "/404"];
  return {
    define: {
      "import.meta.env.SITE_PRODUCTION": command === "build" && isProductionBuild(process.env),
    },
    plugins: [
      tailwindcss(),
      { ...mdx(markdownOptions), enforce: "pre" },
      tanstackStart({
        prerender: {
          enabled: true,
          autoStaticPathsDiscovery: false,
          autoSubfolderIndex: false,
          crawlLinks: false,
          failOnError: true,
        },
        pages: paths.map((path) => ({
          path,
          prerender: { outputPath: path === "/404" ? "/404.html" : `${path}index.html` },
        })),
      }),
      react({ include: /\.(?:jsx|tsx|md|mdx)$/ }),
    ],
    resolve: {
      alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
      dedupe: ["react", "react-dom"],
    },
    build: { license: { fileName: "licenses/dependencies.md" } },
  };
});
