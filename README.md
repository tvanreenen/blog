# Tim VanReenen’s blog

A static blog built with TanStack Start, React, shadcn/Base UI, Tailwind CSS, and Vite. Markdown and MDX are compiled at build time with Shiki syntax highlighting. Complete HTML is prerendered for every published article; React adds the theme toggle, code controls, and interactive explanations in the browser.

## Development

Use Node 26.13.0, pinned in `.node-version`, and its bundled npm. From the repository root:

```sh
npm ci
npm run dev
```

The site runs at http://127.0.0.1:4187. Development includes draft articles. Restart after adding an article or changing frontmatter or colocated assets. Body edits update through Vite.

```sh
npm run check        # formatting, Oxlint, TypeScript, and unit tests
npm run build        # static preview artifact, excluding drafts
npm run preview      # serve that artifact at http://127.0.0.1:4188
npm run test:browser # desktop and mobile Chromium against the built artifact
```

Install the test browser when needed with `npx playwright install chromium`. The Makefile provides equivalent `serve`, `build`, `preview`, and `check` targets. `make clean` removes generated files without touching authored content or public assets.

## Repository layout

| Path                 | Responsibility                                                       |
| -------------------- | -------------------------------------------------------------------- |
| `src/routes/`        | Page routes, metadata, and the HTML document                         |
| `src/components/`    | Site layout, article rendering, and interactive figures              |
| `src/components/ui/` | Shared shadcn/Base UI components                                     |
| `src/lib/`           | TOTP calculations, setup encoding, and shared utilities              |
| `src/content/`       | Metadata validation and generated article imports/manifest           |
| `src/site.json`      | Site identity, canonical origin, social links, and sharing image     |
| `posts/<slug>/`      | Article source and colocated images/diagrams                         |
| `public/`            | Maintained favicons and site sharing image; copied unchanged by Vite |
| `scripts/`           | Content preparation, Markdown compilation, and static finalization   |
| `tests/`             | Unit tests and Playwright browser tests                              |
| `licenses/`          | Font and shadcn notices copied into the artifact                     |
| `design/concepts/`   | Hero image explorations and generation prompts; not deployed         |

`dist/`, `.tanstack/`, generated content files, `public/posts/`, and `public/licenses/` are ignored build outputs. Edit original article assets in `posts/`, never their generated public copies. Browser bundles contain only the articles selected for that build. Article bodies share a route chunk and stay separate from the homepage.

## Writing and drafts

Each article directory contains exactly one `index.md` or `index.mdx`, with YAML frontmatter:

```yaml
title: Example title
description: A short description of the article.
date: 2026-11-11
draft: true
```

`draft` is optional and must be a boolean. Drafts are available in local development but excluded from **every build**, including public branch previews. Their metadata, HTML pages, JavaScript article bodies, and colocated assets are excluded. Draft URLs return 404 in the built site. Remove `draft: true` or set it to `false` to publish on the next build. Avoid linking published articles to draft URLs; Key currently links to the xkcdpass project repository while its article is in draft.

Plain Markdown keeps literal braces and comparison operators as prose. MDX supports JSX and component imports through the `@/` alias. The page layout owns h1; article headings begin at h2. GFM tables are keyboard-scrollable, and unknown or unlabelled code fences retain the same copy/wrap controls as highlighted code.

The official shadcn typeset stylesheet is in `src/typeset.css`. Article presets and theme tokens live in `src/styles.css`. Tailwind scans `src/` and article sources explicitly, leaving documentation, tests, and design explorations out of CSS generation. Shared Card accents and description sizes are component props; diagram CSS owns data layouts. See [interactive article figures](docs/interactive-figures.md) for the live TOTP walkthrough and static fallbacks.

## Cloudflare Pages

Configure the Git-connected Pages project with these settings:

| Setting           | Value              |
| ----------------- | ------------------ |
| Production branch | `main`             |
| Framework preset  | None               |
| Root directory    | Repository root    |
| Build command     | `make pages-build` |
| Output directory  | `dist/client`      |

Use the current Pages build image and remove any old `NODE_VERSION` override so the root `.node-version` is used. Keep the default build watch paths, or include source, posts, scripts, public assets, dependency/config files, and the Makefile. The build command installs locked dependencies, including build tools under `NODE_ENV=production`, runs checks, and generates the static artifact. No Pages Functions, Workers adapter, deployment credentials, or runtime environment variables are required. `dist/server/` is used for prerendering and is not deployed.

The [Pages build variables](https://developers.cloudflare.com/pages/configuration/build-configuration/#environment-variables) select indexing behavior: `CF_PAGES=1` with `CF_PAGES_BRANCH=main` produces an indexable site. Other branches and missing branch values remain unindexed even if a production override is inherited. Local builds default to preview; development is always unindexed.

Production generates a sitemap containing the homepage and published articles, and `robots.txt` advertises it. Preview HTML, robots rules, and headers prevent indexing, and previews have no sitemap. The 404 page stays unindexed. Canonical, Open Graph, and Twitter card metadata use the production origin from `src/site.json`. Existing published slugs are preserved, including `key-secret-mananger`.

To verify the production artifact locally:

```sh
SITE_ENV=production npm run build
SITE_ENV=production npm run test:browser
```

Use the same environment for a build and its browser tests. To reproduce automatic Pages selection, use `CF_PAGES=1 CF_PAGES_BRANCH=main` instead. Build modes overwrite `dist/client/`, so run them sequentially. Static preview serves the generated headers and custom 404 without a server runtime or SPA fallback.

The dashboard settings must be updated for the replacement stack. After the first hosted deployment, check the custom domain, a direct article URL, draft and missing URLs returning 404, robots/sitemap responses, and the live TOTP example over HTTPS.

## Validation and dependencies

Oxlint enables React and JSX accessibility correctness checks. Warnings and unused suppression comments fail the command. Narrow, documented exceptions preserve the browser-only TOTP initialization after hydration, labelled data/field groups, accessible inline SVG, keyboard scrolling, Safari list semantics, and input-addon focus forwarding.

Browser tests cover all published articles and images, accessibility, theme persistence, hydration, code controls, static reading without JavaScript, indexing and sharing metadata, sitemap contents, draft exclusion, and the linked live calculations and failure states. The theme uses a DOM external store, and the prerendered footer year is serialized as route data to keep hydration consistent.

The dependency audit has six low/moderate advisories in the development-only shadcn CLI chain. Recheck upstream rather than applying npm’s proposed breaking downgrade to shadcn 1.0.0. Build output includes font, shadcn, and bundled dependency notices.
