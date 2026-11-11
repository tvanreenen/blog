import type { Heading, Root } from "mdast";

// The article layout owns h1. Keep relative levels while starting each body at h2.
export function articleHeadings() {
  return (tree: Root) => {
    const headings = tree.children.filter((node): node is Heading => node.type === "heading");
    const firstLevel = Math.min(...headings.map((heading) => heading.depth));
    for (const heading of headings) {
      heading.depth = Math.min(6, heading.depth - firstLevel + 2) as Heading["depth"];
    }
  };
}
