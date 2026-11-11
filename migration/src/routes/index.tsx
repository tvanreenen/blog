import { createFileRoute, Link } from "@tanstack/react-router";
import { Fragment } from "react";
import { ArrowUpRight } from "lucide-react";
import { posts } from "../content/posts";
import { formatPostDate } from "../content/metadata";
import { site, pageHead } from "../site";
import { Item, ItemActions, ItemContent, ItemGroup, ItemSeparator } from "../components/ui/item";

export const Route = createFileRoute("/")({
  head: () => pageHead(site.name, site.description, "/"),
  component: HomePage,
});

function HomePage() {
  return (
    <section aria-labelledby="writing-heading" className="writing-section">
      <div className="section-heading">
        <h1 id="writing-heading">Writing</h1>
        <span>{posts.length} essays</span>
      </div>
      <ItemGroup className="post-list">
        {posts.map((post, index) => (
          <Fragment key={post.slug}>
            {index > 0 && <ItemSeparator aria-hidden="true" />}
            <div role="listitem">
              <Item
                render={<Link to="/posts/$slug/" params={{ slug: post.slug }} />}
                className="post-link"
              >
                <time dateTime={post.date}>{formatPostDate(post.date)}</time>
                <ItemContent>
                  <h2>{post.title}</h2>
                  <p>{post.description}</p>
                </ItemContent>
                <ItemActions>
                  <ArrowUpRight aria-hidden="true" />
                </ItemActions>
              </Item>
            </div>
          </Fragment>
        ))}
      </ItemGroup>
    </section>
  );
}
