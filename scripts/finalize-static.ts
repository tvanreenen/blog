import { readFile, rm, writeFile } from "node:fs/promises";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readPosts } from "./posts";
import { isProductionBuild } from "./deployment";
import site from "../src/site.json";

const directory = new URL("../dist/client/", import.meta.url);
const posts = await readPosts();
const production = isProductionBuild(process.env);
for (const [file, title, path] of [
  ["index.html", "Writing", "/"],
  ...posts.map((post) => [`posts/${post.slug}/index.html`, post.title, `/posts/${post.slug}/`]),
  ["404.html", "Page not found.", "/404"],
]) {
  const html = await readFile(new URL(file!, directory), "utf8");
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
