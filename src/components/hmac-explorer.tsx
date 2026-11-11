import { ArrowDown, RefreshCw } from "lucide-react";
import { FieldError } from "./ui/field";
import { Button } from "./ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from "./ui/card";
import { useHmacExample } from "./hmac-example";
import { HmacBytes } from "./hmac-bytes";
import { encodeCounter, toHex } from "../lib/hmac";
import { encodeBase32 } from "../lib/totp-secret";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- These cards label read-only data groups, not form fieldsets. */
export function HmacBase32() {
  const { secret, secretBytes, regenerate, generationError } = useHmacExample();
  return (
    <Card
      size="sm"
      accent="var(--hmac-key)"
      className="hmac-input-card hmac-base32-card"
      role="group"
      aria-label="Secret encoding"
    >
      <CardHeader>
        <CardTitle>Bytes → Base32</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" aria-label="Generate new secret" onClick={regenerate}>
            <RefreshCw aria-hidden="true" data-icon="inline-start" />
            New secret
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="hmac-input-content">
        <span className="hmac-output-label">20 bytes · 160 bits · hexadecimal</span>
        <InputBytes bytes={Array.from(secretBytes)} label="Secret bytes before Base32" />
        <div className="hmac-conversion">
          <ArrowDown aria-hidden="true" />
          <span>Encode Base32</span>
        </div>
        <span className="hmac-output-label">32 characters · Base32</span>
        <output
          className="hmac-base32-value"
          aria-label="Authenticator secret (Base32)"
          aria-live="off"
        >
          {secret}
        </output>
        <FieldError>{generationError}</FieldError>
      </CardContent>
      <CardFooter>
        <p className="hmac-local-note">
          Generated in your browser for this demo. It stays in this page and is not sent or saved.
        </p>
      </CardFooter>
    </Card>
  );
}

/* oxlint-enable jsx-a11y/prefer-tag-over-role */

function InputBytes({ bytes, label }: { bytes?: readonly number[]; label: string }) {
  return (
    <output className="hmac-input-bytes" aria-label={label} aria-live="off">
      {bytes ? (
        bytes.map((byte, index) => <span key={index}>{toHex([byte])} </span>)
      ) : (
        <span aria-hidden="true">··</span>
      )}
    </output>
  );
}

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- These cards label read-only data groups, not form fieldsets. */
export function HmacExplorer() {
  const { result, pending, error, secretBytes, counter, parsedCounter } = useHmacExample();
  const message =
    parsedCounter.value === null ? undefined : Array.from(encodeCounter(parsedCounter.value));
  return (
    <>
      <div className="hmac-calculation" aria-busy={pending}>
        <div className="hmac-inputs">
          <Card
            size="sm"
            accent="var(--hmac-key)"
            className="hmac-input-card"
            role="group"
            aria-label="Secret key input"
          >
            <CardHeader>
              <CardTitle>K · secret key</CardTitle>
              <CardDescription size="xs">From setup · stays fixed</CardDescription>
            </CardHeader>
            <CardContent className="hmac-input-content">
              <div className="hmac-input-source">
                <span className="hmac-output-label">Base32 text</span>
                <output className="hmac-input-text" aria-label="HMAC Base32 secret" aria-live="off">
                  {encodeBase32(secretBytes)}
                </output>
              </div>
              <div className="hmac-conversion">
                <ArrowDown aria-hidden="true" />
                <span>Decode Base32</span>
              </div>
              <span className="hmac-output-label">
                {secretBytes.length} key bytes · hexadecimal
              </span>
              <InputBytes bytes={Array.from(secretBytes)} label="HMAC key bytes" />
            </CardContent>
          </Card>
          <Card
            size="sm"
            accent="var(--hmac-message)"
            className="hmac-input-card hmac-counter-input"
            role="group"
            aria-label="Counter message input"
          >
            <CardHeader>
              <CardTitle>C · counter message</CardTitle>
              <CardDescription size="xs">From clock · changes every 30s</CardDescription>
            </CardHeader>
            <CardContent className="hmac-input-content">
              <div className="hmac-input-source">
                <span className="hmac-output-label">floor(t ÷ 30) · decimal</span>
                <output
                  className="hmac-input-number"
                  aria-label="HMAC decimal counter"
                  aria-live="off"
                >
                  {counter}
                </output>
              </div>
              <div className="hmac-conversion">
                <ArrowDown aria-hidden="true" />
                <span>Encode as 8 bytes</span>
              </div>
              <span className="hmac-output-label">Most significant byte first</span>
              <InputBytes bytes={message} label="Counter encoded as bytes" />
            </CardContent>
          </Card>
        </div>
        <ArrowDown className="hmac-arrow" aria-hidden="true" />
        <div className="hmac-function">
          <strong>HMAC-SHA1(K, C)</strong>
        </div>
        <ArrowDown className="hmac-arrow" aria-hidden="true" />
        <div className="hmac-output">
          <div className="hmac-output-label">20-byte result</div>
          <HmacBytes bytes={result?.bytes} label="HMAC result" />
        </div>
        <output className="sr-only">
          {result ? "HMAC result updated." : pending ? "Calculating." : ""}
        </output>
        {error ? <FieldError>{error}</FieldError> : null}
      </div>
    </>
  );
}
/* oxlint-enable jsx-a11y/prefer-tag-over-role */
