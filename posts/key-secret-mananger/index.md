---
title: Building a CLI Secret Manager
date: 2026-04-04
description: key is a macOS CLI for any secret you care about - passwords, tokens, OTP codes, whatever you need close to the shell. I built it to keep Unix composability with native macOS unlock, and learned to favor a trust model you can explain and audit.
---

![Key](hero.png)

While passkeys and passwordless tech continue to [make real progress](https://securityboulevard.com/2026/03/passkeys-hit-critical-mass-microsoft-auto-enables-for-millions-87-of-companies-deploy-as-passwords-near-end-of-life/), passwords are still widely prevalent, and there is a broad surface of authentication that doesn't map to passkeys: API keys, OAuth client secrets, TOTP seeds, recovery codes, and SSH private keys. And with everyone trying their hand at building things these days, without discipline and strong tools you end up with credentials scattered all over the place.

## Where I Started

I was an early LastPass user at the time they were considered one of the stronger players in the space. But when Apple added Passwords as a dedicated app in macOS Sequoia and iOS 18, I switched — it's genuinely the best experience I've found. Safari's autofill is the most responsive and reliable implementation I've encountered. `userPresence` makes it that much better: on a MacBook that resolves to Touch ID, or Apple Watch if you're wearing one, or your system password as a fallback, all handled by the OS transparently. I haven't seen anyone come close.

But outside Safari that smooth experience breaks down. Credentials and secrets are strewn across `.env` files on multiple machines, and I still can never find what I need when I need it. Trying to remember to store a secret back in the app — opening it, searching, copying — turns it back into friction and mess.

## Pass: The Right Idea, Wrong Unlock

More recently I stumbled across `pass`, the venerable Unix password manager. Each secret is its own file. No opaque database, no lock-in, a small composable command set. Its design and approach made complete sense to me.

But after my experience with `userPresence`, I just couldn't get on board with unlocking through the GPG agent in shell. What I couldn't stop wondering was: what would `pass` look like built natively for macOS?

## A Pattern I'd Seen Before

Working on [Frame](https://github.com/tvanreenen/frame) — a tiling window manager for macOS — I'd already worked through the architecture of a command-line interface talking to a bundled background process. I quickly felt I could apply the same pattern here. The CLI would stay thin. A helper process would hold the key material and do the sensitive work.

## Could I Actually Build This?

The real question wasn't whether I could build a new version of `pass` — it was whether I could nail a strong-but-smooth native auth experience. The requirements shaped up around that:

- Individual encrypted files, not a database, in a directory I own and easily manage
- Standard encryption I can audit and decrypt without the app if I need to
- Composable CLI that works with `fzf`, `pbcopy`, pipes, and shell scripts
- `userPresence` unlock — Touch ID, Apple Watch, or system password, resolved by the OS, with a warm session so you're not re-authenticating on every command

The result is `key`.

## How It Works

The architecture is three pieces.

**Key.app** gives the project a proper macOS identity — signing context, entitlements, the app bundle that everything else depends on. It registers the LaunchAgent helper on first launch and otherwise stays out of the way.

**The `key` CLI** is what you actually use: `get`, `copy`, `add`, `edit`, `list`, `rename`, `remove`, `unlock`, `lock`. It handles input and output. It does not touch the vault key directly.

**The LaunchAgent helper** is where the work happens. It's managed by `launchd` and communicates with the CLI over XPC — Apple's inter-process communication framework, using a named Mach service the OS brokers between processes. It owns Keychain access, enforces `userPresence`-gated vault key retrieval, handles encryption and decryption, and maintains a short-lived in-memory unlock session. Run `key unlock`, macOS prompts for auth, the helper warms a session, and subsequent commands reuse it until it idles out.

This split is the primary security boundary. Keychain access is gated by signing context and entitlements that only the helper carries — the CLI being a separate process is precisely what makes that possible.

The vault is straightforward: one randomly generated 256-bit symmetric key, stored in Keychain, encrypts all secrets individually as AES-256-GCM JSON files. Standard primitives, no custom cryptography. If you ever need to decrypt outside `key`, the README walks through it — parse the JSON, base64-decode the nonce and ciphertext, split the auth tag, decrypt with any AES-GCM implementation. The vault key is the only thing that needs protecting, and it lives in Keychain behind your biometrics.

## Two Unexpected Deep Dives

Along the way, two areas pulled me deeper than I'd planned. In both cases I ended up implementing from scratch — and came away actually understanding what I was running.

### Entropy and the XKCD Argument

Most password managers ship their own generator. I deliberately left that out of this implementation — it felt more composable to let you pipe in whatever source you trust. While researching existing generators, I came across XKCD #936.

XKCD #936 makes the case that four common words are simultaneously easier to remember and harder to crack than a short string of random-looking characters. It's a claim grounded in information theory. A generator's security comes from how much entropy it produces and whether selection is truly uniform.

The math holds: using the EFF's large wordlist of 7,776 words, each word contributes log₂(7,776) ≈ 12.9 bits. Four words is roughly 51.7 bits; six is 77.6. The catch is that selection has to be uniform — any weighting or templating reduces the real entropy below what the math says. The randomness source matters too: you want the OS's CSPRNG (the cryptographically secure pseudorandom number generator seeded from hardware entropy), not a language runtime's default random, which can be predictable enough to undermine the whole point.

I had the thought: why not literally implement this comic? I found some JS and Python side projects, but nothing like a clean, properly built CLI binary with the right primitives. It also seemed like a good excuse to get into some Go. The result is [xkcdpass](https://github.com/tvanreenen/xkcdpass) — a small Go binary that does exactly what the comic describes, with the EFF wordlist and the OS's CSPRNG. 

Worth noting: if you're generating passwords only to store and copy them anyway, the memorability argument is largely moot. But the entropy holds up, it pipes in cleanly, and it was a fun thing to build properly.

### Reading the TOTP Spec

Of the common MFA mechanisms, TOTP is the one I've always preferred — computed and autofilled next to my credential, more portable than SMS, less hardware-dependent than a security key. I looked at SwiftOTP but it pulls in two transitive dependencies. I got curious about how the algorithm actually worked, and quickly became compelled to try implementing TOTP (RFC 6238) myself. Beyond the educational value, it would give me a simple, auditable, dependency-free binary.

At a high level: take the Base32-encoded seed you're given as an HMAC-SHA1 key, compute HMAC over an 8-byte big-endian counter representing the current 30-second time window, then apply a dynamic truncation step to extract a 6-digit code.

The whole thing came in under 110 lines of Swift, including the Base32 decoder. Small enough to audit in a sitting.

### The Broader Point

Neither of these was strictly necessary. I could have taken a dependency and shipped faster. But there's something I've come to value about following curiosity past the point where a library would have closed the question — reading the spec, understanding the primitive, building the thing. Not because it's always the right call, but because the understanding you walk away with is yours in a way that importing a package isn't.

Both of these were exposure to areas I hadn't worked in before. I came away with a clearer mental model of entropy, randomness, and what "secure" actually means for a generator. With TOTP, I now understand exactly what's happening inside that six-digit code.

If someone else finds `key`, `xkcdpass` or even just the narrow TOTP implementation useful, that's a bonus. But that wasn't really the point. The point was to stay curious, follow it somewhere, and build something — even if the only person it needed to work for was me.

## One Lesson Still In-Progress: The Multi-Device Security Model

The current security model is deliberately simple and deliberately local. The vault key is stored with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` — Apple documents this as non-migrating, meaning it won't sync to other devices even through iCloud Keychain. You can sync the encrypted `.secret` files wherever you want — the vault key to decrypt them stays local.

That's a narrow trust boundary by choice. Working through the options has been an interesting exercise in what you're actually trading off — security, trust, and UX don't always pull in the same direction. The way I've thought about it, each model makes a different bet:

**Local-only (current).** One vault key, one Mac, biometric auth, short-lived session. Files can be synced; the decrypt capability can't. A second Mac with the same files can't read them — the key isn't there.

**iCloud-syncable Keychain.** Flip `kSecAttrSynchronizable` on and the vault key follows your Apple ID across devices. Simplest portability story. But the trust boundary shifts from "this Mac" to "any device in your iCloud Keychain set," which is a meaningfully different thing.

**Explicit import/export.** Keep local-only as the default, add a deliberate export flow producing a passphrase-wrapped bundle. Portability only happens when you ask for it. The event is legible — you know the key left, you know what artifact exists, you control where it goes.

**Secure Enclave multi-device.** Each authorized Mac generates its own Secure Enclave-backed keypair. The shared vault key is wrapped separately to each device's public key. Nothing exportable moves. Strongest trust model, most complex to implement and recover from.

I'm still thinking through what this means for `key`. Local-only feels like the right default to hold. Explicit import/export is probably the right next step. But I'm genuinely intrigued by the Secure Enclave path — assuming I can find a UX that doesn't make key recovery a nightmare.

## Where It Is Today

`key` is on Homebrew, open source, and something I use daily. Biometric unlock, `key copy`, TOTP, a ZSH alias with `fzf` — it does what I need it to do, cleanly.

If you're on macOS and `pass` has ever appealed to you, take a look. Repo at [github.com/tvanreenen/key](https://github.com/tvanreenen/key), overview at [key.tvr.works](https://key.tvr.works).
