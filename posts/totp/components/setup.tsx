import styles from "../styles.module.css";
import { useEffect, useState } from "react";
import { useHmacExample } from "../example";
import { DEMO_ACCOUNT, DEMO_ISSUER, DEMO_LABEL, totpQr, totpSetupUri } from "../lib/setup";
import { encodeBase32 } from "../lib/secret";

type Qr = { uri: string; size?: number; path?: string; failed?: boolean };

function SetupQr({ uri }: { uri: string }) {
  const [qr, setQr] = useState<Qr>();
  useEffect(() => {
    let ignore = false;
    totpQr(uri).then(
      (result) => {
        if (!ignore) setQr({ uri, ...result });
      },
      () => {
        if (!ignore) setQr({ uri, failed: true });
      },
    );
    return () => {
      ignore = true;
    };
  }, [uri]);
  const current = qr?.uri === uri ? qr : undefined;
  return (
    <div className={styles["hmac-qr"]} data-part="qr">
      {current?.path ? (
        /* oxlint-disable jsx-a11y/prefer-tag-over-role -- The generated QR remains inline SVG with an accessible image role. */
        <svg
          role="img"
          aria-label="QR code for this setup URI"
          viewBox={`0 0 ${current.size} ${current.size}`}
          shapeRendering="crispEdges"
        >
          <rect width="100%" height="100%" fill="#fff" />
          <path d={current.path} fill="#000" />
        </svg>
      ) : (
        /* oxlint-enable jsx-a11y/prefer-tag-over-role */
        <output className={styles["hmac-caption"]}>
          {current?.failed
            ? "QR unavailable. Use the setup link or enter the secret manually."
            : "Generating QR code…"}
        </output>
      )}
      <a href={uri}>Open in an authenticator</a>
    </div>
  );
}

export function HmacSetup() {
  const { secretBytes } = useHmacExample();
  const secret = encodeBase32(secretBytes);
  const uri = totpSetupUri(secretBytes);
  return (
    <>
      <figcaption className={styles["hmac-output-label"]}>
        One setup URI, packaged as text or a QR code
      </figcaption>
      <div className={styles["hmac-setup-layout"]}>
        <div className={styles["hmac-uri-detail"]}>
          <output className={styles["hmac-uri"]} aria-label="Setup URI" aria-live="off">
            <span>otpauth://totp/</span>
            <span>{DEMO_LABEL}</span>
            <span>
              ?secret=<strong>{secret}</strong>
            </span>
            <span>&amp;issuer={encodeURIComponent(DEMO_ISSUER)}</span>
            <span>&amp;algorithm=SHA1</span>
            <span>&amp;digits=6</span>
            <span>&amp;period=30</span>
          </output>
          <dl className={styles["hmac-uri-key"]}>
            <div>
              <dt>Label</dt>
              <dd>
                {DEMO_ISSUER} · {DEMO_ACCOUNT}
              </dd>
            </div>
            <div>
              <dt>secret</dt>
              <dd>The same secret, in Base32</dd>
            </div>
            <div>
              <dt>Settings</dt>
              <dd>SHA-1 · 6 digits · 30 seconds</dd>
            </div>
          </dl>
        </div>
        <SetupQr uri={uri} />
      </div>
      <p className={styles["hmac-caption"]}>
        Scan this with an authenticator to follow along: its code should match the live result
        below. Generating a new secret means scanning its new QR code.
      </p>
    </>
  );
}
