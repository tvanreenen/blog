import { describe, expect, it } from "vitest";
import { totpSetupUri } from "../../src/lib/totp-setup";
import { decodeBase32, EXAMPLE_SECRET } from "../../src/lib/totp-secret";

describe("authenticator provisioning", () => {
  it("carries the canonical secret, matching issuer label, and the walkthrough's exact settings", () => {
    const uri = new URL(totpSetupUri(decodeBase32(`  ${EXAMPLE_SECRET.toLowerCase()}  `)));
    expect(uri.protocol).toBe("otpauth:");
    expect(uri.hostname).toBe("totp");
    expect(decodeURIComponent(uri.pathname)).toBe("/Blog demo:reader");
    expect(Object.fromEntries(uri.searchParams)).toEqual({
      secret: EXAMPLE_SECRET,
      issuer: "Blog demo",
      algorithm: "SHA1",
      digits: "6",
      period: "30",
    });
    expect(uri.searchParams.get("secret")).not.toContain("=");
  });
});
