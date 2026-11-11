export interface PostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
  draft: boolean;
  aliases: string[];
}

export function parsePostMetadata(slug: string, data: Record<string, unknown>): PostMetadata {
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  if (
    !/^[a-z0-9-]+$/.test(slug) ||
    typeof data.title !== "string" ||
    !data.title.trim() ||
    typeof data.description !== "string" ||
    !data.description.trim() ||
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date ||
    (data.draft !== undefined && typeof data.draft !== "boolean") ||
    (data.aliases !== undefined &&
      (!Array.isArray(data.aliases) ||
        data.aliases.some(
          (alias) => typeof alias !== "string" || !/^[a-z0-9-]+$/.test(alias) || alias === slug,
        ) ||
        new Set(data.aliases).size !== data.aliases.length))
  ) {
    throw new Error(`Invalid post metadata: ${slug}`);
  }
  return {
    slug,
    title: data.title,
    description: data.description,
    date,
    draft: data.draft === true,
    aliases: (data.aliases as string[] | undefined) ?? [],
  };
}

export function validatePostCatalog(posts: PostMetadata[]) {
  const paths = new Set<string>();
  for (const post of posts) {
    if (paths.has(post.slug)) throw new Error(`Duplicate article URL: ${post.slug}`);
    paths.add(post.slug);
  }
  for (const post of posts) {
    for (const alias of post.aliases) {
      if (paths.has(alias)) throw new Error(`Duplicate article URL: ${alias}`);
      paths.add(alias);
    }
  }
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
