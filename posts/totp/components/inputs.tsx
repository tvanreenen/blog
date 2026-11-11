import { cn } from "@/lib/utils";
import styles from "../styles.module.css";
import { ArrowDown, RefreshCw } from "lucide-react";
import { DemoError } from "./demo-error";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardAction,
  CardFooter,
} from "@/components/ui/card";
import { useSecret, useCalculation } from "../example";
import { HmacBytes } from "./bytes";
import { encodeCounter, toHex } from "../lib/hmac";

/* oxlint-disable jsx-a11y/prefer-tag-over-role -- These cards label read-only data groups, not form fieldsets. */
export function HmacBase32() {
  const { secret, regenerate, error } = useSecret();
  const secretBytes = secret.bytes;
  return (
    <Card
      size="sm"
      accent="var(--hmac-key)"
      className={cn(styles["hmac-input-card"], styles["hmac-base32-card"])}
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
      <CardContent className={styles["hmac-input-content"]}>
        <span className={styles["hmac-output-label"]}>20 bytes · 160 bits · hexadecimal</span>
        <InputBytes bytes={secretBytes} label="Secret bytes before Base32" />
        <div className={styles["hmac-conversion"]}>
          <ArrowDown aria-hidden="true" />
          <span>Encode Base32</span>
        </div>
        <span className={styles["hmac-output-label"]}>32 characters · Base32</span>
        <output
          className={styles["hmac-base32-value"]}
          aria-label="Authenticator secret (Base32)"
          aria-live="off"
        >
          {secret.base32}
        </output>
        {error && <DemoError title="Secret unavailable">{error}</DemoError>}
      </CardContent>
      <CardFooter>
        <p className={styles["hmac-local-note"]}>
          Generated in your browser for this demo. It stays in this page and is not sent or saved.
        </p>
      </CardFooter>
    </Card>
  );
}

/* oxlint-enable jsx-a11y/prefer-tag-over-role */

function InputBytes({ bytes, label }: { bytes?: readonly number[]; label: string }) {
  return (
    <output className={styles["hmac-input-bytes"]} aria-label={label} aria-live="off">
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
  const calculation = useCalculation();
  const { secret, regenerate } = useSecret();
  if (calculation.status === "static") return null;
  const { counter } = calculation;
  const secretBytes = secret.bytes;
  const result = calculation.status === "ready" ? calculation.result : undefined;
  const pending = calculation.status === "pending";
  const message = Array.from(encodeCounter(counter));
  return (
    <>
      <div className={styles["hmac-calculation"]} aria-busy={pending}>
        <div className={styles["hmac-inputs"]}>
          <Card
            size="sm"
            accent="var(--hmac-key)"
            className={styles["hmac-input-card"]}
            role="group"
            aria-label="Secret key input"
          >
            <CardHeader>
              <CardTitle>K · secret key</CardTitle>
              <CardDescription size="xs">From setup · stays fixed</CardDescription>
            </CardHeader>
            <CardContent className={styles["hmac-input-content"]}>
              <div className={styles["hmac-input-source"]}>
                <span className={styles["hmac-output-label"]}>Base32 text</span>
                <output
                  className={styles["hmac-input-text"]}
                  aria-label="HMAC Base32 secret"
                  aria-live="off"
                >
                  {secret.base32}
                </output>
              </div>
              <div className={styles["hmac-conversion"]}>
                <ArrowDown aria-hidden="true" />
                <span>Decode Base32</span>
              </div>
              <span className={styles["hmac-output-label"]}>
                {secretBytes.length} key bytes · hexadecimal
              </span>
              <InputBytes bytes={secretBytes} label="HMAC key bytes" />
            </CardContent>
          </Card>
          <Card
            size="sm"
            accent="var(--hmac-message)"
            className={cn(styles["hmac-input-card"], styles["hmac-counter-input"])}
            role="group"
            aria-label="Counter message input"
          >
            <CardHeader>
              <CardTitle>C · counter message</CardTitle>
              <CardDescription size="xs">From clock · changes every 30s</CardDescription>
            </CardHeader>
            <CardContent className={styles["hmac-input-content"]}>
              <div className={styles["hmac-input-source"]}>
                <span className={styles["hmac-output-label"]}>floor(t ÷ 30) · decimal</span>
                <output
                  className={styles["hmac-input-number"]}
                  aria-label="HMAC decimal counter"
                  aria-live="off"
                >
                  {String(counter)}
                </output>
              </div>
              <div className={styles["hmac-conversion"]}>
                <ArrowDown aria-hidden="true" />
                <span>Encode as 8 bytes</span>
              </div>
              <span className={styles["hmac-output-label"]}>Most significant byte first</span>
              <InputBytes bytes={message} label="Counter encoded as bytes" />
            </CardContent>
          </Card>
        </div>
        <ArrowDown className={styles["hmac-arrow"]} aria-hidden="true" />
        <div className={styles["hmac-function"]}>
          <strong>HMAC-SHA1(K, C)</strong>
        </div>
        <ArrowDown className={styles["hmac-arrow"]} aria-hidden="true" />
        <div>
          <div className={styles["hmac-output-label"]}>20-byte result</div>
          <HmacBytes bytes={result?.bytes} label="HMAC result" />
        </div>
        <output className="sr-only">
          {result ? "HMAC result updated." : pending ? "Calculating." : ""}
        </output>
        {calculation.status === "error" && (
          <DemoError
            title="Calculation unavailable"
            retry={regenerate}
            action="Generate new secret"
          >
            {calculation.error}
          </DemoError>
        )}
      </div>
    </>
  );
}
/* oxlint-enable jsx-a11y/prefer-tag-over-role */
