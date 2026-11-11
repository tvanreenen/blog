# Interactive article figures

An article with `interactive: hmac` in its frontmatter shares one browser-only TOTP example across its marked figures. Add a hash marker to a standalone SVG image in Markdown to opt into a live view:

| Marker                        | Figure                                                      |
| ----------------------------- | ----------------------------------------------------------- |
| `#interactive-hmac-base32`    | Generate 20 random secret bytes and encode them as Base32   |
| `#interactive-hmac-setup`     | Matching `otpauth` URI and scannable QR code                |
| `#interactive-hmac-clock`     | Running clock, 30-second windows, and counter               |
| `#interactive-hmac`           | Decode the key, encode the counter, and calculate HMAC-SHA1 |
| `#interactive-hmac-select`    | Last-byte bits choose a four-byte slice                     |
| `#interactive-hmac-mask`      | Clear the first bit of the selected bytes                   |
| `#interactive-hmac-number`    | Combine four bytes using their place values                 |
| `#interactive-hmac-remainder` | Keep the six-digit remainder, preserving leading zeros      |

The Markdown plugin creates the figure. The article renderer enhances it after hydration when Web Crypto is available. Prerendered HTML and no-JavaScript reading retain the SVG fallback. The static reference is the public RFC test secret at 59 seconds after the Unix epoch, adapted to six digits.

`HmacExampleProvider` owns the secret, current clock, and derived calculation for one article. The clock runs continuously and recalculates on window changes. Generating a new secret updates every figure. Both before/after input cards and all later byte selections use the same values. Reduced-motion mode preserves updates without animated transitions.

Browser-generated secrets stay within the article state: refreshing does not send requests, change the URL, or write browser storage. Following the explicit setup link or scanning its QR transfers that demo seed to the reader’s authenticator. The QR encoder loads only for that live figure; browser tests independently decode the resulting QR and verify the shared calculations against Node crypto.

Shiki runs at build time and is not part of the browser components. Changes to figures should preserve accessible labels, keyboard behavior, error states, and the static SVG explanation.
