import { useEffect, useState } from "react";
import { useHmacExample } from "./hmac-example";
import { DEMO_ACCOUNT, DEMO_ISSUER, DEMO_LABEL, totpQr, totpSetupUri } from "../lib/totp-setup";
import { encodeBase32 } from "../lib/totp-secret";

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
    <div className="hmac-qr">
      {current?.path ? (
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
        <p className="hmac-caption" role="status">
          {current?.failed
            ? "QR unavailable. Use the setup link or enter the secret manually."
            : "Generating QR code…"}
        </p>
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
      <figcaption className="hmac-output-label">
        One setup URI, packaged as text or a QR code
      </figcaption>
      <div className="hmac-setup-layout">
        <div className="hmac-uri-detail">
          <output className="hmac-uri" aria-label="Setup URI" aria-live="off">
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
          <dl className="hmac-uri-key">
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
      <p className="hmac-caption">
        Scan this with an authenticator to follow along: its code should match the live result
        below. Generating a new secret means scanning its new QR code.
      </p>
    </>
  );
}
