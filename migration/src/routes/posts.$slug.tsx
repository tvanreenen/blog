import { createFileRoute, notFound } from "@tanstack/react-router";
import { findPost } from "../content/posts";
import { PostPage } from "../components/post-page";
import { pageHead } from "../site";

export const Route = createFileRoute("/posts/$slug")({
  beforeLoad: ({ params }) => {
    if (!findPost(params.slug)) throw notFound();
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
