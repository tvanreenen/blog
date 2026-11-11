import { Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import type { MDXContent } from "mdx/types";
import { findPost } from "../content/posts";
import { formatPostDate } from "../content/metadata";
import { articleComponents } from "./article-content";
import { HmacExampleProvider } from "./hmac-example";

const modules = import.meta.glob<{ default: MDXContent; frontmatter?: { interactive?: string } }>(
  "../../../posts/*/index.{md,mdx}",
  {
    eager: true,
  },
);

export function PostPage({ slug }: { slug: string }) {
  const post = findPost(slug);
  const module =
    modules[`../../../posts/${slug}/index.md`] ?? modules[`../../../posts/${slug}/index.mdx`];
  const Content = module?.default;
  if (!post || !Content) throw notFound();
  return (
    <article className="article">
      <Link to="/" className="back-link">
        <ArrowLeft aria-hidden="true" /> All writing
      </Link>
      <header className="article-header">
        <time dateTime={post.date}>{formatPostDate(post.date)}</time>
        <h1>
          {post.title.split(/(\s+)/).map((word, index) =>
            word.includes("-") ? (
              <span key={index} className="whitespace-nowrap">
                {word}
              </span>
            ) : (
              word
            ),
          )}
        </h1>
        <p>{post.description}</p>
      </header>
      <div className="typeset typeset-article">
        {module?.frontmatter?.interactive === "hmac" ? (
          <HmacExampleProvider key={slug}>
            <Content components={articleComponents} />
          </HmacExampleProvider>
        ) : (
          <Content components={articleComponents} />
        )}
      </div>
    </article>
  );
}
