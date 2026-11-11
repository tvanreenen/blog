import { Link, notFound } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { articleEntries } from "../content/articles";
import { findPost } from "../content/posts";
import { formatPostDate } from "../content/metadata";
import { articleComponents } from "./article-content";

export function PostPage({ slug }: { slug: string }) {
  const post = findPost(slug);
  const Content = articleEntries[slug];
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
        <Content components={articleComponents} />
      </div>
    </article>
  );
}
