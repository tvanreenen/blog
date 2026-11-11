import { readFile, rm, writeFile } from "node:fs/promises";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readPosts } from "./posts";
import { isProductionBuild } from "./deployment";
import site from "../src/site.json";
import type { Manifest } from "vite";
import { articleStylesheets } from "./article-assets";

const directory = new URL("../dist/client/", import.meta.url);
const posts = await readPosts();
const production = isProductionBuild(process.env);
const manifest: Manifest = JSON.parse(
  await readFile(new URL(".vite/manifest.json", directory), "utf8"),
);
const stylesByPath = new Map<string, string[]>(
  posts.map((post) => {
    const entry = [`posts/${post.slug}/index.md`, `posts/${post.slug}/index.mdx`].find(
      (path) => path in manifest,
    );
    if (!entry) throw new Error(`Missing article bundle: ${post.slug}`);
    return [`/posts/${post.slug}/`, articleStylesheets(manifest, entry)] as const;
  }),
);
await writeFile(
  new URL("_redirects", directory),
  posts
    .flatMap((post) =>
      post.aliases.flatMap((alias) => [
        `/posts/${alias} /posts/${post.slug}/ 301`,
        `/posts/${alias}/ /posts/${post.slug}/ 301`,
        `/posts/${alias}/index.html /posts/${post.slug}/ 301`,
      ]),
    )
    .join("\n") + "\n",
);
for (const [file, title, path] of [
  ["index.html", "Writing", "/"],
  ...posts.map((post) => [`posts/${post.slug}/index.html`, post.title, `/posts/${post.slug}/`]),
  ["404.html", "Page not found.", "/404"],
]) {
  let html = await readFile(new URL(file!, directory), "utf8");
  const stylesheets = (stylesByPath.get(path!) ?? [])
    .filter((href) => !html.includes(`href="${href}"`))
    .map((href) =>
      renderToStaticMarkup(
        createElement("link", { rel: "stylesheet", href, precedence: "article" }),
      ),
    )
    .join("");
  if (stylesheets) {
    html = html.replace("</head>", `${stylesheets}</head>`);
    await writeFile(new URL(file!, directory), html);
  }
  const renderedTitle = renderToStaticMarkup(createElement(Fragment, null, title));
  const robots = production && path !== "/404" ? "index, follow" : "noindex, nofollow";
  if (
    !html.includes("<h1") ||
    !html.includes(renderedTitle) ||
    !html.includes(`name="robots" content="${robots}"`) ||
    !html.includes(`rel="canonical" href="${site.url}${path}"`)
  ) {
    throw new Error(`Incomplete HTML or incorrect deployment metadata: ${file}`);
  }
}
await writeFile(
  new URL("robots.txt", directory),
  production
    ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`
    : "User-agent: *\nDisallow: /\n",
);
if (production) {
  const urls = ["/", ...posts.map((post) => `/posts/${post.slug}/`)];
  await writeFile(
    new URL("sitemap.xml", directory),
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map((path) => `  <url><loc>${site.url}${path}</loc></url>`).join("\n") +
      "\n</urlset>\n",
  );
} else {
  await rm(new URL("sitemap.xml", directory), { force: true });
}
await writeFile(
  new URL("_headers", directory),
  "/*\n" +
    (production ? "" : "  X-Robots-Tag: noindex, nofollow\n") +
    "  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n",
);
console.log(
  `Verified homepage, ${posts.length} posts, and 404 as prerendered ${production ? "production" : "unindexed preview"} HTML.`,
);
await rm(new URL(".vite/", directory), { recursive: true, force: true });
