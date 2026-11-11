import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { readFile, readdir } from "node:fs/promises";
import matter from "gray-matter";
import { readPosts } from "../../scripts/posts";
import { isProductionBuild } from "../../scripts/deployment";
import site from "../../src/site.json" with { type: "json" };

const production = isProductionBuild(process.env);
const robots = production ? "index, follow" : "noindex, nofollow";

test("renamed article URLs permanently redirect to the canonical article", async ({
  page,
  request,
}) => {
  for (const path of [
    "/posts/totp-in-swift",
    "/posts/totp-in-swift/",
    "/posts/totp-in-swift/index.html",
  ]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(301);
    expect(response.headers().location).toBe("/posts/totp/");
  }
  await page.goto("/posts/totp-in-swift/");
  await expect(page).toHaveURL(/\/posts\/totp\/$/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${site.url}/posts/totp/`,
  );
  expect((await request.get("/posts/totp/components/inputs.tsx")).status()).toBe(404);
  expect((await request.get("/posts/totp/lib/hmac.test.ts")).status()).toBe(404);
});

test("article code and styles load independently while navigation still renders complete pages", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const bodies: Promise<string>[] = [];
  page.on("response", (response) => {
    if (/\.(?:js|css)(?:\?|$)/.test(response.url())) bodies.push(response.text());
  });
  await page.goto("/posts/numpy-vector-store/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "When NumPy Is Already the Vector Database You Need",
  );
  await page.getByRole("button", { name: "Theme: system. Switch to light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  const plainArticle = (await Promise.all(bodies)).join("\n");
  expect(plainArticle).not.toContain("Authenticator secret (Base32)");
  expect(plainArticle).not.toContain("hmac-explorer");
  await page.getByRole("link", { name: "All writing", exact: true }).click();
  await page.getByRole("link", { name: /Making Sense of One-Time Passwords/ }).click();
  await expect(page.getByLabel("Authenticator secret (Base32)", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("img", { name: "QR code for this setup URI", exact: true }),
  ).toBeVisible();
  expect((await Promise.all(bodies)).join("\n")).toContain("Authenticator secret (Base32)");
  expect(errors).toEqual([]);
});

test("homepage navigation, article accessibility, and responsive reading", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/");
  await expect(page).toHaveTitle("Tim VanReenen");
  await expect(page.locator("ul.post-list > li")).toHaveCount((await readPosts()).length);
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Skip to content" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.locator("main")).toBeFocused();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("link", { name: /When NumPy Is Already/ }).click();
  await expect(page).toHaveURL(/\/posts\/numpy-vector-store\/$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "When NumPy Is Already the Vector Database You Need",
  );
  await expect(page.locator('[data-slot="code-block"]')).toHaveCount(9);
  await expect(page.locator("table")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("theme preference follows the system, can be changed, and survives reload", async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");
  await page.getByRole("button", { name: "Theme: system. Switch to light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: "Theme: light. Switch to dark", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(
    page.getByRole("button", { name: "Theme: dark. Switch to system", exact: true }),
  ).toBeVisible();
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.goto("/posts/numpy-vector-store/");
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  await page.getByRole("button", { name: "Theme: dark. Switch to system", exact: true }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme");
});

test("the prerendered footer hydrates when the browser reports a different year", async ({
  page,
  request,
}) => {
  const html = await (await request.get("/")).text();
  const year = /©(?:\s|<!--.*?-->)*(\d{4})/.exec(html)?.[1];
  expect(year).toBeDefined();
  await page.addInitScript(
    (clientYear) => {
      Date.prototype.getUTCFullYear = () => clientYear;
    },
    Number(year) + 5,
  );
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/");
  await page.getByRole("button", { name: "Theme: system. Switch to light", exact: true }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  expect(errors).toEqual([]);
});

test("copy retains code text and blank lines; wrap control changes overflow mode", async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName !== "chromium", "Clipboard permissions use Chromium's supported API.");
  await context.grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.goto("/posts/numpy-vector-store/");
  const block = page.locator('[data-slot="code-block"]').nth(1);
  await block.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(block.getByRole("button", { name: "Copied", exact: true })).toBeVisible();
  const original = matter(
    await readFile(new URL("../../posts/numpy-vector-store/index.md", import.meta.url), "utf8"),
  ).content;
  const code = /```python\n([\s\S]*?)\n```/.exec(original)![1];
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code);
  const wrap = block.getByRole("button", { name: "Wrap code" });
  await wrap.click();
  await expect(wrap).toHaveAttribute("aria-pressed", "true");
  await expect(block.locator("pre")).toHaveAttribute("data-wrap");
});

test("static article remains complete without JavaScript; deployment indexing and 404s are preserved", async ({
  browser,
  request,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4188/posts/numpy-vector-store/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(
    page.getByText("That understanding was the whole point.", { exact: true }),
  ).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", robots);
  await context.close();
  const robotsResponse = await request.get("/robots.txt");
  expect(robotsResponse.headers()["x-robots-tag"]).toBe(
    production ? undefined : "noindex, nofollow",
  );
  expect(await robotsResponse.text()).toBe(
    production
      ? `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`
      : "User-agent: *\nDisallow: /\n",
  );
  const missing = await request.get("/work/");
  expect(missing.status()).toBe(404);
  expect(await missing.text()).toContain("Page not found.");
  expect(await missing.text()).toContain('name="robots" content="noindex, nofollow"');
});

test("canonical and sharing metadata follow navigation; only production publishes a sitemap", async ({
  page,
  request,
}) => {
  await page.goto("/");
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", robots);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${site.url}/`);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", `${site.url}/`);
  await page.getByRole("link", { name: /Building a CLI Secret Manager/ }).click();
  await expect(page).toHaveURL(/\/posts\/key-secret-mananger\/$/);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", robots);
  const canonical = `${site.url}/posts/key-secret-mananger/`;
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", canonical);
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute("content", canonical);
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
    "content",
    "Building a CLI Secret Manager",
  );
  await expect(page.locator('meta[name="twitter:title"]')).toHaveAttribute(
    "content",
    "Building a CLI Secret Manager",
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute("content", site.ogImage);
  await expect(page.locator('meta[name="twitter:image"]')).toHaveAttribute("content", site.ogImage);
  const sitemap = await request.get("/sitemap.xml");
  expect(sitemap.status()).toBe(production ? 200 : 404);
  if (production) {
    const entries = await page.evaluate(
      (xml) => {
        const document = new DOMParser().parseFromString(xml, "application/xml");
        if (document.querySelector("parsererror")) throw new Error("Invalid sitemap XML");
        return [...document.querySelectorAll("loc")].map((entry) => entry.textContent);
      },
      await sitemap.text(),
    );
    const posts = await readPosts();
    expect(entries).toEqual([
      `${site.url}/`,
      ...posts.map((post) => `${site.url}/posts/${post.slug}/`),
    ]);
  }
});

test("a denied clipboard request announces a manual copying fallback", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: () => Promise.reject(new Error("Denied")) },
      configurable: true,
    });
  });
  await page.goto("/posts/numpy-vector-store/");
  const block = page.locator('[data-slot="code-block"]').first();
  await block.getByRole("button", { name: "Copy", exact: true }).click();
  await expect(block.locator('[aria-live="polite"]')).toHaveText(
    "Could not copy. Select and copy the code manually.",
  );
});

test("drafts have no built page, navigation link, assets, or bundled article body", async ({
  page,
  request,
}) => {
  expect((await request.get("/posts/xkcdpass/")).status()).toBe(404);
  await page.goto("/");
  await expect(
    page.getByRole("link", { name: /Secure Passwords Don't Have to Be Hard to Use/ }),
  ).toHaveCount(0);
  await page.getByRole("link", { name: /Building a CLI Secret Manager/ }).click();
  await expect(page.locator('a[href="/posts/xkcdpass/"]')).toHaveCount(0);
  const assetDirectory = new URL("../../dist/client/assets/", import.meta.url);
  for (const file of await readdir(assetDirectory)) {
    if (!file.endsWith(".js")) continue;
    const source = await readFile(new URL(file, assetDirectory), "utf8");
    expect(source).not.toContain("word-based passphrases");
    expect(source).not.toContain("Secure Passwords Don");
  }
  expect(await readdir(new URL("../../dist/client/posts/", import.meta.url))).not.toContain(
    "xkcdpass",
  );
});

test("all existing articles keep their local images and code fences", async ({ page }) => {
  for (const post of await readPosts()) {
    const directory = new URL(`../../posts/${post.slug}/`, import.meta.url);
    const entry = (await readdir(directory)).find((file) => /^index\.mdx?$/.test(file))!;
    const source = await readFile(new URL(entry, directory), "utf8");
    const fences = [...source.matchAll(/^```[^\n]*\n([\s\S]*?)\n```/gm)];
    await page.goto(`/posts/${post.slug}/`);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(post.title);
    await expect(page.locator('[data-slot="code-block"]')).toHaveCount(fences.length);
    for (const image of await page.locator("article img").all()) {
      await image.scrollIntoViewIfNeeded();
      expect(
        await image.evaluate(
          (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
        ),
      ).toBe(true);
    }
    expect(
      (await new AxeBuilder({ page }).analyze()).violations.map((violation) => violation.id),
    ).toEqual([]);
  }
});
