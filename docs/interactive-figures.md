# Article-local interactive writing

An article owns its specialized text, graphics, components, state, calculations, styles, and tests. Shared site components provide the article shell, typography, code blocks, tables, and shadcn controls. Promote a local piece into shared code when another article actually needs it.

The TOTP article is the first complete example:

```text
posts/totp/
  index.mdx                 Narrative and local figure composition
  example.tsx               Article-scoped state
  styles.module.css         Scoped diagram styles and responsive rules
  components/               Figures, clock, byte displays, and setup UI
  lib/                      Calculations and their unit tests
  assets/                   Static SVG explanations
  totp.browser.spec.ts      Browser behavior and no-JavaScript reading
```

Plain articles can remain `index.md` with a hero image. Add folders as the article grows.

## MDX composition

Import named figures locally and export the article's provider/layout as the default MDX layout:

```mdx
export { HmacExampleProvider as default } from "./example";
import { SecretFigure, ClockFigure } from "./components/figures";

## Two copies of a secret, one shared clock

The article’s prose stays here.

<SecretFigure />

More explanation, followed by another view of the same example.

<ClockFigure />
```

MDX applies the default layout around the article body. The provider can therefore connect multiple figures without adding article-specific conditions to the shared renderer. Each figure owns its static fallback and browser enhancement. There is no shared figure-name registry or interactive frontmatter switch.

## Styles and assets

Import CSS Module class maps in local components. The static finalizer follows each article’s static dependencies in Vite’s build manifest and adds its stylesheet links to that article’s HTML. Optional dynamic imports stay lazy. This keeps scoped styles with the article and gives static figures their full styling without JavaScript; no article-specific stylesheet registry is needed. The build manifest is removed from the public artifact after finalization.

Keep publishable graphics inside `assets/`, with nested folders when useful. Content preparation copies supported image/PDF files recursively from that directory, and also supports existing flat article images. Components, tests, Markdown, stylesheets, notes, and arbitrary files are not copied as public files. Components may also import local data through Vite normally. Generated copies in `public/posts/` are never edited directly.

Each published MD/MDX entry is imported lazily and preloaded by the article route. Its imports and CSS travel with that entry. Draft entries are omitted from the generated loader map and their assets are not copied.

## TOTP behavior

`HmacExampleProvider` owns the secret, current clock, and derived calculation for one article. The clock runs continuously and recalculates on window changes. Generating a new secret updates every figure. Both before/after input cards and all later byte selections use the same values. Reduced-motion mode preserves updates without animated transitions.

The article renders eight SVG fallbacks during prerendering, initial hydration, and no-JavaScript reading. They use the public RFC test secret at 59 seconds after the Unix epoch, adapted to six digits. When browser crypto is available, the provider generates a fresh seed and activates the live figures.

Browser-generated secrets stay in article state: refreshing does not send requests, change the URL, or write browser storage. Following the explicit setup link or scanning its QR transfers the demo seed to the reader’s authenticator. The QR encoder loads only for that live figure; article-local tests independently decode it and verify calculations against Node crypto.

## Verification

Unit tests beside article code use `*.test.ts` or `*.test.tsx`. Browser tests use `*.browser.spec.ts`; the shared Playwright configuration runs browser tests for published articles in desktop and mobile Chromium. Draft article browser tests are excluded because their built pages intentionally return 404. Unit, lint, and type checks still include draft code. Keep global routing, publication, and bundle-isolation checks under `tests/`.

Run `npm run check`, `npm run build`, and `npm run test:browser` from the repository root. Use matching production/preview environment settings for the build and browser tests. Include static fallback styling, keyboard behavior, accessible names, reduced motion, and failure states when changing an interactive explanation.
