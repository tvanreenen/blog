import identity from "../../_data/site.json";

export const site = identity;

export function pageHead(title: string, description: string, path: string) {
  return {
    meta: [
      { title },
      { name: "description", content: description },
      { name: "robots", content: "noindex, nofollow" },
      { name: "google-site-verification", content: site.googleSiteVerification },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: path === "/" ? "website" : "article" },
      { property: "og:url", content: `${site.url}${path}` },
      { property: "og:image", content: site.ogImage },
      { property: "og:site_name", content: site.name },
    ],
    links: [{ rel: "canonical", href: `${site.url}${path}` }],
  };
}
