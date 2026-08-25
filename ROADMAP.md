# Roadmap

What this plugin is heading towards, what it is deliberately not doing, and which syntax is
spoken for. It exists so that nobody spends a week on something I was always going to turn
down — that has happened once and it was my fault for never writing this down.

If you want to work on something here, say so on an issue first. Not for permission — so we
can agree on the shape before you write it, which is much cheaper than agreeing afterwards.

Current version: **1.0.9**. Known bugs live in
[`skills/special-callouts/references/internals.md`](skills/special-callouts/references/internals.md)
under "Known bugs and inconsistencies"; that file is derived from the source and is more
current than any prose here.

---

## Next

### `span:` — panels wider than one column

Today a panel in a `multi-callout` grid is always one column wide. `span:` makes it wider:

```markdown
> [!note] (1:3, span:2) Wide Panel
```

Width is `((100% - gaps) / columns) * span + (span - 1) * gap`, clamped to the column count.
Row spanning is **not** part of this — the container is flexbox and flex cannot span rows.
That has to wait for the grid migration below.

Designed by [Rohit Nahar](https://github.com/RohitNahar-Offical) in
[#13](https://github.com/ahseyg/special-callouts/pull/13).

### `showInCommandPalette` on custom styles and layouts

Every custom style currently registers a command, which clutters the palette for anyone with
more than a handful. A per-style toggle, defaulting to on, fixes that without breaking any
existing hotkey binding — `showInCommandPalette !== false` treats saved styles as opted in.

Proposed by [Rohit Nahar](https://github.com/RohitNahar-Offical) on
[#9](https://github.com/ahseyg/special-callouts/pull/9).

### In-place callout editing

The big one: change a callout's appearance without dropping into raw markdown. Right-click on
a rendered callout, or a button on it, opening a modal.

The missing primitive is **not** a serializer. It is a token-level parse that keeps offsets,
plus a splice:

```ts
interface MetadataToken {
    key: string | null;   // null for a bare token: a flag or a layout name
    raw: string;          // exactly as the user typed it
    start: number;
    end: number;
}

parseTokens(content: string): MetadataToken[]
setToken(content: string, key: string, value: string | null): string   // null removes
```

The invariant that matters is **not** `parse(serialize(parse(x))) === parse(x)`. That only
asserts two configs match, and an editor writes text, not configs. The real one is:

> `setToken(x, key, value)` leaves every token except `key` byte-identical.

Which means: unknown parameters survive, colour names stay names instead of becoming hex,
parameter order survives, spacing survives, and a note written by a newer version of the
plugin does not get silently downgraded when an older version edits it.

A full `serializeMetadata(config)` is still wanted, but only on the **insert** path — the
insert command, the suggester, the Advanced Builder — where there is no existing text to
preserve.

Once the primitive exists, every piece of UI is the same four steps: read the span, parse to
tokens, set the ones the user changed, write the span back.

---

## Wanted, and a good size for a pull request

- **A `dense` toggle in the settings UI.** The parameter exists inline but has no control. The
  icon colour picker added in 1.0.8 is the pattern to copy.
- **eslint + `eslint-plugin-obsidianmd`.** There is no lint config at all. This is the tool
  that catches the `element.style` pattern the store review rejects, and right now
  `npm run typecheck` is the closest thing to a guard.
- **Gradient presets render as a blank card in settings.** The preview assumes `bg` is a hex
  value and appends an alpha suffix to it. The note renders correctly; only the settings
  preview is wrong.
- **Hyphenated custom colour names don't work in the inline `gradient:` shorthand,** because
  the value is split on `-`. Inline only — a saved preset stores a finished CSS gradient and
  has been applied correctly since 1.0.9.

---

## Planned, but I would rather drive these myself

Not because help isn't wanted — because a wrong version fails silently and I would rather
find out on my own machine.

- **Declarative settings API (`getSettingDefinitions`).** Obsidian's store scan reports that
  the settings don't appear in 1.13+ settings search. The trap: on Obsidian 1.13.0+,
  `display()` is bypassed entirely whenever `getSettingDefinitions()` returns a non-empty
  array. Adding the method without a complete definition array **deletes the entire settings
  UI** — visual layout builder, live preview, colour pickers, style editor — for everyone on
  1.13+, with no error. The correct shape delegates complex sections back to the existing
  render methods through `render` callbacks. Not shipping without eyes on a real 1.13+ vault.

---

## Deliberately not doing

These are settled design decisions, not gaps. If you disagree, open an issue and argue —
that's welcome — but please don't write the code first.

### Metadata anywhere except the front of the title

The rule is one sentence with no exceptions: *parameters go in parentheses immediately after
the callout type, before the title text.* Because it is total, it guarantees something worth
more than the convenience of relaxing it — **any parenthesis anywhere else in a title is
prose**, always, and there is no reserved word list for anyone to learn.

Allowing a trailing block means deciding, per callout, whether `(...)` is metadata or text.
Every heuristic for that leaks: clock times, scores, aspect ratios and date ranges are all
literally `number:number`, so `> [!note] Standup (10:30)` becomes cell 10 of a 30-column
grid. It also makes two blocks expressible and forces an invented precedence rule, and it
means every *writer* of metadata — the icon command, the style importer, the future editor —
has to agree on where the block is, not just every reader.

A **command** that moves a trailing block to the front is a different matter and would be
welcome. User-invoked means a heuristic is allowed to guess wrong: the result is visible
immediately and undo works.

### Making the config the source of truth

The text in the note is the truth. `CalloutConfig` is a derived, read-only view of it.

Inverting that — serialising a config back over the user's line — makes the parser
destructive by contract: anything it doesn't model is deleted on the first write. That
includes typos, deliberate junk, and syntax from a *newer* version of the plugin, which is how
a plugin breaks its own forward compatibility. It also bakes resolved values in: `bg:red`
becomes `bg:#e74c3c` permanently, and for a custom colour that severs the link, so renaming
the colour in settings no longer updates the note.

Every note written with this plugin is plain markdown that older versions still read
correctly. That is worth more than any editor feature. See the editing section above for the
approach that keeps it.

### Removing the per-style commands

They're a shipped feature and people bind hotkeys to them; removing them breaks those bindings
silently. The palette clutter is real, which is what `showInCommandPalette` is for.

### Styling from JavaScript

Never write to `element.style`. See CONTRIBUTING — this is the one hard rule and v1.0.6 was
an entire release spent removing the last of it.

---

## Reserved syntax

Do not use these for anything else. They are spoken for by planned changes and will mean what
they look like when they arrive:

| Syntax | Reserved for |
|--------|--------------|
| `1-2:3`, `1-2:3:1-2` | Ranged grid placement, after the flex → grid migration |

A ranged token can be made to *half* work today — the column span renders correctly under
flexbox, the row span cannot. Shipping it now would mean publishing a syntax that silently
ignores part of what it says, and then having to preserve a meaning it never had. `span:`
above expresses the capability honestly in the meantime.

---

## Breaking, held for a major version

### `multi-callout` from flexbox to CSS grid

`data-grid-pos` and `data-grid-row` are written to the DOM and read by nothing. Panels appear
in document order and wrap; only the column count sizes them. The documentation says so
explicitly, which is exactly the problem — vaults are full of arbitrary position numbers
written on the understanding that they do nothing, and they would all become real placements
overnight.

This one needs its own release, a migration note, and verification in a real vault before it
goes anywhere near a tag.

---

## Not fixable here

The command for a deleted preset stays in the palette until Obsidian restarts. New presets
register instantly, but Obsidian offers no reliable way to withdraw a registration.
