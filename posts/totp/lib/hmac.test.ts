import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import { calculateHmac, EXAMPLE_DIGEST, EXAMPLE_KEY, MAX_COUNTER, toHex } from "./hmac";

describe("interactive HMAC calculation", () => {
  it("reproduces the article's RFC example, message bytes, and six-digit code", async () => {
    const result = await calculateHmac(new TextEncoder().encode(EXAMPLE_KEY), "1");
    expect(toHex(result.bytes)).toBe(EXAMPLE_DIGEST);
    expect(result.message).toEqual([0, 0, 0, 0, 0, 0, 0, 1]);
    expect(result.keyByteLength).toBe(20);
    expect(result.code).toBe("287082");
    expect(result.offset).toBe(11);
    expect(toHex(result.selected)).toBe("c1397eea");
    expect(toHex(result.masked)).toBe("41397eea");
    expect(result.number).toBe(1094287082);
    expect(result.quotient).toBe(1094);
  });

  it.each([
    ["0", "755224"],
    ["2", "359152"],
    ["30", "026920"],
  ])("keeps known counter values and leading zeroes for counter %s", async (counter, code) => {
    expect((await calculateHmac(new TextEncoder().encode(EXAMPLE_KEY), counter)).code).toBe(code);
  });

  it.each([
    ["hello ☕", "2"],
    ["a".repeat(100), "9007199254740993"],
    ["another key", MAX_COUNTER.toString()],
  ])(
    "matches an independent HMAC implementation for UTF-8, long keys, and large counters",
    async (key, counter) => {
      const message = Buffer.alloc(8);
      message.writeBigUInt64BE(BigInt(counter));
      const expected = createHmac("sha1", key).update(message).digest("hex");
      const result = await calculateHmac(new TextEncoder().encode(key), counter);
      expect(toHex(result.bytes)).toBe(expected);
      expect(toHex(result.message)).toBe(message.toString("hex"));
    },
  );

  it.each(["", "-1", "1.5", "no", (MAX_COUNTER + 1n).toString()])(
    "rejects a counter that cannot be encoded in eight bytes: %s",
    async (counter) => {
      await expect(calculateHmac(new TextEncoder().encode(EXAMPLE_KEY), counter)).rejects.toThrow(
        "Enter a whole number",
      );
    },
  );

  it("rejects an empty key", async () => {
    await expect(calculateHmac(new Uint8Array(), "1")).rejects.toThrow("Enter a key.");
  });
});
