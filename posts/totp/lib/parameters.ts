// Fixed parameters for this article, not a configurable authenticator implementation.
export const DEMO = Object.freeze({
  secretBytes: 20,
  period: 30,
  digits: 6,
  hash: "SHA-1",
  uriAlgorithm: "SHA1",
  referenceTime: 59,
});
export const MODULUS = 10 ** DEMO.digits;
export const MAX_COUNTER = (1n << 64n) - 1n;

export function timeCounter(unixTime: number) {
  // A clock correction before the Unix epoch stays at the first valid window.
  return BigInt(Math.max(0, Math.floor(unixTime))) / BigInt(DEMO.period);
}
