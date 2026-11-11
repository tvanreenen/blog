import { Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { articles } from "../content/articles.gen";
import { findPost } from "../content/posts";
import { formatPostDate } from "../content/metadata";
import { articleComponents } from "./article-content";
import { HmacExampleProvider } from "./hmac-example";

export function PostPage({ slug }: { slug: string }) {
  const post = findPost(slug);
  const module =
    articles[`../../posts/${slug}/index.md`] ?? articles[`../../posts/${slug}/index.mdx`];
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
