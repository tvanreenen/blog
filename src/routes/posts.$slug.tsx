import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { findPost, findPostAlias } from "../content/posts";
import { articleEntries } from "../content/articles";
import { PostPage } from "../components/post-page";
import { pageHead } from "../site";

export const Route = createFileRoute("/posts/$slug")({
  beforeLoad: ({ params }) => {
    const alias = findPostAlias(params.slug);
    if (alias)
      throw redirect({
        to: "/posts/$slug/",
        params: { slug: alias.slug },
        statusCode: 301,
        replace: true,
      });
    if (!findPost(params.slug)) throw notFound();
  },
  loader: async ({ params }) => {
    await articleEntries[params.slug]?.preload?.();
  },
  head: ({ params }) => {
    const post = findPost(params.slug);
    return post
      ? pageHead(post.title, post.description, `/posts/${post.slug}/`)
      : pageHead("Page not found", "This page could not be found.", "/404");
  },
  component: ArticleRoute,
});

function ArticleRoute() {
  const { slug } = Route.useParams();
  return <PostPage slug={slug} />;
}
