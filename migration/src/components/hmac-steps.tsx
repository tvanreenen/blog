import { ArrowDown } from "lucide-react";
import { useHmacExample } from "./hmac-example";
import { HmacBytes } from "./hmac-bytes";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { MAX_COUNTER, toHex } from "../lib/hmac";

const spaced = (bytes: number[]) => bytes.map((byte) => toHex([byte])).join(" ");

function Unavailable() {
  const { pending, error } = useHmacExample();
  return (
    <p className="hmac-caption">
      {pending
        ? "Calculating this step…"
        : error
          ? "The calculation is unavailable. Generate a new secret to try again."
          : "Waiting for the current calculation."}
    </p>
  );
}

export function HmacClock() {
  const { parsedCounter, unixTime } = useHmacExample();
  const counter = parsedCounter.value;
  if (counter === null) return <Unavailable />;
  const time = BigInt(unixTime);
  const elapsed = Number(time % 30n);
  const windows = [-2n, -1n, 0n, 1n, 2n]
    .map((offset) => counter + offset)
    .filter((value) => value >= 0n && value <= MAX_COUNTER);
  return (
    <>
      <div
        className="hmac-clock-viewport"
        role="group"
        aria-label={`Time windows slide beneath a fixed now marker. Current window ${counter}, from ${counter * 30n} up to ${counter * 30n + 30n} seconds, excluding the upper boundary.`}
      >
        <div className="hmac-window-strip" aria-hidden="true">
          {windows.map((value) => (
            <div
              key={String(value)}
              className="hmac-window"
              data-window={String(value)}
              data-current={value === counter}
              style={{
                transform: `translateX(${(Number(value - counter) - elapsed / 30) * 100}%)`,
              }}
            >
              <div className="hmac-window-card">
                <span>{value === counter ? "Active" : "Window"}</span>
                <strong>{String(value)}</strong>
              </div>
              <span className="hmac-boundary" data-boundary={String(value * 30n)}>
                <code>{String(value * 30n)}</code>
              </span>
            </div>
          ))}
        </div>
        <div className="hmac-now">
          <output aria-label="Unix time" aria-live="off">
            {String(time)}
          </output>
          <span>Now · t</span>
        </div>
      </div>
      <p className="hmac-caption hmac-clock-caption">
        Next window in {30 - elapsed} {30 - elapsed === 1 ? "second" : "seconds"}.
      </p>
      <div className="hmac-equation">
        <code>floor(t ÷ 30)</code>
        <span>=</span>
        <output aria-label="Time window counter" aria-live="off">
          {String(counter)}
        </output>
      </div>
    </>
  );
}

export function HmacSelect() {
  const { result } = useHmacExample();
  if (!result) return <Unavailable />;
  const last = result.bytes[19]!;
  const hex = toHex([last]);
  const binary = last.toString(2).padStart(8, "0");
  const lower = binary.slice(4);
  const weights = [8, 4, 2, 1];
  const contributions = weights.map((weight, index) => (lower[index] === "1" ? weight : 0));
  return (
    <>
      <figcaption className="hmac-output-label">20-byte HMAC result · positions 0–19</figcaption>
      <HmacBytes
        bytes={result.bytes}
        offset={result.offset}
        sourceIndex={19}
        label="Digest used for selection"
      />
      <output className="sr-only" aria-label="Selected bytes" aria-live="off">
        {spaced(result.selected)}
      </output>
      <Card size="sm" className="hmac-selector-detail">
        <CardHeader>
          <CardTitle>Find the starting position</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="hmac-selection-steps" role="list">
            <li>
              <div className="hmac-selection-step">
                <span className="hmac-step-title">Read the last byte · position 19</span>
                <output className="sr-only" aria-label="Selector byte" aria-live="off">
                  {hex}
                </output>
                <p className="hmac-caption">
                  Each hex digit represents four bits. Keep the four bits on the right.
                </p>
                <div className="hmac-nibbles">
                  <div className="hmac-nibble">
                    <output
                      className="hmac-nibble-hex"
                      aria-label="Upper hex digit"
                      aria-live="off"
                    >
                      Hex <strong>{hex[0]}</strong>
                    </output>
                    <ArrowDown className="hmac-nibble-arrow" aria-hidden="true" />
                    <span className="hmac-output-label">Left 4 · ignore</span>
                    <output
                      className="hmac-nibble-bits"
                      aria-label="Upper four bits"
                      aria-live="off"
                    >
                      {binary
                        .slice(0, 4)
                        .split("")
                        .map((bit, index) => (
                          <span key={index}>{bit}</span>
                        ))}
                    </output>
                  </div>
                  <div className="hmac-nibble" data-kept="true">
                    <output
                      className="hmac-nibble-hex"
                      aria-label="Lower hex digit"
                      aria-live="off"
                    >
                      Hex <strong>{hex[1]}</strong>
                    </output>
                    <ArrowDown className="hmac-nibble-arrow" aria-hidden="true" />
                    <span className="hmac-output-label">Right 4 · keep</span>
                    <output
                      className="hmac-nibble-bits"
                      aria-label="Lower four bits"
                      aria-live="off"
                    >
                      {lower.split("").map((bit, index) => (
                        <span key={index} data-on={bit === "1"}>
                          {bit}
                        </span>
                      ))}
                    </output>
                    <div className="hmac-bit-weights" aria-hidden="true">
                      {weights.map((weight) => (
                        <span key={weight}>×{weight}</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="hmac-caption">
                  The four places are worth 8, 4, 2, and 1. Add a weight when its bit is 1.
                </p>
                <div className="hmac-equation hmac-offset-sum">
                  <code aria-label="Offset calculation">{contributions.join(" + ")} =</code>
                  <output aria-label="Selection offset" aria-live="off">
                    {result.offset}
                  </output>
                </div>
              </div>
            </li>
            <li>
              <div className="hmac-selection-step">
                <span className="hmac-step-title">Start at byte position {result.offset}</span>
                <p className="hmac-caption">
                  Count from zero. Keep that byte and the next three: positions {result.offset}–
                  {result.offset + 3}. Those are the four blue bytes highlighted above.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>
    </>
  );
}

function MaskByteBits({ bytes, offset }: { bytes: readonly number[]; offset: number }) {
  return (
    <div className="hmac-selected-binary" aria-hidden="true">
      {bytes.map((byte, byteIndex) => (
        <div
          key={byteIndex}
          className="hmac-byte"
          data-selected="true"
          data-start={byteIndex === 0}
        >
          <small>{offset + byteIndex}</small>
          <span>{toHex([byte])}</span>
          <code>
            {byte
              .toString(2)
              .padStart(8, "0")
              .split("")
              .map((bit, bitIndex) => (
                <span key={bitIndex} data-sign-bit={byteIndex === 0 && bitIndex === 0}>
                  {bit}
                </span>
              ))}
          </code>
        </div>
      ))}
    </div>
  );
}

export function HmacMask() {
  const { result } = useHmacExample();
  if (!result) return <Unavailable />;
  const changed = result.selected[0] !== result.masked[0];
  return (
    <Card size="sm" className="hmac-math-card">
      <CardHeader>
        <CardTitle>Clear the first bit</CardTitle>
        <CardDescription>32 bits → 31 usable bits</CardDescription>
      </CardHeader>
      <CardContent className="hmac-math-content">
        <span className="hmac-output-label">Before · the four selected bytes</span>
        <MaskByteBits bytes={result.selected} offset={result.offset} />
        <output className="sr-only" aria-label="Selected 32 bits" aria-live="off">
          {result.selected.map((byte) => byte.toString(2).padStart(8, "0")).join(" ")}
        </output>
        <div className="hmac-flow-label">
          <ArrowDown aria-hidden="true" />
          <span>Set this first bit to 0</span>
        </div>
        <span className="hmac-output-label">After · every other bit keeps its value</span>
        <MaskByteBits bytes={result.masked} offset={result.offset} />
        <output className="sr-only" aria-label="Masked bytes" aria-live="off">
          {spaced(result.masked)}
        </output>
        <output className="sr-only" aria-label="Masked bits" aria-live="off">
          {result.masked.map((byte) => byte.toString(2).padStart(8, "0")).join(" ")}
        </output>
        <p className="hmac-caption">
          {changed
            ? "The marked bit changes from 1 to 0. The other 31 bits stay the same."
            : "The marked bit is already 0, so all four bytes stay the same."}
        </p>
      </CardContent>
    </Card>
  );
}

export function HmacNumber() {
  const { result } = useHmacExample();
  if (!result) return <Unavailable />;
  return (
    <Card size="sm" className="hmac-math-card">
      <CardHeader>
        <CardTitle>Read the four bytes as one number</CardTitle>
        <CardDescription>Multiply each byte by its place value, then add</CardDescription>
      </CardHeader>
      <CardContent className="hmac-math-content">
        <dl className="hmac-byte-values">
          {result.masked.map((byte, index) => (
            <div key={index} className="hmac-byte" data-selected="true" data-start={index === 0}>
              <dt aria-label={`Byte ${result.offset + index}, hexadecimal ${toHex([byte])}`}>
                <small>{result.offset + index}</small>
                <span>{toHex([byte])}</span>
              </dt>
              <dd>
                {index > 0 && (
                  <span className="hmac-addition-sign" aria-hidden="true">
                    +
                  </span>
                )}
                <span className="hmac-byte-decimal">
                  <ArrowDown aria-hidden="true" />
                  <span>
                    Decimal <strong>{byte}</strong>
                  </span>
                </span>
                <code>
                  × {index === 3 ? 1 : 256}
                  {index < 2 && <sup>{3 - index}</sup>}
                </code>
                <span>
                  ={" "}
                  <output aria-label={`Byte ${result.offset + index} contribution`} aria-live="off">
                    {String(byte * 256 ** (3 - index))}
                  </output>
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <div className="hmac-sum-total">
          <span aria-hidden="true">=</span>
          <output className="hmac-number-result" aria-label="Masked number" aria-live="off">
            {String(result.number)}
          </output>
        </div>
      </CardContent>
    </Card>
  );
}

export function HmacRemainder() {
  const { result } = useHmacExample();
  if (!result) return <Unavailable />;
  const remainder = result.number % 1_000_000;
  const padding = 6 - String(remainder).length;
  return (
    <Card size="sm" className="hmac-math-card">
      <CardHeader>
        <CardTitle>Keep six decimal digits</CardTitle>
        <CardDescription>Split the number into whole millions and a remainder</CardDescription>
      </CardHeader>
      <CardContent className="hmac-math-content">
        <div className="hmac-number-cut">
          <div className="hmac-discarded-millions">
            <output aria-label="Quotient" aria-live="off">
              {String(result.quotient)}
            </output>
            <span>Whole millions</span>
            <small>Discard</small>
          </div>
          <div className="hmac-kept-digits">
            <output className="hmac-final-digits" aria-label="Final six-digit code" aria-live="off">
              {result.code.split("").map((digit, index) => (
                <span key={index} data-padding={index < padding}>
                  {digit}
                </span>
              ))}
            </output>
            <span>Six-digit code</span>
            <small>Keep</small>
          </div>
        </div>
        <div className="hmac-equation hmac-modulo-equation">
          <code>{String(result.number)} mod 1000000 =</code>
          <output aria-label="Remainder" aria-live="off">
            {String(remainder)}
          </output>
        </div>
        <p className="hmac-caption">
          {padding
            ? `The remainder has ${6 - padding} digits. Add ${padding} leading ${padding === 1 ? "zero" : "zeros"} to fill all six positions.`
            : "The remainder fills all six positions. These are the digits you enter."}
        </p>
      </CardContent>
    </Card>
  );
}
