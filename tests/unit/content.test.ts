import { describe, expect, it } from "vitest";
import { parsePostMetadata, formatPostDate, validatePostCatalog } from "../../src/content/metadata";
import { readPosts } from "../../scripts/posts";

describe("existing content contract", () => {
  it("keeps the renamed TOTP article's previous slug as an alias", async () => {
    const posts = await readPosts();
    expect(posts.find((post) => post.slug === "totp")?.aliases).toEqual(["totp-in-swift"]);
  });
  it("keeps post slugs, authored dates, and newest-first ordering", async () => {
    const posts = await readPosts();
    expect(posts.map((post) => post.slug)).toEqual([
      "totp",
      "key-secret-mananger",
      "numpy-vector-store",
      "from-aerospace-to-frame",
      "embeddings",
      "blog-charter",
    ]);
    expect(posts.find((post) => post.slug === "numpy-vector-store")?.date).toBe("2026-04-04");
  });

  it("includes drafts only when explicitly requested for local development", async () => {
    const published = await readPosts();
    expect(published.some((post) => post.draft)).toBe(false);
    const drafts = await readPosts({ includeDrafts: true });
    expect(drafts.find((post) => post.slug === "xkcdpass")?.draft).toBe(true);
    expect(drafts.length).toBe(published.length + 1);
  });

  it.each(["true", "false", 0, null])("rejects non-boolean draft flag %s", (draft) => {
    expect(() =>
      parsePostMetadata("example", {
        title: "Example",
        description: "Description",
        date: "2026-04-04",
        draft,
      }),
    ).toThrow("Invalid post metadata");
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

describe("article URL ownership", () => {
  const metadata = { title: "Example", description: "Description", date: "2026-11-11" };
  it.each(["old", ["bad/path"], [""], ["example"], ["old", "old"], [42]])(
    "rejects invalid aliases %j",
    (aliases) => {
      expect(() => parsePostMetadata("example", { ...metadata, aliases })).toThrow(
        "Invalid post metadata",
      );
    },
  );
  it("accepts independent canonical URLs and aliases", () => {
    expect(() =>
      validatePostCatalog([
        parsePostMetadata("one", { ...metadata, aliases: ["old-one"] }),
        parsePostMetadata("two", { ...metadata, aliases: ["old-two"] }),
      ]),
    ).not.toThrow();
  });
  it.each([
    ["one", [], "one", []],
    ["one", ["old"], "two", ["old"]],
    ["one", ["two"], "two", []],
  ] as const)("rejects colliding article paths", (first, firstAliases, second, secondAliases) => {
    expect(() =>
      validatePostCatalog([
        parsePostMetadata(first, { ...metadata, aliases: [...firstAliases] }),
        parsePostMetadata(second, { ...metadata, aliases: [...secondAliases], draft: true }),
      ]),
    ).toThrow("Duplicate article URL");
  });
});
