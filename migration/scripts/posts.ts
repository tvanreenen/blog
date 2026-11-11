import { readdir, readFile } from "node:fs/promises";
import matter from "gray-matter";
import { parsePostMetadata } from "../src/content/metadata.ts";

export const postsDirectory = new URL("../../posts/", import.meta.url);

export async function readPosts() {
  const entries = await readdir(postsDirectory, { withFileTypes: true });
  const posts = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const files = (await readdir(new URL(`${entry.name}/`, postsDirectory))).filter((file) =>
          /^index\.mdx?$/.test(file),
        );
        if (files.length !== 1)
          throw new Error(`Expected one Markdown or MDX source for ${entry.name}`);
        const source = await readFile(new URL(`${entry.name}/${files[0]}`, postsDirectory), "utf8");
        return parsePostMetadata(entry.name, matter(source).data);
      }),
  );
  return posts.sort((a, b) => b.date.localeCompare(a.date));
}
