import { DEMO } from "./parameters";

const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export const EXAMPLE_SECRET = "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

export function encodeBase32(bytes: Uint8Array | readonly number[]) {
  let buffer = 0;
  let bits = 0;
  let text = "";
  for (const byte of bytes) {
    buffer = (buffer << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      bits -= 5;
      text += alphabet[(buffer >>> bits) & 31];
    }
    buffer &= (1 << bits) - 1;
  }
  if (bits) text += alphabet[(buffer << (5 - bits)) & 31];
  return text;
}

export function decodeBase32(input: string) {
  const text = input.replace(/\s/g, "").toUpperCase();
  if (!text) return new Uint8Array();
  const invalid = () => new Error("Enter a Base32 secret using A–Z and 2–7. Spaces are allowed.");
  if (!/^[A-Z2-7]+={0,6}$/.test(text)) throw invalid();
  const raw = text.replace(/=+$/, "");
  if (![0, 2, 4, 5, 7].includes(raw.length % 8)) throw invalid();
  if (
    text.length !== raw.length &&
    (text.length % 8 !== 0 || text.length - raw.length !== (8 - (raw.length % 8)) % 8)
  )
    throw invalid();
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;
  for (const character of raw) {
    buffer = (buffer << 5) | alphabet.indexOf(character);
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >>> bits) & 255);
    }
    buffer &= (1 << bits) - 1;
  }
  if (buffer !== 0) throw invalid();
  return new Uint8Array(bytes);
}

export function generateTotpSecret() {
  return secretMaterial(crypto.getRandomValues(new Uint8Array(DEMO.secretBytes)));
}

export function secretMaterial(input: Uint8Array) {
  const bytes = Object.freeze(Array.from(input));
  return Object.freeze({ bytes, base32: encodeBase32(bytes) });
}
export type SecretMaterial = ReturnType<typeof secretMaterial>;
export const REFERENCE_SECRET = secretMaterial(decodeBase32(EXAMPLE_SECRET));
