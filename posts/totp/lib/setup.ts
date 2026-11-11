import { DEMO } from "./parameters";
import { encodeBase32 } from "./secret";

export const DEMO_ISSUER = "Blog demo";
export const DEMO_ACCOUNT = "reader";
export const DEMO_LABEL = `${encodeURIComponent(DEMO_ISSUER)}:${DEMO_ACCOUNT}`;

export function totpSetupUri(bytes: Uint8Array | readonly number[]) {
  return `otpauth://totp/${DEMO_LABEL}?secret=${encodeBase32(bytes)}&issuer=${encodeURIComponent(DEMO_ISSUER)}&algorithm=${DEMO.uriAlgorithm}&digits=${DEMO.digits}&period=${DEMO.period}`;
}

// Load the encoder only when the enhanced setup figure is mounted.
export async function totpQr(uri: string) {
  const { default: QRCode } = await import("qrcode");
  const { modules } = QRCode.create(uri, { errorCorrectionLevel: "M" });
  let path = "";
  for (let row = 0; row < modules.size; row++) {
    for (let column = 0; column < modules.size; column++) {
      if (modules.get(row, column)) path += `M${column + 4} ${row + 4}h1v1h-1z`;
    }
  }
  return { size: modules.size + 8, path };
}
