import { describe, expect, it } from "vitest";
import { parsePostMetadata, formatPostDate } from "../../src/content/metadata";
import { readPosts } from "../../scripts/posts";

describe("existing content contract", () => {
  it("keeps post slugs, authored dates, and newest-first ordering", async () => {
    const posts = await readPosts();
    expect(posts.map((post) => post.slug)).toEqual([
      "totp-in-swift",
      "xkcdpass",
      "key-secret-mananger",
      "numpy-vector-store",
      "from-aerospace-to-frame",
      "embeddings",
      "blog-charter",
    ]);
    expect(posts.find((post) => post.slug === "numpy-vector-store")?.date).toBe("2026-04-04");
  });

  it("normalizes YAML dates and formats them independently of the machine timezone", () => {
    const post = parsePostMetadata("example", {
      title: "Example",
      description: "Description",
      date: new Date("2026-04-04T00:00:00Z"),
    });
    expect(post.date).toBe("2026-04-04");
    expect(formatPostDate(post.date)).toBe("April 4, 2026");
  });

  it.each(["2026-02-30", "invalid", "2026-13-01", undefined])(
    "rejects invalid authored date %s",
    (date) => {
      expect(() =>
        parsePostMetadata("example", { title: "Example", description: "Description", date }),
      ).toThrow("Invalid post metadata");
    },
  );
});
