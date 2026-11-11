import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { postsDirectory, readPosts } from "./posts";

const destination = new URL("../public/", import.meta.url);
const posts = await readPosts({ includeDrafts: process.argv.includes("--drafts") });
await writeFile(
  new URL("../src/content/manifest.gen.json", import.meta.url),
  JSON.stringify(posts, null, 2) + "\n",
);
// Literal glob patterns keep unpublished article bodies out of the build's JS chunks.
await writeFile(
  new URL("../src/content/articles.gen.ts", import.meta.url),
  'import type { MDXContent } from "mdx/types";\n' +
    "export const articles = import.meta.glob<{ default: MDXContent }>(" +
    JSON.stringify(posts.map((post) => `../../posts/${post.slug}/index.{md,mdx}`)) +
    ");\n",
);
for (const directory of ["posts/", "licenses/"]) {
  await rm(new URL(directory, destination), { recursive: true, force: true });
}
await mkdir(destination, { recursive: true });
await cp(new URL("../licenses/", import.meta.url), new URL("licenses/", destination), {
  recursive: true,
});
async function copyAssets(source: URL, target: URL, nested = false) {
  for (const entry of await readdir(source, { withFileTypes: true })) {
    if (entry.isDirectory() && (nested || entry.name === "assets")) {
      await copyAssets(new URL(`${entry.name}/`, source), new URL(`${entry.name}/`, target), true);
    } else if (entry.isFile() && /\.(?:jpg|jpeg|png|gif|svg|webp|avif|pdf)$/i.test(entry.name)) {
      await mkdir(target, { recursive: true });
      await cp(new URL(entry.name, source), new URL(entry.name, target));
    }
  }
}
for (const post of posts) {
  await copyAssets(
    new URL(`${post.slug}/`, postsDirectory),
    new URL(`posts/${post.slug}/`, destination),
  );
}
