---
title: "Secure Passwords Don't Have to Be Hard to Use"
date: 2026-11-10
description: Inspired by XKCD, I built a small CLI in Go to explore password entropy and generate strong passphrases that are easy to type across devices or relay aloud when autofill isn't an option.
---

Most password managers ship their own generator. While building [Key](/posts/key-secret-mananger/), I deliberately left that out. It felt more composable to let you pipe in whatever source you trust. While researching existing generators, I came across [XKCD #936](https://xkcd.com/936/).

I was drawn to word-based passphrases for the situations where autofill simply isn't available. Sometimes I'm reading a password on one device and typing it into another. Sometimes I need to relay it aloud: a starter account, a Wi-Fi password, or credentials for a conference room. Random words are easier to read, type, and say aloud than a string of mixed characters and symbols.

Being able to say the password also means I don't have to work out how to send it safely in writing just to get someone connected. Those gaps in the password-manager experience were a practical reason to build this.

The comic makes the case that four randomly chosen common words can be easier to remember and harder to crack than a short, human-invented password with predictable substitutions. It's a claim grounded in information theory. A generator's security comes from how much entropy it produces and whether selection is truly uniform.

## The entropy argument

Using the [EFF's large wordlist](https://www.eff.org/dice) of 7,776 words, each independently and uniformly selected word contributes log₂(7,776) ≈ 12.9 bits. Four words is roughly 51.7 bits; six is 77.5. EFF recommends six words for most applications.

The catch is that selection has to be uniform. Weighting words by familiarity or imposing predictable patterns reduces the real entropy below what the math says. The randomness source matters too: you want the OS's cryptographically secure random source, rather than a general-purpose pseudorandom generator whose output may be predictable.

## Building the CLI

I had the thought: why not literally implement this comic? I found some JS and Python side projects, but I wanted a small CLI binary built with the right primitives. It also seemed like a good excuse to get into some Go. The result is [xkcdpass](https://github.com/tvanreenen/xkcdpass), a small Go binary using the EFF wordlist and the OS's cryptographically secure random source.

I could have taken a dependency and shipped faster. Following the question further gave me a clearer mental model of entropy, randomness, and what "secure" actually means for a generator. If someone else finds `xkcdpass` useful, that's a bonus. I wanted to understand what I was running.
