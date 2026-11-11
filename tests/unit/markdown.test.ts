import { createElement } from "react";
import * as runtime from "react/jsx-runtime";
import { renderToStaticMarkup } from "react-dom/server";
import { evaluate } from "@mdx-js/mdx";
import { describe, expect, it } from "vitest";
import { markdownOptions } from "../../scripts/markdown";
import { articleComponents } from "../../src/components/article-content";

describe("article compilation", () => {
  it("gives unlabelled fences the same code controls", async () => {
    const { default: Content } = await evaluate("```\nx + y\n```", {
      ...markdownOptions,
      ...runtime,
      format: "md",
    });
    const html = renderToStaticMarkup(createElement(Content, { components: articleComponents }));
    expect(html).toContain('data-slot="code-block"');
    expect(html).toContain("Plain text");
    expect(html).toContain("x + y");
  });
  it("preserves Markdown prose, tables, code, and blank lines through the real article renderer", async () => {
    const source =
      "Literal {braces} and x < y.\n\n### Section\n\n| A | B |\n| --- | --- |\n| 1 | 2 |\n\n```python\nx = 1\n\nprint(x)\n```";
    const { default: Content } = await evaluate(source, {
      ...markdownOptions,
      ...runtime,
      format: "md",
    });
    const html = renderToStaticMarkup(createElement(Content, { components: articleComponents }));
    expect(html).toContain("Literal {braces} and x &lt; y.");
    expect(html).toContain("<h2>Section</h2>");
    expect(html).toContain("<table>");
    expect(html).toContain('data-slot="code-block"');
    expect(html).toContain("--shiki-light:");
    expect((html.match(/data-slot="code-block-line"/g) ?? []).length).toBe(3);
  });

  it("supports JSX components in MDX and falls back to readable code for unknown languages", async () => {
    const source =
      "export const Note = () => <aside>Component content</aside>\n\n## Example\n\n<Note />\n\n```not-a-language\nplain output\n```";
    const { default: Content } = await evaluate(source, {
      ...markdownOptions,
      ...runtime,
      format: "mdx",
    });
    const html = renderToStaticMarkup(createElement(Content, { components: articleComponents }));
    expect(html).toContain("<aside>Component content</aside>");
    expect(html).toContain("plain output");
    expect(html).toContain('data-slot="code-block"');
  });
});
