import type { Options } from "@mdx-js/rollup";
import rehypeShiki from "@shikijs/rehype";
import type { RehypeShikiOptions } from "@shikijs/rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import remarkGfm from "remark-gfm";
import { articleHeadings } from "./headings.ts";

const highlighting: RehypeShikiOptions = {
  themes: { light: "github-light-high-contrast", dark: "github-dark-high-contrast" },
  defaultColor: false,
  fallbackLanguage: "text",
  defaultLanguage: "text",
  lazy: true,
  transformers: [
    {
      pre(node) {
        node.properties["data-code"] = this.source;
        node.properties["data-language"] = this.options.lang;
      },
    },
  ],
};

export const markdownOptions: Options = {
  remarkPlugins: [
    remarkFrontmatter,
    [remarkMdxFrontmatter, { name: "frontmatter" }],
    remarkGfm,
    articleHeadings,
  ],
  rehypePlugins: [[rehypeShiki, highlighting]],
};
