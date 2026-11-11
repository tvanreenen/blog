import { describe, expect, it } from "vitest";
import {
  decodeBase32,
  encodeBase32,
  EXAMPLE_SECRET,
  generateTotpSecret,
} from "../../src/lib/totp-secret";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

describe("authenticator secrets", () => {
  it.each([
    ["", ""],
    ["f", "MY"],
    ["fo", "MZXQ"],
    ["foo", "MZXW6"],
    ["foob", "MZXW6YQ"],
    ["fooba", "MZXW6YTB"],
    ["foobar", "MZXW6YTBOI"],
  ])("matches RFC 4648 Base32 vectors for %s", (plain, encoded) => {
    expect(encodeBase32(encoder.encode(plain))).toBe(encoded);
    expect(decoder.decode(decodeBase32(encoded))).toBe(plain);
    if (encoded)
      expect(
        decoder.decode(decodeBase32(encoded.padEnd(Math.ceil(encoded.length / 8) * 8, "="))),
      ).toBe(plain);
  });

  it("accepts lowercase and whitespace, decoding the public RFC secret as bytes", () => {
    expect(decoder.decode(decodeBase32("gez dgnbvgy3tqojq\ngez dgnbvgy3tqojq"))).toBe(
      "12345678901234567890",
    );
    expect(encodeBase32(decodeBase32(EXAMPLE_SECRET))).toBe(EXAMPLE_SECRET);
  });

  it.each([
    "A",
    "ABC",
    "ABCDEF",
    "00",
    "MY!",
    "M=Y",
    "MY=",
    "MY=======",
    "MZ",
    "MZ======",
    "MZXW6YTB=",
  ])("rejects invalid alphabet, length, padding, or unused bits: %s", (value) => {
    expect(() => decodeBase32(value)).toThrow("Enter a Base32 secret");
  });

  it("generates a 160-bit seed with lossless Base32 encoding", () => {
    const secret = generateTotpSecret();
    expect(secret).toMatch(/^[A-Z2-7]{32}$/);
    const bytes = decodeBase32(secret);
    expect(bytes).toHaveLength(20);
    expect(encodeBase32(bytes)).toBe(secret);
  });
});
