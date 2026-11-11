import { describe, expect, it } from "vitest";
import { articleStylesheets } from "../../scripts/article-assets";
import type { Manifest } from "vite";

describe("prerendered article styles", () => {
  it("includes static dependencies once, handles cycles, and leaves optional interactions lazy", () => {
    const manifest: Manifest = {
      article: {
        file: "article.js",
        imports: ["shared", "shared"],
        css: ["article.css"],
        dynamicImports: ["optional"],
      },
      shared: { file: "shared.js", css: ["shared.css"], imports: ["article"] },
      optional: { file: "optional.js", css: ["optional.css"] },
    };
    expect(articleStylesheets(manifest, "article")).toEqual(["/article.css", "/shared.css"]);
  });

  it("supports articles without a stylesheet", () => {
    expect(articleStylesheets({ article: { file: "article.js" } }, "article")).toEqual([]);
  });

  it("fails the build for missing entries or dependencies rather than shipping unstyled content", () => {
    expect(() => articleStylesheets({}, "article")).toThrow(
      "Missing build manifest entry: article",
    );
    expect(() =>
      articleStylesheets({ article: { file: "article.js", imports: ["missing"] } }, "article"),
    ).toThrow("Missing build manifest entry: missing");
  });
});
