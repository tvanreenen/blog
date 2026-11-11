import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { createHmac } from "node:crypto";
import jsQR from "jsqr";

const referenceSecret = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

// Derive expected values with Node's independent crypto implementation.
async function expectSharedCalculation(page: import("@playwright/test").Page, counter: bigint) {
  const key = Buffer.from(
    (await page.getByLabel("Secret bytes before Base32", { exact: true }).innerText()).replace(
      /\s/g,
      "",
    ),
    "hex",
  );
  const message = Buffer.alloc(8);
  message.writeBigUInt64BE(counter);
  await expect(page.getByLabel("HMAC key bytes", { exact: true })).toHaveText(
    Array.from(key)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" "),
  );
  await expect(page.getByLabel("HMAC decimal counter", { exact: true })).toHaveText(
    String(counter),
  );
  await expect(page.getByLabel("Counter encoded as bytes", { exact: true })).toHaveText(
    Array.from(message)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" "),
  );
  const uriSecret = new URL(
    (await page.getByLabel("Setup URI", { exact: true }).textContent())!,
  ).searchParams.get("secret")!;
  await expect(page.getByLabel("HMAC Base32 secret", { exact: true })).toHaveText(uriSecret);
  await expect(page.getByLabel("Authenticator secret (Base32)", { exact: true })).toHaveText(
    uriSecret,
  );
  const digest = createHmac("sha1", key).update(message).digest();
  const lastBits = digest[19]!.toString(2).padStart(8, "0");
  await expect(page.getByLabel("Selector byte", { exact: true })).toHaveText(
    digest[19]!.toString(16).padStart(2, "0"),
  );
  await expect(page.getByLabel("Upper four bits", { exact: true })).toHaveText(
    lastBits.slice(0, 4),
  );
  await expect(page.getByLabel("Lower four bits", { exact: true })).toHaveText(lastBits.slice(4));
  const offset = digest[19]! & 15;
  const selected = digest.subarray(offset, offset + 4);
  const number = digest.readUInt32BE(offset) & 0x7fffffff;
  const code = String(number % 1000000).padStart(6, "0");
  const masked = Buffer.from(selected);
  masked[0] = masked[0]! & 127;
  await expect(page.getByLabel("Masked bytes", { exact: true })).toHaveText(
    Array.from(masked)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" "),
  );
  await expect(page.getByLabel("Masked bits", { exact: true })).toHaveText(
    Array.from(masked)
      .map((byte) => byte.toString(2).padStart(8, "0"))
      .join(" "),
  );
  for (const [index, byte] of Array.from(masked).entries())
    await expect(
      page.getByLabel(`Byte ${offset + index} contribution`, { exact: true }),
    ).toHaveText(String(byte * 256 ** (3 - index)));

  await expect(page.getByLabel("HMAC result", { exact: true })).toHaveText(digest.toString("hex"));
  await expect(page.getByLabel("Digest used for selection", { exact: true })).toHaveText(
    digest.toString("hex"),
  );
  await expect(page.getByLabel("Selection offset", { exact: true })).toHaveText(String(offset));
  await expect(page.getByLabel("Selected 32 bits", { exact: true })).toHaveText(
    Array.from(selected)
      .map((byte) => byte.toString(2).padStart(8, "0"))
      .join(" "),
  );
  await expect(page.getByLabel("Selected bytes", { exact: true })).toHaveText(
    Array.from(selected)
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join(" "),
  );
  await expect(page.getByLabel("Masked number", { exact: true })).toHaveText(String(number));
  await expect(page.getByLabel("Quotient", { exact: true })).toHaveText(
    String(Math.floor(number / 1000000)),
  );
  await expect(page.getByLabel("Remainder", { exact: true })).toHaveText(String(number % 1000000));
  await expect(page.getByLabel("Six-digit code", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Final six-digit code", { exact: true })).toHaveText(code);
}

async function decodeSetupQr(page: import("@playwright/test").Page) {
  const svg = page.getByRole("img", { name: "QR code for this setup URI", exact: true });
  await expect(svg).toBeVisible();
  const raster = await svg.evaluate(async (element) => {
    const width = Math.round(element.getBoundingClientRect().width);
    const clone = element.cloneNode(true) as SVGElement;
    clone.setAttribute("width", String(width));
    clone.setAttribute("height", String(width));
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`;
    await image.decode();
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = width;
    const context = canvas.getContext("2d")!;
    context.drawImage(image, 0, 0, width, width);
    return { width, pixels: Array.from(context.getImageData(0, 0, width, width).data) };
  });
  return jsQR(new Uint8ClampedArray(raster.pixels), raster.width, raster.width)?.data;
}

test("fresh setup secret and running clock drive every step; refresh stays local", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.addInitScript(() => {
    Date.now = () => 59000;
  });
  await page.goto("/posts/totp/");
  const key = page.getByLabel("Authenticator secret (Base32)", { exact: true });
  await expect(key).toHaveText(/^[A-Z2-7]{32}$/);
  await expect(page.getByRole("switch", { name: "Use running clock", exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Counter C", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Time window counter", { exact: true })).toHaveText("1");
  await expectSharedCalculation(page, 1n);
  const initial = (await key.textContent())!;
  expect(initial).not.toBe(referenceSecret);
  const uriOutput = page.getByLabel("Setup URI", { exact: true });
  const firstUri = (await uriOutput.textContent())!;
  const parsed = new URL(firstUri);
  expect(parsed.protocol).toBe("otpauth:");
  expect(parsed.hostname).toBe("totp");
  expect(parsed.searchParams.get("secret")).toBe(initial);
  expect(parsed.searchParams.get("issuer")).toBe("Blog demo");
  expect(parsed.searchParams.get("algorithm")).toBe("SHA1");
  expect(parsed.searchParams.get("digits")).toBe("6");
  expect(parsed.searchParams.get("period")).toBe("30");
  await expect(
    page.getByRole("link", { name: "Open in an authenticator", exact: true }),
  ).toHaveAttribute("href", firstUri);
  expect(await decodeSetupQr(page)).toBe(firstUri);
  const firstPath = await page.locator('[data-part="qr"] path').getAttribute("d");
  await page.waitForLoadState("networkidle");
  const storage = await page.evaluate(() => ({
    local: { ...localStorage },
    session: { ...sessionStorage },
    url: location.href,
  }));
  const requests: string[] = [];
  page.on("request", (request) => requests.push(request.url()));
  await page.getByRole("button", { name: "Generate new secret", exact: true }).click();
  await expect(key).not.toHaveText(initial);
  await expect(key).toHaveText(/^[A-Z2-7]{32}$/);
  await expectSharedCalculation(page, 1n);
  expect(
    await page.evaluate(() => ({
      local: { ...localStorage },
      session: { ...sessionStorage },
      url: location.href,
    })),
  ).toEqual(storage);
  await expect(page.locator('[data-part="qr"] path')).not.toHaveAttribute("d", firstPath!);
  const nextUri = (await uriOutput.textContent())!;
  expect(new URL(nextUri).searchParams.get("secret")).toBe(await key.textContent());
  expect(await decodeSetupQr(page)).toBe(nextUri);
  expect(requests).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  expect(errors).toEqual([]);
});

test("read-only setup visual encodes the original bytes and follows new secrets", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Date.now = () => 59000;
  });
  await page.goto("/posts/totp/");
  const base32 = page.getByLabel("Authenticator secret (Base32)", { exact: true });
  await expect(base32).toHaveText(/^[A-Z2-7]{32}$/);
  await expect(
    page.getByLabel("Secret bytes before Base32", { exact: true }).locator("span"),
  ).toHaveCount(20);
  await expect(
    page
      .getByRole("group", { name: "Secret encoding", exact: true })
      .getByRole("button", { name: "Generate new secret", exact: true }),
  ).toHaveCount(1);
  await expect(
    page.locator('article input, article textarea, article [contenteditable="true"]'),
  ).toHaveCount(0);
  await expect(
    page
      .getByRole("group", { name: "Secret encoding", exact: true })
      .getByText("Encode Base32", { exact: true }),
  ).toBeVisible();
  const initial = await base32.textContent();
  // Consecutive changes must settle on one shared secret throughout the walkthrough.
  const regenerate = page.getByRole("button", { name: "Generate new secret", exact: true });
  await regenerate.click();
  await regenerate.click();
  await expect(base32).not.toHaveText(initial!);
  await expectSharedCalculation(page, 1n);
});

test("continuous clock locates the current value between moving boundaries and rolls every step over", async ({
  page,
}) => {
  await page.goto("/posts/totp/");
  const key = page.getByLabel("Authenticator secret (Base32)", { exact: true });
  await expect(key).toHaveText(/^[A-Z2-7]{32}$/);
  await page.clock.install({ time: new Date(0) });
  await page.clock.pauseAt(new Date(58_500));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  const clock = page.locator('figure[data-interactive="hmac-clock"]');
  await expect(clock.getByRole("switch")).toHaveCount(0);
  await expect(clock.getByLabel("Clock counter bytes", { exact: true })).toHaveCount(0);
  await expectSharedCalculation(page, 1n);
  const active = clock.locator('[data-part="window"][data-current="true"]');
  await expect(active).toHaveAttribute("data-window", "1");
  const before = (await active.boundingBox())!;
  await page.clock.runFor(500);
  await expect(page.getByLabel("Unix time", { exact: true })).toHaveText("59");
  await expect(clock.getByText("59", { exact: true })).toHaveCount(1);
  await expectSharedCalculation(page, 1n);
  expect((await active.boundingBox())!.x).toBeLessThan(before.x);
  await page.clock.runFor(1000);
  await expect(page.getByLabel("Unix time", { exact: true })).toHaveText("60");
  await expect(page.getByLabel("Time window counter", { exact: true })).toHaveText("2");
  await expectSharedCalculation(page, 2n);
  await expect(active).toHaveAttribute("data-window", "2");
  await expect(active.getByText("Active", { exact: true })).toBeVisible();
  await expect(page.locator('[data-part="clock-viewport"]')).toHaveAccessibleName(
    /Current window 2, from 60 up to 90 seconds/,
  );
  await expect(clock.locator('[data-boundary="60"]')).toHaveText("60");
  await expect(clock.locator('[data-boundary="90"]')).toHaveText("90");
  await page.clock.runFor(15000);
  await expect(page.getByLabel("Unix time", { exact: true })).toHaveText("75");
  await expectSharedCalculation(page, 2n);
  const marker = (await clock.locator('[data-part="now"]').boundingBox())!;
  const range = (await active.boundingBox())!;
  expect(marker.x + marker.width / 2).toBeGreaterThan(range.x);
  expect(marker.x + marker.width / 2).toBeLessThan(range.x + range.width);
  // A tab becoming visible catches up to the actual time, even after timer throttling.
  await page.clock.setSystemTime(new Date(90000));
  await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
  await expect(page.getByLabel("Unix time", { exact: true })).toHaveText("90");
  await expect(page.getByLabel("Time window counter", { exact: true })).toHaveText("3");
  await expectSharedCalculation(page, 3n);
});

test("last byte bits explain the jump from offset eleven to offset four", async ({ page }) => {
  await page.addInitScript(() => {
    Date.now = () => 59000;
    const random = crypto.getRandomValues.bind(crypto);
    Object.defineProperty(crypto, "getRandomValues", {
      value: (array: ArrayBufferView<ArrayBuffer>) => {
        if (array instanceof Uint8Array && array.length === 20) {
          array.set(new TextEncoder().encode("12345678901234567890"));
          return array;
        }
        return random(array);
      },
    });
  });
  await page.goto("/posts/totp/");
  const selector = page.locator('figure[data-interactive="hmac-select"]');
  await expect(selector.getByLabel("Selector byte", { exact: true })).toHaveText("ab");
  await expect(selector.locator('[data-part="nibble-hex"]')).toHaveText(["Hex a", "Hex b"]);
  await expect(page.getByLabel("Selected 32 bits", { exact: true })).toHaveText(
    "11000001 00111001 01111110 11101010",
  );
  await expect(selector.locator('[data-part="selected-binary"]')).toHaveCount(0);
  await expect(
    page.locator('figure[data-interactive="hmac-mask"] [data-part="selected-binary"]').first(),
  ).toBeVisible();
  await expect(selector.getByLabel("Upper four bits", { exact: true })).toHaveText("1010");
  await expect(selector.getByLabel("Lower four bits", { exact: true })).toHaveText("1011");
  await expect(selector.getByLabel("Offset calculation", { exact: true })).toHaveText(
    "8 + 0 + 2 + 1 =",
  );
  await expect(selector.getByLabel("Selection offset", { exact: true })).toHaveText("11");
  await expect(selector.locator('[data-source="true"] small')).toHaveText("19");
  await expect(selector.locator('[data-start="true"] small')).toHaveText("11");
  await expect(selector.locator('[data-selected="true"] small')).toHaveText([
    "11",
    "12",
    "13",
    "14",
  ]);
  await expect(selector.getByLabel("Selected bytes", { exact: true })).toHaveText("c1 39 7e ea");
  await page.evaluate(() => {
    Date.now = () => 60000;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(selector.getByLabel("Selector byte", { exact: true })).toHaveText("44");
  await expect(selector.locator('[data-part="nibble-hex"]')).toHaveText(["Hex 4", "Hex 4"]);
  await expect(selector.getByLabel("Lower four bits", { exact: true })).toHaveText("0100");
  await expect(selector.getByLabel("Offset calculation", { exact: true })).toHaveText(
    "0 + 4 + 0 + 0 =",
  );
  await expect(selector.getByLabel("Selection offset", { exact: true })).toHaveText("4");
  await expect(selector.locator('[data-selected="true"] small')).toHaveText(["4", "5", "6", "7"]);
  await expect(selector.getByLabel("Selected bytes", { exact: true })).toHaveText("08 2f ef 30");
  await expectSharedCalculation(page, 2n);
  await page.evaluate(() => {
    Date.now = () => 900000;
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await expect(page.getByLabel("Final six-digit code", { exact: true })).toHaveText("026920");
  await expect(page.locator('[data-part="final-digits"] > span')).toHaveCount(6);
  await expect(page.locator('[data-part="final-digits"] > [data-padding="true"]')).toHaveText([
    "0",
  ]);
  await expectSharedCalculation(page, 30n);
});

test("HMAC figure retains the static example when Web Crypto is unavailable", async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis.crypto, "subtle", { value: undefined, configurable: true });
  });
  await page.goto("/posts/totp/");
  await expect(page.locator('figure[data-interactive^="hmac"] img')).toHaveCount(8);
  expect(
    await page
      .locator('figure[data-interactive="hmac"]')
      .evaluate((element) => getComputedStyle(element).display),
  ).toBe("flex");
  for (const image of await page.locator('figure[data-interactive^="hmac"] img').all()) {
    expect(
      await image.evaluate(
        (element: HTMLImageElement) => element.complete && element.naturalWidth > 0,
      ),
    ).toBe(true);
  }
  const fallback = page.locator('figure[data-interactive="hmac"] img');
  await fallback.scrollIntoViewIfNeeded();
  expect(
    await fallback.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  await expect(page.getByLabel("Authenticator secret (Base32)", { exact: true })).toHaveCount(0);
});

test("HMAC explorer reports a calculation failure without showing a stale result", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Date.now = () => 59000;
  });
  await page.goto("/posts/totp/");
  const explorer = page.locator('figure[data-interactive="hmac"]');
  await expect(explorer.getByLabel("HMAC result", { exact: true })).toHaveText(/^[a-f0-9]{40}$/);
  await page.evaluate(() => {
    Object.defineProperty(crypto.subtle, "sign", {
      configurable: true,
      value: () => Promise.reject(new Error("Unavailable")),
    });
  });
  await page.getByRole("button", { name: "Generate new secret", exact: true }).click();
  await expect(explorer.getByRole("alert")).toHaveText(
    "Could not calculate the result. Generate a new secret to try again.",
  );
  await expect(explorer.getByLabel("HMAC result", { exact: true })).toBeEmpty();
  await expect(explorer.getByLabel("Six-digit code", { exact: true })).toHaveCount(0);
  await expect(page.getByLabel("Final six-digit code", { exact: true })).toHaveCount(0);
});

test("failed random generation preserves the current secret and can be retried", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Date.now = () => 59000;
  });
  await page.goto("/posts/totp/");
  const key = page.getByLabel("Authenticator secret (Base32)", { exact: true });
  await expect(key).toHaveText(/^[A-Z2-7]{32}$/);
  const initial = (await key.textContent())!;
  await expectSharedCalculation(page, 1n);
  await page.evaluate(() =>
    Object.defineProperty(crypto, "getRandomValues", {
      configurable: true,
      value: () => {
        throw new Error("Unavailable");
      },
    }),
  );
  await page.getByRole("button", { name: "Generate new secret", exact: true }).click();
  await expect(page.getByRole("alert")).toHaveText(
    "Could not generate a new secret. Try refreshing it again.",
  );
  await expect(key).toHaveText(initial);
  await expectSharedCalculation(page, 1n);
  await page.evaluate(() => Reflect.deleteProperty(crypto, "getRandomValues"));
  await page.getByRole("button", { name: "Generate new secret", exact: true }).click();
  await expect(key).not.toHaveText(initial);
  await expectSharedCalculation(page, 1n);
  await expect(page.getByRole("alert")).toHaveCount(0);
});

test("the full article and all static diagrams remain readable without JavaScript", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("http://127.0.0.1:4188/posts/totp/");
  await expect(page.locator('figure[data-interactive^="hmac"] img')).toHaveCount(8);
  const fallback = page.locator('figure[data-interactive="hmac"] img');
  await fallback.scrollIntoViewIfNeeded();
  expect(
    await fallback.evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0),
  ).toBe(true);
  await expect(page.getByLabel("Authenticator secret (Base32)", { exact: true })).toHaveCount(0);
  await context.close();
});
