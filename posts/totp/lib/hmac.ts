import { DEMO, MAX_COUNTER, MODULUS } from "./parameters";

export { MAX_COUNTER } from "./parameters";
export const EXAMPLE_KEY = "12345678901234567890";
export const EXAMPLE_DIGEST = "75a48a19d4cbe100644e8ac1397eea747a2d33ab";

export function toHex(bytes: readonly number[]) {
  return bytes.map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

export function encodeCounter(value: bigint) {
  if (value < 0n || value > MAX_COUNTER)
    throw new Error("Counter is outside the eight-byte range.");
  const message = new Uint8Array(8);
  new DataView(message.buffer).setBigUint64(0, value, false);
  return message;
}

export async function calculateHmac(keyInput: Uint8Array | readonly number[], counter: bigint) {
  if (!keyInput.length) throw new Error("Enter a key.");

  const keyBytes = new Uint8Array(keyInput);
  const message = encodeCounter(counter);
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: DEMO.hash },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, message);
  const bytes = Array.from(new Uint8Array(signature));
  const offset = bytes[19]! & 0x0f;
  const selected = bytes.slice(offset, offset + 4);
  const masked = [selected[0]! & 0x7f, ...selected.slice(1)];
  const number =
    (bytes[offset]! & 0x7f) * 2 ** 24 +
    bytes[offset + 1]! * 2 ** 16 +
    bytes[offset + 2]! * 2 ** 8 +
    bytes[offset + 3]!;
  return {
    bytes,
    message: Array.from(message),
    keyByteLength: keyBytes.length,
    offset,
    selected,
    masked,
    number,
    quotient: Math.floor(number / MODULUS),
    code: String(number % MODULUS).padStart(DEMO.digits, "0"),
  };
}

export type HmacResult = Awaited<ReturnType<typeof calculateHmac>>;
