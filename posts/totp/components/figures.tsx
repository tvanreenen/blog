import { DemoError } from "./demo-error";
import type { ReactNode } from "react";
import { useSecret, useCalculation } from "../example";
import { HmacBase32, HmacExplorer } from "./inputs";
import { HmacSetup } from "./setup";
import { HmacClock, HmacSelect, HmacMask, HmacNumber, HmacRemainder } from "./steps";
import styles from "../styles.module.css";

function Figure({
  kind,
  children,
  src,
  alt,
}: {
  kind: string;
  children: ReactNode;
  src: string;
  alt: string;
}) {
  const session = useSecret();
  const calculation = useCalculation();
  const enabled = session.status === "live";
  return (
    <figure
      data-interactive={kind}
      data-not-typeset=""
      className={styles["hmac-explorer"]}
      aria-busy={calculation.status === "pending"}
    >
      {enabled ? children : <img src={src} alt={alt} className={styles.fallback} />}
      {!enabled && session.error && kind === "hmac-base32" && (
        <DemoError title="Secret unavailable" retry={session.regenerate}>
          {session.error}
        </DemoError>
      )}
      {!enabled && kind === "hmac-base32" && (
        <figcaption className={styles["hmac-caption"]}>
          The static figures use the public RFC test secret 12345678901234567890 as ASCII bytes, at
          59 seconds after the Unix epoch, adapted to six digits.
        </figcaption>
      )}
    </figure>
  );
}

export function SecretFigure() {
  return (
    <Figure
      kind="hmac-base32"
      src="/posts/totp/assets/totp-base32.svg"
      alt="Encode the 20 original secret bytes as the 32-character Base32 string GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ. The representation changes, but the secret stays the same."
    >
      <HmacBase32 />
    </Figure>
  );
}

export function SetupFigure() {
  return (
    <Figure
      kind="hmac-setup"
      src="/posts/totp/assets/totp-setup.svg"
      alt="An otpauth URI carries the Base32 secret, a Blog demo account label, and settings for SHA-1, six digits, and a 30-second step. The QR code encodes that same URI."
    >
      <HmacSetup />
    </Figure>
  );
}

export function ClockFigure() {
  return (
    <Figure
      kind="hmac-clock"
      src="/posts/totp/assets/totp-clock.svg"
      alt="The first time window contains seconds 0 through 29; the next contains 30 through 59. Time 59 is in window 1 when counting from zero: 59 divided by 30 is 1.966..., rounded down to 1."
    >
      <HmacClock />
    </Figure>
  );
}

export function HmacFigure() {
  return (
    <Figure
      kind="hmac"
      src="/posts/totp/assets/totp-hmac.svg"
      alt="Two input containers show the before and after: decode the Base32 secret to recover 20 key bytes; encode decimal counter 1 as eight bytes, 00 00 00 00 00 00 00 01. These distinct inputs enter HMAC-SHA1 and produce 20 bytes."
    >
      <HmacExplorer />
    </Figure>
  );
}

export function SelectionFigure() {
  return (
    <Figure
      kind="hmac-select"
      src="/posts/totp/assets/totp-select.svg"
      alt="The last byte ab is binary 1010 1011. Keep the rightmost four bits, 1011. Their place values give 8 + 0 + 2 + 1 = 11. Start at byte position 11 and keep positions 11 through 14: c1 39 7e ea."
    >
      <HmacSelect />
    </Figure>
  );
}

export function MaskFigure() {
  return (
    <Figure
      kind="hmac-mask"
      src="/posts/totp/assets/totp-mask.svg"
      alt="The four selected bytes are shown before and after. Only the first bit changes from one to zero: c1 becomes 41, while 39, 7e, and ea stay the same."
    >
      <HmacMask />
    </Figure>
  );
}

export function NumberFigure() {
  return (
    <Figure
      kind="hmac-number"
      src="/posts/totp/assets/totp-number.svg"
      alt="Hex bytes 41 39 7e ea become decimal values 65, 57, 126, and 234. Multiply by 256 cubed, 256 squared, 256, and 1, then add the four contributions to get 1094287082."
    >
      <HmacNumber />
    </Figure>
  );
}

export function RemainderFigure() {
  return (
    <Figure
      kind="hmac-remainder"
      src="/posts/totp/assets/totp-remainder.svg"
      alt="Split 1094287082 into 1094 whole millions and remainder 287082. Discard the whole millions and keep the six highlighted digits as the code."
    >
      <HmacRemainder />
    </Figure>
  );
}
