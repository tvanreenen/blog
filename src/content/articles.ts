import { lazyRouteComponent } from "@tanstack/react-router";
import { articles } from "./articles.gen";

// Keep component identities stable across renders and preload only the selected article.
export const articleEntries = Object.fromEntries(
  Object.entries(articles).map(([path, load]) => [
    path.split("/").at(-2)!,
    lazyRouteComponent(load),
  ]),
);
