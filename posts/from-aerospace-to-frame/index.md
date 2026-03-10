---
title: From AeroSpace to Frame
date: git Created
description: Open-source software, AI-augmented coding tools, and an experiment in tailoring software to fit my needs.
---

![Frame](hero.png)

I've always liked the idea of a tiling window manager: no drag-and-drop choreography, no window overlap entropy, and no constant context switch to the mouse. Whether on a small laptop screen or a multi-monitor desktop, I simply want my windows to fill available space, adapt when state changes, and be intuitively controllable from the keyboard.

Over the years on macOS, I've cycled through [spectrwm](https://github.com/conformal/spectrwm), [Spectacle](https://github.com/eczarny/spectacle), [Magnet](https://magnet.crowdcafe.com), macOS native [tiling](https://web.archive.org/web/20260207124135/https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/26/mac/26)/[shortcuts](https://web.archive.org/web/20260224194556/https://support.apple.com/guide/mac-help/mac-window-tiling-icons-keyboard-shortcuts-mchl9674d0b0/26/mac/26), and finally [AeroSpace](https://github.com/nikitabobko/AeroSpace). AeroSpace was by far the closest fit — highly configurable and well-built. But I could never internalize its i3-style tree model; manipulating layouts within a workspace always felt like solving a puzzle I didn't want to be solving.

## To build or not to build

When software doesn't quite fit you, your mind, or your process, you've historically had three options: accept the compromises, contribute to someone else's project and hope your PR gets merged, or pay the heavy cost to build your own.

For most of modern software history, the hard constraint has been engineering throughput — and we've built team structures and delivery processes around protecting that scarce bandwidth. AI tools have shifted that constraint dramatically. Building your own thing is now a practical option in a way it simply wasn't before.

## A weekend experiment

With AeroSpace being close enough and MIT-licensed, I blocked off a weekend to test a hypothesis: could I fork it and land on a layout model, a set of keybindings, and a feature surface that I'd legitimately stick with and use every day?

I ended up building what I now call [**Frame**](https://github.com/tvanreenen/frame).

## Columns, not trees

The first key design decision was replacing a recursive tree with a fixed two-level model:

- Columns across the screen
- Windows stacked within each column

No hidden tree structure to maintain in my head.

The layout rules are simple:

- First window -> full screen
- Subsequent windows -> append to focused column
- Move window in direction where there isn't a column -> automatically create a new column
- Move last window out of a column -> automatically remove the empty column
- Windows only move up/down within a column
- Special dialogs and popups allowed to float and not interrupt layout

## Hands on the home row

The second key design decision was control ergonomics. I wanted a single simple mental model: directional keys (`h/j/k/l`) plus modifier layering.

- `alt` + `h/j/k/l` -> directionally move focus
- `alt` + `shift` + `h/j/k/l` -> directionally move windows
- `alt` + `shift` + `ctrl` + `h/j/k/l` -> directionally push the edge of row/column of the focused window

Workspaces use `alt` + `1-0`, and fullscreen toggles with `alt` + `F`, keeping the same base focus modifier so the system stays composable and easy to remember.

## The overhaul

Hypothesis proven. I finally had something that felt right. But staying on the fork network and syncing upstream wasn't realistic given how much our goals had already diverged. It'd be simpler to own it outright and shape every part of it myself.

What followed was a bit of an unbridled effort to reshape the codebase from end to end — the kind of renovation you only take on once the place is yours. Clarifying intent, finding the right language, hardening boundaries, separating concerns — until I landed on a clean and appropriate architecture.

## Building with AI

This project would not exist without AI-assisted coding tools. Not because AI replaced the engineering, but because it collapsed the overhead at each step: understanding the existing code, articulating direction, negotiating architecture, decomposing the work, generating incremental changes, and reviewing the results.

My engineering loop with AI tools is still very much:

1. Build context: current behavior, goals, constraints, relevant docs, architectural options
2. Narrow to a specific, aligned change
3. Generate and iteratively refine a plan including tests
4. Execute the plan
5. Verify behavior and review code
6. Refine as needed
7. Document, commit, repeat

It sounds like a lot, but those loops happen in minutes now instead of days. It's still how I prefer to work — it gives me a strong git audit trail and forces me to stay deliberate about each change.

## Learnings

Some of the deeper technical work I found most interesting:

- Daemon + CLI architecture — the window manager runs as a background process, accepting commands over a Unix socket from the CLI.
- Length-prefixed JSON framing over that socket, so both sides reliably delineate messages.
- Direct window control through macOS Accessibility (AX) APIs, with per-app concurrency control to keep operations safe, predictable, and cancellable.
- Invariant-driven normalization that enforces a consistent layout model after every state mutation.
- Homebrew tap packaging and distribution.

Frame started as a weekend experiment and turned into something I use every day. Whether it's useful to anyone else matters less than what it represents: when the cost of building drops, you stop settling for the closest fit and start building exactly what you need.

It's worth asking where you're still adapting yourself to your tools when you could be shaping them around the way you actually work. And in a world where more code is generated than written, the fundamentals — system design, architecture, knowing what to build and why — matter more than ever.
