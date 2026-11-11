import { defineConfig, devices } from "@playwright/test";
import { readPosts } from "./scripts/posts";

const posts = await readPosts();

export default defineConfig({
  testDir: ".",
  testMatch: [
    "tests/browser/**/*.spec.ts",
    ...posts.map((post) => `posts/${post.slug}/**/*.browser.spec.ts`),
  ],
  fullyParallel: true,
  workers: 2,
  forbidOnly: !!process.env.CI,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:4188",
    reducedMotion: "reduce",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 } },
    },
    { name: "mobile", use: { ...devices["iPhone 13"], defaultBrowserType: "chromium" } },
  ],
  webServer: {
    command: "npm run preview -- --strictPort",
    url: "http://127.0.0.1:4188",
    reuseExistingServer: !process.env.CI,
  },
});
