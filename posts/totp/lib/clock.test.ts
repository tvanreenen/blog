import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createClock } from "./clock";
import { timeCounter } from "./parameters";

describe("article clock lifecycle", () => {
  let documentEvents: EventTarget & { hidden: boolean };
  let windowEvents: EventTarget;
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(58500);
    documentEvents = Object.assign(new EventTarget(), { hidden: false });
    windowEvents = new EventTarget();
    vi.stubGlobal("document", documentEvents);
    vi.stubGlobal("window", windowEvents);
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("is inert until subscribed and releases timers and listeners after the last subscriber", () => {
    const clock = createClock();
    const first = vi.fn();
    const second = vi.fn();
    expect(vi.getTimerCount()).toBe(0);
    expect(clock.serverSeconds()).toBe(59);
    const unsubscribeFirst = clock.subscribe(first);
    const unsubscribeSecond = clock.subscribe(second);
    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(500);
    expect(clock.seconds()).toBe(59);
    expect(clock.counter()).toBe(1n);
    unsubscribeFirst();
    first.mockClear();
    vi.advanceTimersByTime(1000);
    expect(clock.counter()).toBe(2n);
    expect(first).not.toHaveBeenCalled();
    unsubscribeSecond();
    expect(vi.getTimerCount()).toBe(0);
    second.mockClear();
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    windowEvents.dispatchEvent(new Event("pageshow"));
    vi.advanceTimersByTime(60000);
    expect(second).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("stops in hidden/frozen pages and samples actual time on resume, including backwards corrections", () => {
    const clock = createClock();
    const update = vi.fn();
    const unsubscribe = clock.subscribe(update);
    documentEvents.hidden = true;
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    update.mockClear();
    vi.advanceTimersByTime(90000);
    expect(update).not.toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
    documentEvents.hidden = false;
    documentEvents.dispatchEvent(new Event("visibilitychange"));
    expect(clock.seconds()).toBe(148);
    expect(clock.counter()).toBe(4n);
    expect(vi.getTimerCount()).toBe(1);
    windowEvents.dispatchEvent(new Event("pagehide"));
    expect(vi.getTimerCount()).toBe(0);
    vi.setSystemTime(31000);
    windowEvents.dispatchEvent(new Event("pageshow"));
    expect(clock.seconds()).toBe(31);
    expect(clock.counter()).toBe(1n);
    expect(vi.getTimerCount()).toBe(1);
    unsubscribe();
  });

  it("tolerates an unsubscribe during notification without scheduling orphan work", () => {
    const clock = createClock();
    let unsubscribe = () => {};
    unsubscribe = clock.subscribe(() => {
      if (clock.seconds() === 59) unsubscribe();
    });
    vi.advanceTimersByTime(500);
    expect(vi.getTimerCount()).toBe(0);
  });

  it.each([
    [29, 0n],
    [30, 1n],
    [59, 1n],
    [60, 2n],
    [-1, 0n],
  ])("maps second %s to its exact window", (second, counter) => {
    expect(timeCounter(second)).toBe(counter);
  });
});
