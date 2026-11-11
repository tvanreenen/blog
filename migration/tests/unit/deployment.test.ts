import { describe, expect, it } from "vitest";
import { isProductionBuild } from "../../scripts/deployment";

describe("deployment indexing policy", () => {
  it.each([
    [{}, false],
    [{ SITE_ENV: "preview" }, false],
    [{ SITE_ENV: "production" }, true],
    [{ CF_PAGES_BRANCH: "main" }, false],
    [{ CF_PAGES: "1" }, false],
    [{ CF_PAGES: "1", CF_PAGES_BRANCH: "main" }, true],
    [{ CF_PAGES: "1", CF_PAGES_BRANCH: "feat/shadcn-blog-migration" }, false],
    [{ CF_PAGES: "1", CF_PAGES_BRANCH: "preview", SITE_ENV: "production" }, false],
    [{ CF_PAGES: "1", CF_PAGES_BRANCH: "main", SITE_ENV: "preview" }, true],
  ])("resolves %j to production=%s", (environment, production) => {
    expect(isProductionBuild(environment)).toBe(production);
  });

  it("rejects misspelled local build environments", () => {
    expect(() => isProductionBuild({ SITE_ENV: "prodution" })).toThrow(
      "SITE_ENV must be preview or production",
    );
  });
});
