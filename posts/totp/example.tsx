import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import { calculateHmac } from "./lib/hmac";
import type { HmacResult } from "./lib/hmac";
import { generateTotpSecret, REFERENCE_SECRET } from "./lib/secret";
import type { SecretMaterial } from "./lib/secret";
import { createClock } from "./lib/clock";
import type { ArticleClock } from "./lib/clock";

type Session =
  | { status: "static"; secret: SecretMaterial; error?: string }
  | { status: "live"; secret: SecretMaterial; error?: string };
type Snapshot = { secret: SecretMaterial; counter: bigint };
type Completed = Snapshot &
  ({ status: "ready"; result: HmacResult } | { status: "error"; error: string });
export type Calculation = { status: "static" } | (Snapshot & { status: "pending" }) | Completed;

const SecretContext = createContext<(Session & { regenerate: () => void }) | null>(null);
const CalculationContext = createContext<Calculation | null>(null);
const ClockContext = createContext<ArticleClock | null>(null);
function required<T>(value: T | null): T {
  if (!value) throw new Error("HMAC figures need an article-scoped example provider.");
  return value;
}
export function useSecret() {
  return required(useContext(SecretContext));
}
export function useCalculation() {
  return required(useContext(CalculationContext));
}
export function useUnixTime() {
  const clock = required(useContext(ClockContext));
  return useSyncExternalStore(clock.subscribe, clock.seconds, clock.serverSeconds);
}
const noSubscribe = () => () => {};

function Calculations({ children }: { children: ReactNode }) {
  const session = useSecret();
  const clock = required(useContext(ClockContext));
  const live = session.status === "live";
  const counter = useSyncExternalStore(
    live ? clock.subscribe : noSubscribe,
    live ? clock.counter : clock.serverCounter,
    clock.serverCounter,
  );
  const secret = session.secret;
  const [completed, setCompleted] = useState<Completed>();
  useEffect(() => {
    if (!live) return;
    let ignore = false;
    calculateHmac(secret.bytes, counter).then(
      (result) => {
        if (!ignore) setCompleted({ status: "ready", secret, counter, result });
      },
      () => {
        if (!ignore)
          setCompleted({
            status: "error",
            secret,
            counter,
            error: "Could not calculate the result. Generate a new secret to try again.",
          });
      },
    );
    return () => {
      ignore = true;
    };
  }, [live, secret, counter]);
  const value = useMemo<Calculation>(() => {
    if (!live) return { status: "static" };
    if (completed?.secret === secret && completed.counter === counter) return completed;
    return { status: "pending", secret, counter };
  }, [live, secret, counter, completed]);
  return <CalculationContext.Provider value={value}>{children}</CalculationContext.Provider>;
}

export function HmacExampleProvider({ children }: { children: ReactNode }) {
  const [clock] = useState(createClock);
  const [session, setSession] = useState<Session>({ status: "static", secret: REFERENCE_SECRET });
  const regenerate = useCallback(() => {
    try {
      const secret = generateTotpSecret();
      setSession({ status: "live", secret });
    } catch {
      setSession((current) => ({
        ...current,
        error: "Could not generate a new secret. Try refreshing it again.",
      }));
    }
  }, []);
  useEffect(() => {
    if (!globalThis.crypto?.subtle) return;
    // oxlint-disable-next-line react/set-state-in-effect -- Activate browser-only randomness after hydrating the static reference figures.
    regenerate();
  }, [regenerate]);
  const value = useMemo(() => ({ ...session, regenerate }), [session, regenerate]);
  return (
    <ClockContext.Provider value={clock}>
      <SecretContext.Provider value={value}>
        <Calculations>{children}</Calculations>
      </SecretContext.Provider>
    </ClockContext.Provider>
  );
}
