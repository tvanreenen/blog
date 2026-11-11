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
    "export const articles = import.meta.glob<{ default: MDXContent; frontmatter?: { interactive?: string } }>(" +
    JSON.stringify(posts.map((post) => `../../posts/${post.slug}/index.{md,mdx}`)) +
    ", { eager: true });\n",
);
for (const directory of ["posts/", "licenses/"]) {
  await rm(new URL(directory, destination), { recursive: true, force: true });
}
await mkdir(destination, { recursive: true });
await cp(new URL("../licenses/", import.meta.url), new URL("licenses/", destination), {
  recursive: true,
});
for (const post of posts) {
  for (const file of await readdir(new URL(`${post.slug}/`, postsDirectory))) {
    if (!/\.(?:jpg|jpeg|png|gif|svg|webp|pdf)$/i.test(file)) continue;
    const target = new URL(`posts/${post.slug}/${file}`, destination);
    await mkdir(new URL("./", target), { recursive: true });
    await cp(new URL(`${post.slug}/${file}`, postsDirectory), target);
  }
}
