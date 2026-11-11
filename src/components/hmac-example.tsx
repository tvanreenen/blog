import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { calculateHmac, parseCounter } from "../lib/hmac";
import type { HmacResult } from "../lib/hmac";
import { decodeBase32, EXAMPLE_SECRET, generateTotpSecret } from "../lib/totp-secret";

type Calculation = { secret: string; counter: string; result?: HmacResult; error?: string };
type HmacExample = {
  enabled: boolean;
  secret: string;
  regenerate: () => void;
  secretBytes: Uint8Array;
  generationError: string | undefined;
  counter: string;
  unixTime: number;
  parsedCounter: ReturnType<typeof parseCounter>;
  result: HmacResult | undefined;
  pending: boolean;
  error: string | undefined;
};

export const HmacExampleContext = createContext<HmacExample | null>(null);

export function useHmacExample() {
  const example = useContext(HmacExampleContext);
  if (!example) throw new Error("HMAC figures need an article-scoped example provider.");
  return example;
}

export function HmacExampleProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [secret, setSecret] = useState(EXAMPLE_SECRET);
  const [unixTime, setUnixTime] = useState(59);
  const [generationError, setGenerationError] = useState<string>();
  const [calculation, setCalculation] = useState<Calculation>();
  const counter = String(BigInt(unixTime) / 30n);
  const parsedCounter = parseCounter(counter);
  const secretBytes = useMemo(() => decodeBase32(secret), [secret]);
  const current =
    calculation?.secret === secret && calculation.counter === counter ? calculation : null;

  useEffect(() => {
    if (!globalThis.crypto?.subtle) return;
    try {
      // oxlint-disable-next-line react/set-state-in-effect -- Hydrate the static RFC example before activating browser-only randomness and time.
      setSecret(generateTotpSecret());
      setUnixTime(Math.floor(Date.now() / 1000));
      setEnabled(true);
    } catch {
      // Keep the published, static example when browser crypto is unavailable.
    }
  }, []);
  useEffect(() => {
    if (!enabled) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const tick = () => {
      if (timer !== undefined) clearTimeout(timer);
      const now = Date.now();
      setUnixTime(Math.floor(now / 1000));
      timer = setTimeout(tick, 1000 - (now % 1000));
    };
    tick();
    document.addEventListener("visibilitychange", tick);
    return () => {
      if (timer !== undefined) clearTimeout(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [enabled]);
  useEffect(() => {
    if (!enabled) return;
    let ignore = false;
    calculateHmac(secretBytes, counter).then(
      (result) => {
        if (!ignore) setCalculation({ secret, counter, result });
      },
      () => {
        if (!ignore)
          setCalculation({
            secret,
            counter,
            error: "Could not calculate the result. Generate a new secret to try again.",
          });
      },
    );
    return () => {
      ignore = true;
    };
  }, [enabled, secretBytes, secret, counter]);

  return (
    <HmacExampleContext.Provider
      value={{
        enabled,
        secret,
        regenerate: () => {
          try {
            setSecret(generateTotpSecret());
            setGenerationError(undefined);
          } catch {
            setGenerationError("Could not generate a new secret. Try refreshing it again.");
          }
        },
        secretBytes,
        generationError,
        counter,
        parsedCounter,
        unixTime,
        result: current?.result,
        pending: Boolean(enabled && !current),
        error: current?.error,
      }}
    >
      {children}
    </HmacExampleContext.Provider>
  );
}
