---
title: I Forked My Window Manager
date: 2026-03-03
description: AeroSpace was almost exactly what I wanted. So I forked it, rebuilt it, and shipped something I actually use every day.
---

![Frame](hero.png)

I've cycled through a lot of tiling window managers on macOS — [spectrwm](https://github.com/conformal/spectrwm), [Spectacle](https://github.com/eczarny/spectacle), [Magnet](https://magnet.crowdcafe.com), the native macOS [tiling](https://web.archive.org/web/20260207124135/https://support.apple.com/guide/mac-help/tile-app-windows-mchlef287e5d/26/mac/26) added in Sequoia, and finally [AeroSpace](https://github.com/nikitabobko/AeroSpace). AeroSpace was the closest fit by far: MIT-licensed, keyboard-first, genuinely configurable. But I could never fully internalize its i3-style recursive tree model. Manipulating layouts always felt like solving a puzzle I hadn't signed up for. Not because there wasn't a right answer, but because I had to think through the tree structure to find it. I wanted to reach for a keybinding and just know what would happen.

The problem was specific enough that I could name it. So I blocked off a weekend and tested a hypothesis: could I fork AeroSpace and land on something I'd actually stick with?

The result is [**Frame**](https://github.com/tvanreenen/frame).

### Columns, Not Trees

The first thing I changed was the layout model. AeroSpace represents windows as leaves in a recursive tree — each node can be either a horizontal or vertical split, arbitrarily nested. It's expressive. It's also a lot to hold in your head when you just want to move a window left.

I replaced it with a fixed two-level model:

- Columns across the screen
- Windows stacked within each column

That's it. No hidden structure. And the rules that fall out of this model are easy enough to internalize that you stop thinking about them:

- First window → full screen
- Subsequent windows → appended to the focused column
- Move a window in a direction where no column exists → automatically create one
- Move the last window out of a column → automatically remove the empty column
- Windows only move up/down within a column; columns only move left/right
- Dialogs and floating popups are excluded from layout management

The constraint is also the feature. Take something simple: you want to move your editor to the left side of the screen. In a tree model, the answer depends on where you are in the tree — what kind of split is your current node, what's its parent, what happens to the sibling? In the column model there's only one question: is there a column to the left? If yes, the window moves there. If no, one gets created. That's it.

The reduction in model complexity translates directly into a reduction in hesitation. Instead of working out where you are before you move, you just move.

### Hands on the Home Row

The second thing was control ergonomics. AeroSpace is configurable and I'd already bent it toward `hjkl` — but the design I wanted wasn't just about the keys, it was about how the modifier layers built on each other.

The model I landed on: one base modifier, three layered operations.

- `alt` + `h/j/k/l` → move focus
- `alt` + `shift` + `h/j/k/l` → move the focused window
- `alt` + `shift` + `ctrl` + `h/j/k/l` → push the edge of the focused row or column

Workspaces use `alt` + `1-0`. Fullscreen toggles with `alt` + `F`. Each layer adds exactly one modifier and changes exactly what you're operating on. You learn the first binding, and the rest follows without needing to memorize it — the model is self-explaining.

This is the same principle as the window model: not flexibility for its own sake, but a structure intuitive enough that you stop thinking about it.

### Taking It Over

Once the hypothesis was proven — layout model I liked, keybindings that clicked — staying on AeroSpace's fork network stopped making sense. Our goals had diverged enough that syncing upstream would've been ongoing friction, and I didn't want to be in the business of maintaining compatibility with a design I'd already replaced.

So I took ownership of the codebase outright. That meant two things: a structural cleanup, and a feature surface reduction.

The cleanup was the satisfying kind — clarifying intent, drawing cleaner boundaries between subsystems, separating concerns that had grown together. The kind of work that's only worth doing once the place is actually yours. It's running on a significantly different architecture than where it started.

The feature reduction was just as important. There were layout modes and configuration options I'd never use and didn't want to maintain. Carrying that surface area forward would've meant owning code paths I didn't fully understand for behaviors I'd never test. I stripped out what didn't belong to the model I was building and stopped worrying about backwards compatibility with a user base that was just me.

What remained was much easier to reason about.

### Owning It in Practice

There's something I underestimated about building something for daily use that you actually own: when something breaks, you just fix it.

I don't file an issue and wait. I don't work around it. I open the code, understand what's happening, and patch it. That sounds small, but the feeling of not being stuck is genuinely different.

[PR #14](https://github.com/tvanreenen/frame/pull/14) is a good example. Tabbed apps — Ghostty, Pixelmator Pro — were disrupting the layout in a confusing way. Opening or closing a tab would cause Frame to briefly garbage-collect the window and re-register it, as if it had been closed and a new one opened.

Diagnosing it required understanding what was actually happening at the AX layer, which is where a tool I'd shipped just before came in handy. [PR #13](https://github.com/tvanreenen/frame/pull/13) added a hidden `debug-window-events` command — toggle it on for the frontmost app and it streams a live JSONL log of every AX notification, window registration, and garbage collection to `/tmp/frame-window-events.log`. No config reload, no rebuilding. That log made the pattern obvious: macOS "churns" platform window IDs when tabs are created or destroyed. The logical window is the same, but the AX handle changes. Frame was treating the platform ID as stable identity, so each tab operation looked like a destroy-and-create cycle.

The fix was introducing a stable `FrameWindowId` type independent of the macOS platform handle, and a reconciliation step in the refresh cycle that detects "same window, new platform ID" vs. genuine window transitions. It's been solid since.

That feedback loop — using it, hitting something rough, fixing it — is a big part of why the tool keeps getting better.

### A Few Things I Found Interesting

Most of my career has been in SaaS — web services, APIs, databases. Desktop software on macOS is a different world, and building Frame was my first real time in it. A few things that were new to me and worth noting:

**CLI driving AX APIs.** The architecture here is genuinely unusual: a persistent daemon process that owns window state and accepts commands over a Unix socket from a lightweight CLI binary. The actual window control goes through macOS's Accessibility (AX) layer — the same API screen readers use, and frankly the only viable path for this kind of external window control on macOS. It's not well-documented, and the behavior can be quirky (see: the tabbed app bug above). But this architecture gives Frame something most window managers don't have out of the box: scriptability. I can drive it from anywhere that can run a CLI command — cron jobs, shell scripts, and especially [SketchyBar](https://github.com/FelixKratz/SketchyBar), which I use for a status bar that reflects Frame's current workspace state. I'm considering a future move to XPC as a more native macOS IPC mechanism, but the socket approach has been straightforward and flexible.

**Invariant-driven normalization.** I hadn't encountered this pattern before, and it turned out to be one of the more useful design decisions in the codebase. Rather than every operation being responsible for producing a perfectly valid layout, each operation just makes its change and then a normalization pass runs to enforce the column model invariants. Empty columns get removed, orphaned windows get reattached, and the layout is always left in a consistent state. The upside beyond cleanliness: when something goes wrong — like the tabbed app bug — the invariants make it immediately obvious that state is wrong, rather than having the corruption quietly propagate.

**Homebrew tap.** First time I'd packaged and distributed anything via Homebrew. It's still just my own personal tap, but the process was interesting — writing the formula, managing the versioned archive, understanding how Homebrew resolves and installs things. Worth knowing how it works even if the tap never has more than one user.

---

A final note: AeroSpace is a genuinely well-built piece of software, and I owe a lot to [Nikita Bobko](https://github.com/nikitabobko) and its contributors. I diverged from their goals, and eventually from their codebase — but I couldn't have gotten to where I wanted to go without standing on what they built first. If AeroSpace's model works for you, it's worth trying.

Frame started as a weekend hypothesis test. What I didn't expect was how satisfying it would be to keep going — fixing things when they break, changing things when they annoy me, shaping it further as my needs shift. It's mine to use and mine to evolve.

If you're tired of your window manager and want something with a simpler mental model, [give Frame a try](https://github.com/tvanreenen/frame). And if you just want to see how something like this is built, the source is all there.
