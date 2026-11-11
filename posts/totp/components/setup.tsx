import styles from "../styles.module.css";
import { useEffect, useState } from "react";
import { useSecret } from "../example";
import { DEMO_ACCOUNT, DEMO_ISSUER, DEMO_LABEL, totpQr, totpSetupUri } from "../lib/setup";
import { DEMO } from "../lib/parameters";
import { DemoError } from "./demo-error";

type Qr = { uri: string; attempt: number } & (
  | { status: "ready"; size: number; path: string }
  | { status: "error" }
);

function SetupQr({ uri }: { uri: string }) {
  const [qr, setQr] = useState<Qr>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let ignore = false;
    totpQr(uri).then(
      (result) => {
        if (!ignore) setQr({ status: "ready", uri, attempt, ...result });
      },
      () => {
        if (!ignore) setQr({ status: "error", uri, attempt });
      },
    );
    return () => {
      ignore = true;
    };
  }, [uri, attempt]);
  const current = qr?.uri === uri && qr.attempt === attempt ? qr : { status: "pending" as const };
  return (
    <div className={styles["hmac-qr"]} data-part="qr">
      {current.status === "ready" ? (
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
      ) : /* oxlint-enable jsx-a11y/prefer-tag-over-role */
      current.status === "error" ? (
        <DemoError title="QR unavailable" retry={() => setAttempt((value) => value + 1)}>
          Use the setup link or enter the secret manually, or retry the QR code.
        </DemoError>
      ) : (
        <output className={styles["hmac-caption"]}>Generating QR code…</output>
      )}
      <a href={uri}>Open in an authenticator</a>
    </div>
  );
}

export function HmacSetup() {
  const { secret: material } = useSecret();
  const secret = material.base32;
  const uri = totpSetupUri(material.bytes);
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
            <span>&amp;algorithm={DEMO.uriAlgorithm}</span>
            <span>&amp;digits={DEMO.digits}</span>
            <span>&amp;period={DEMO.period}</span>
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
