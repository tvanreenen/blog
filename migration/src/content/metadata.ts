export interface PostMetadata {
  slug: string;
  title: string;
  description: string;
  date: string;
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
    new Date(date).toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`Invalid post metadata: ${slug}`);
  }
  return { slug, title: data.title, description: data.description, date };
}

export function formatPostDate(date: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}
