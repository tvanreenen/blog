import type { Root } from "mdast";

// A marked, standalone image stays portable Markdown for the legacy build.
export function interactiveFigures() {
  return (tree: Root) => {
    for (const node of tree.children) {
      if (node.type !== "paragraph" || node.children.length !== 1) continue;
      const image = node.children[0];
      if (image?.type !== "image") continue;
      const marker =
        /#interactive-(hmac(?:-(?:base32|setup|clock|select|mask|number|remainder))?)$/.exec(
          image.url,
        );
      if (!marker) continue;
      image.url = image.url.slice(0, -marker[0].length);
      node.data = {
        ...node.data,
        hName: "figure",
        hProperties: { "data-interactive": marker[1]! },
      };
    }
  };
}
