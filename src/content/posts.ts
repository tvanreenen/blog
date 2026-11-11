import manifest from "./manifest.gen.json";
import type { PostMetadata } from "./metadata";
export const posts: PostMetadata[] = manifest;

export function findPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}

export function findPostAlias(slug: string) {
  return posts.find((post) => post.aliases.includes(slug));
}
