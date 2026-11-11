import manifest from "./manifest.gen.json";
export const posts = manifest;

export function findPost(slug: string) {
  return posts.find((post) => post.slug === slug);
}
