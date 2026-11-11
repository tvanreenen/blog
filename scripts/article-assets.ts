import type { Manifest } from "vite";

// Follow static imports only: optional interactions keep their own lazy assets.
export function articleStylesheets(manifest: Manifest, entry: string) {
  const visited = new Set<string>();
  const stylesheets = new Set<string>();
  const visit = (path: string) => {
    if (visited.has(path)) return;
    visited.add(path);
    const chunk = manifest[path];
    if (!chunk) throw new Error(`Missing build manifest entry: ${path}`);
    for (const stylesheet of chunk.css ?? []) stylesheets.add(`/${stylesheet}`);
    for (const dependency of chunk.imports ?? []) visit(dependency);
  };
  visit(entry);
  return [...stylesheets];
}
