import { cp, mkdir, readdir, rm, writeFile } from "node:fs/promises";
import { postsDirectory, readPosts } from "./posts";

const destination = new URL("../public/", import.meta.url);
await writeFile(
  new URL("../src/content/manifest.gen.json", import.meta.url),
  JSON.stringify(await readPosts(), null, 2) + "\n",
);
await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(new URL("../licenses/", import.meta.url), new URL("licenses/", destination), {
  recursive: true,
});
for (const file of [
  "favicon.ico",
  "favicon-16x16.png",
  "favicon-32x32.png",
  "apple-touch-icon.png",
  "vanreenen-og.png",
]) {
  await cp(new URL(`../../${file}`, import.meta.url), new URL(file, destination));
}
for (const entry of await readdir(postsDirectory, { withFileTypes: true })) {
  if (!entry.isDirectory()) continue;
  for (const file of await readdir(new URL(`${entry.name}/`, postsDirectory))) {
    if (!/\.(?:jpg|jpeg|png|gif|svg|webp|pdf)$/i.test(file)) continue;
    const target = new URL(`posts/${entry.name}/${file}`, destination);
    await mkdir(new URL("./", target), { recursive: true });
    await cp(new URL(`${entry.name}/${file}`, postsDirectory), target);
  }
}
