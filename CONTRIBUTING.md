# Contributing

Thanks for considering a contribution. Bug reports, feature requests and pull requests are
all welcome.

## Before you start

Read [`ROADMAP.md`](ROADMAP.md). It lists what's planned, what's deliberately *not* planned,
and which syntax is reserved for future changes. It exists because someone once spent a week
on a contribution I was always going to turn down, and that was my fault for never writing it
down.

For anything larger than a bug fix, open an issue first. Not for permission — so we can agree
on the shape before you write it, which is much cheaper than agreeing afterwards.

## How this repository works

This repository is **generated**. Development happens in a separate workspace and the
publishable tree is exported from it, so what you see on `main` is that export.

Two things follow, and one of them used to be worse than it needed to be:

- **Pull requests do get merged.** After merging I carry the same change into my source before
  the next export, so the export reproduces it and your merge commit stays in the history. If
  I skip that step your work gets overwritten — but that's a discipline problem on my side,
  not something you have to work around.
- **`main.js` is a build artefact.** It's committed so BRAT and manual installs work straight
  from the repo, and CI checks that it matches a fresh build of the source. Change `main.ts`
  and `src/`, then run `npm run build` — never edit `main.js` by hand.

If your pull request is the first one you've opened here, GitHub holds the workflow runs at
"awaiting approval" until a maintainer releases them. That's a GitHub policy for first-time
contributors, not a problem with your branch. Ping me if it sits there.

## Getting set up

```bash
git clone https://github.com/ahseyg/special-callouts
cd special-callouts
npm install
npm run dev     # esbuild watch
```

To try your build in Obsidian, point it at a test vault:

```
<vault>/.obsidian/plugins/special-callouts/
├── main.js
├── manifest.json
└── styles.css
```

Copy those three files across after a build, then reload Obsidian (`Ctrl+P` → "Reload app
without saving"). `npm run build` produces the production bundle.

## Project structure

```
main.ts                     plugin class, commands, post-processor registration
src/parser.ts               metadata extraction and parameter parsing
src/processor.ts            all DOM mutation, observers, retries
src/settings/SettingsTab.ts settings UI and the Visual Layout Builder
src/modals/                 suggester, icon picker, advanced builder
src/constants.ts            palettes, default styles, font tables
styles.css                  every visual rule
skills/special-callouts/    agent skill — the most complete reference to how this works
```

If you are trying to understand the rendering behaviour, read
[`skills/special-callouts/references/internals.md`](skills/special-callouts/references/internals.md).
It documents the processing pipeline, the DOM/CSS contract and the known bugs, and it is
derived from the source rather than from the docs.

## The one hard rule about styling

Never write to `element.style` directly. Obsidian's plugin review rejects it, and v1.0.6
was spent removing the last of it.

Instead, set a data attribute plus CSS custom properties from TypeScript, and put the actual
declaration in `styles.css`:

```ts
calloutEl.setCssProps({ '--sc-radius': value + 'px' });
calloutEl.setAttribute('data-sc-radius', '');
```

```css
.callout[data-sc-radius] { border-radius: var(--sc-radius); }
```

All `!important` overrides live in `styles.css` only.

## Design rules

Four more, learned the expensive way. None of them are about taste.

**No heuristics in the parser.** Parsing runs on every callout, silently, with no undo and no
way for the user to say "no, I meant that literally." A rule that guesses will eventually
guess wrong on somebody's note and they won't know why. The same guess is fine inside a
*command*, because the user invoked it, sees the result, and can undo it. If you find yourself
writing a function whose name contains `isLikely`, `probably` or `looksLike` in the parse
path, that's the signal.

**The parser must not be destructive.** A parameter it doesn't recognise is skipped and left
in the file. Anything that writes metadata back has to preserve what it didn't touch —
unknown parameters, colour names, ordering, spacing. A note written by a newer version of the
plugin must survive being edited by an older one.

**Don't add a second copy of a list.** The parameter switch in `parseMetadata`, the flag names
in `constants.ts`, the alias table, the colour palette — each exists once. Every settings bug
fixed in 1.0.9 turned out to be a copy that had drifted from its original. If you need the
same data in a second place, export it and import it.

**Match the tests to what actually matters.** If a change affects the text in the user's note,
assert on the text. A test that only compares parsed configs will pass while the note is being
rewritten underneath it.

## Pull requests

1. Fork, then branch from `main`.
2. Keep the change focused — one concern per PR is much easier to review.
3. Match the surrounding code: same naming, same comment density, no reformatting of
   untouched lines.
4. Run `npm run typecheck` and `npm test`. Both run in CI, and esbuild does not typecheck —
   a type error will bundle happily and fail at runtime.
5. Run `npm run build` and commit the rebuilt `main.js`, then confirm the plugin still loads
   in a real vault.
6. Describe what you changed and why. A before/after screenshot helps a lot for anything
   visual.

New metadata parameters should also be documented in `USAGE_GUIDE.md` and in
`skills/special-callouts/references/parameters.md`, otherwise the reference drifts out of
sync with the code.

## Reporting bugs

[Open an issue](https://github.com/ahseyg/special-callouts/issues) with:

1. Your Obsidian version and the plugin version
2. The exact callout markdown that misbehaves
3. A screenshot if the problem is visual
4. Whether it happens in Reading mode, Live Preview, or both

Worth checking first: `bg:` is applied at 15% opacity by design, and in a grid the position
number in `(2:3)` does nothing — only the column count matters. Both are documented in the
skill's reference files and are the two most commonly reported non-bugs.

## Releases

Maintainer only. Bump `manifest.json`, `versions.json`, `package.json` and add a
`CHANGELOG.md` section, then push a tag matching the version number — the release workflow
builds, attests and publishes from there.
