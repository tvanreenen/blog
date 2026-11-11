import { toHex } from "../lib/hmac";

export function HmacBytes({
  bytes,
  label,
  offset,
  sourceIndex,
}: {
  bytes?: number[];
  label: string;
  offset?: number;
  sourceIndex?: number;
}) {
  return (
    <>
      <div className="hmac-byte-grid" aria-hidden="true">
        {Array.from({ length: 20 }, (_, index) => {
          const value = bytes ? toHex([bytes[index]!]) : "··";
          return (
            <span
              key={index}
              className="hmac-byte"
              data-source={sourceIndex === index}
              data-start={offset === index}
              data-selected={offset !== undefined && index >= offset && index < offset + 4}
            >
              <small>{index}</small>
              <span>{value}</span>
            </span>
          );
        })}
      </div>
      <output className="sr-only" aria-label={label} aria-live="off">
        {bytes ? toHex(bytes) : ""}
      </output>
    </>
  );
}
