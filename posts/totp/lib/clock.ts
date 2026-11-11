import { DEMO, timeCounter } from "./parameters";

// Each article owns one clock. Construction is SSR-safe; the first subscriber
// starts browser work and the last unsubscribe releases every resource.
export function createClock() {
  const listeners = new Set<() => void>();
  let timer: ReturnType<typeof setTimeout> | undefined;
  let frozen = false;
  const seconds = () => Math.max(0, Math.floor(Date.now() / 1000));
  const clear = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };
  const tick = () => {
    clear();
    if (frozen || document.hidden || !listeners.size) return;
    // oxlint-disable-next-line unicorn/no-useless-spread -- Notify a snapshot: a callback may unsubscribe or add a subscriber.
    for (const listener of [...listeners]) listener();
    if (listeners.size) timer = setTimeout(tick, 1000 - (Date.now() % 1000));
  };
  const hide = () => {
    frozen = true;
    clear();
  };
  const show = () => {
    frozen = false;
    tick();
  };
  return {
    seconds,
    counter: () => timeCounter(seconds()),
    serverSeconds: () => DEMO.referenceTime,
    serverCounter: () => timeCounter(DEMO.referenceTime),
    subscribe(listener: () => void) {
      listeners.add(listener);
      if (listeners.size === 1) {
        frozen = false;
        document.addEventListener("visibilitychange", tick);
        window.addEventListener("pagehide", hide);
        window.addEventListener("pageshow", show);
        tick();
      }
      return () => {
        listeners.delete(listener);
        if (!listeners.size) {
          clear();
          document.removeEventListener("visibilitychange", tick);
          window.removeEventListener("pagehide", hide);
          window.removeEventListener("pageshow", show);
        }
      };
    },
  };
}
export type ArticleClock = ReturnType<typeof createClock>;
