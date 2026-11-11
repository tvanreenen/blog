import { readFile, writeFile } from "node:fs/promises";
import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { readPosts } from "./posts";

const directory = new URL("../dist/client/", import.meta.url);
const posts = await readPosts();
for (const [file, title] of [
  ["index.html", "Writing"],
  ...posts.map((post) => [`posts/${post.slug}/index.html`, post.title]),
  ["404.html", "Page not found."],
]) {
  const html = await readFile(new URL(file!, directory), "utf8");
  const renderedTitle = renderToStaticMarkup(createElement(Fragment, null, title));
  if (
    !html.includes("<h1") ||
    !html.includes(renderedTitle) ||
    !html.includes('content="noindex, nofollow"')
  ) {
    throw new Error(`Incomplete preview HTML: ${file}`);
  }
}
await writeFile(new URL("robots.txt", directory), "User-agent: *\nDisallow: /\n");
await writeFile(
  new URL("_headers", directory),
  "/*\n  X-Robots-Tag: noindex, nofollow\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n",
);
console.log(
  `Verified homepage, ${posts.length} posts, and 404 as prerendered, unindexed preview HTML.`,
);
