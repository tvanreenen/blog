// Pages supplies these variables for both production and branch deployments.
// Fail closed when the branch is missing; local builds require an explicit opt-in.
export function isProductionBuild(environment: Record<string, string | undefined>) {
  if (environment.CF_PAGES === "1") return environment.CF_PAGES_BRANCH === "main";
  if (environment.SITE_ENV && !["preview", "production"].includes(environment.SITE_ENV)) {
    throw new Error("SITE_ENV must be preview or production");
  }
  return environment.SITE_ENV === "production";
}
