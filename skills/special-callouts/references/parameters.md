# Parameter reference

Complete, behaviour-accurate reference for every metadata parameter in Special Callouts
v1.0.9. Where the plugin's own docs and its code disagree, the code wins and the
disagreement is called out.

## Contents

- [How metadata is read](#how-metadata-is-read)
- [How colors are resolved](#how-colors-are-resolved)
- [Colors: bg, text, title, link](#colors-bg-text-title-link)
- [Effects: gradient, neon](#effects-gradient-neon)
- [Text readability borders](#text-readability-borders)
- [Borders and shape](#borders-and-shape)
- [Typography: font, font-size](#typography-font-font-size)
- [Icons: icon, no-icon](#icons-icon-no-icon)
- [Alignment and density: center, title:center, compact, dense, padding](#alignment-and-density)
- [Layout: col, grid, custom layouts](#layout-col-grid-custom-layouts)
- [Presets: style](#presets-style)
- [Parameter quick table](#parameter-quick-table)
- [Silently ignored input](#silently-ignored-input)

---

## How metadata is read

The processor takes the rendered callout title's text, trims leading whitespace, and
requires the first character to be `(`. It then scans forward counting parenthesis depth
to find the matching `)`. Text inside becomes the metadata; text after becomes the visible
title.

Consequences worth internalising:

- Metadata **must** be the first thing after `]`. `> [!note] Title (bg:red)` is inert.
- The parens must balance, or the entire block is ignored — including the parameters that
  would otherwise have been fine.
- Nesting works, which is what makes `text:(white, dark-border)` possible.
- Splitting into parameters is parenthesis-aware: commas inside `( )` do not split.
- Keys are lowercased before matching, so `BG:red` works. Values are lowercased only for
  some parameters (see each entry) — hex codes are case-insensitive to CSS anyway.
- An unrecognised key is skipped in silence, and its neighbours still apply. Partial
  styling is therefore a reliable signal that exactly one value is wrong.

## How colors are resolved

Every color-accepting parameter runs its value through the same three-step resolution:

1. Match against the **standard palette** (case-insensitive).
2. Match against the user's **custom colors** defined in Settings → Colors (case-insensitive).
3. Otherwise pass the string through unchanged, on the assumption it is a hex code.

The built-in palette — editable by the user in settings, so these hexes are defaults, not
guarantees:

| Name | Default hex |
|---|---|
| `red` | `#e74c3c` |
| `blue` | `#3498db` |
| `green` | `#2ecc71` |
| `yellow` | `#f1c40f` |
| `orange` | `#e67e22` |
| `purple` | `#9b59b6` |
| `pink` | `#e84393` |
| `teal` | `#1abc9c` |
| `grey` / `gray` | `#95a5a6` |

Because step 3 passes anything through, a CSS color keyword like `rebeccapurple` or
`white` works for plain color parameters — but a *typo* also "works" in the sense that it
reaches CSS and is dropped there, with no warning. Prefer palette names or hex.

## Colors: bg, text, title, link

### `bg:` (alias `background:`)

```markdown
> [!note] (bg:#2ecc71) Green tint
```

Applies `background-color: color-mix(in srgb, <color> 15%, transparent)`.

**The 15% is not adjustable through metadata.** This is the single most surprising piece
of the plugin: `bg:` produces a *tint*, not a fill. `bg:#000000` on a light theme is a
pale grey. When the user wants a solid panel, use `gradient:` (full opacity) or accept
that a saved preset's background behaves the same way.

Because the tint is transparent, the theme's background shows through, which is why the
same `bg:` value reads differently in light and dark themes. For output that has to look
identical in both, pick explicit `text:` and `title:` colors rather than relying on the
theme's defaults.

### `text:`

Sets the content text color. Applies to `.callout-content` only — the title keeps the
theme color unless `title:` is also set.

```markdown
> [!note] (bg:#2c3e50, text:#ecf0f1) Dark card
```

Also accepts the two readability keywords instead of a color — see
[Text readability borders](#text-readability-borders).

### `title:`

Sets the title color **and the icon color**, since the CSS rule targets both the title and
the icon inside it. Use [`icon-color:`](#icon-color-alias-iconcolor) when they should differ.

`title:` is overloaded and accepts three different kinds of value:

- a color → `title:#e94560`
- `center` → centers the title only, leaving content left-aligned
- `dark-border` / `light-border` → readability stroke on the title

Only one meaning applies per occurrence. To combine a color with a stroke, use the grouped
form: `title:(cyan, dark-border)`.

### `link:`

Sets the link color inside the callout, via the `--link-color` variable. Links also get
`opacity: 0.8` on hover. Accepts a color, or `dark-border` / `light-border` for a stroke on
links.

```markdown
> [!note] (bg:#2c3e50, text:white, link:orange) Links stand out
```

## Effects: gradient, neon

### `gradient:`

```markdown
> [!tip] (gradient:#667eea-#764ba2, text:white) Full-opacity panel
```

Produces `linear-gradient(90deg, <c1>, <c2>)` — always horizontal, left to right, always
exactly two stops.

Three things to know:

1. **Full opacity.** Unlike `bg:`, the gradient is not color-mixed. This is the only way to
   get a genuinely solid background from inline metadata.
2. **It disables the border.** A no-border flag is set alongside it. Re-add one with an
   explicit `border:<color>` after the gradient if needed.
3. **It splits the value on `-`.** Exactly two parts must result, so hyphenated custom
   color names break it. `gradient:blue-purple` works because those are single words;
   `gradient:brand-blue-brand-red` does not. This applies to the inline shorthand only —
   a saved preset stores the finished `linear-gradient(...)` and is used verbatim.

Set `text:` explicitly with a gradient — the plugin forces `color: var(--text-normal)` on
gradient callouts, which can be unreadable against a saturated gradient.

### `neon:`

```markdown
> [!danger] (neon:#ff0000, bg:#1a0000, text:#ff6b6b) Red alert
```

Adds a 2 px solid border in the given color plus an outer and inner glow.

Any color notation works — hex of either length, a palette name, or a bare CSS keyword —
because the glow is built with `color-mix`. Up to v1.0.7 it was built by concatenating alpha
suffixes onto the color string, so a 3-digit hex (`#f00`) or an unresolved keyword
(`neon:rebeccapurple`) kept its border but silently lost its glow.

Neon reads best on a dark `bg:`; on a light theme the glow is barely visible.

## Text readability borders

When text and background are close in luminance, a stroke restores contrast. Two keywords:
`dark-border` (dark outline, for light text on a busy or light background) and
`light-border` (light outline).

Two spellings:

```markdown
> [!note] (bg:#e74c3c, text:dark-border) Stroke only, theme text color
> [!note] (bg:#e74c3c, text:(white, dark-border)) Color and stroke together
```

The grouped form `key:(value, value)` is shorthand for writing the key once per value, so
since v1.0.9 **every** parameter accepts it. `text:(white, dark-border)` is read as
`text:white, text:dark-border`, and each value is then classified exactly as it would be on
its own: `dark-border`/`light-border` become the stroke, `center` becomes title-centering
(in a `title:` group only), and anything else is treated as a color. So
`title:(center, cyan, dark-border)` sets all three at once.

Where repeating a key makes no sense the last value simply wins — `radius:(10, 20)` is a
20px radius, not an error. Groups still cannot nest.

Up to v1.0.8 only `text:`, `title:` and `link:` understood the form; on any other parameter
the parentheses were passed through as part of the value, so `bg:(red)` set the background
to the literal string `(red)` and CSS dropped it.

A value that carries parentheses of its own is left alone, because the group form has to
wrap the whole value: `bg:rgba(0,0,0,0.5)` is one colour, not a group.

Implementation note: strokes use `-webkit-text-stroke` plus a matching `text-shadow`. They
apply to the content element for `text:`, the title element for `title:`, and the anchor
elements for `link:`.

## Borders and shape

### `border:`

A color, or the keyword `none`.

```markdown
> [!note] (border:#3498db) Full border, replaces the accent stripe
> [!note] (border:none) No border at all
```

Obsidian's default callout has a colored left stripe; `border:` replaces it with a border
on all four sides.

### `border-width:` (alias `bw:`)

A number, interpreted as pixels. An explicit unit is accepted too.

```markdown
> [!note] (border:#3498db, border-width:4) 4px border
```

`border-width:4` and `border-width:4px` are equivalent; the same holds for `radius:`. In
v1.0.7 and earlier the unit-carrying form produced `4pxpx` and was silently dropped.

### `border-style:` (alias `bs:`)

`solid` (default), `dashed`, `dotted`, `double` — and in practice any CSS border-style
keyword, since the value is passed through untouched. `groove`, `ridge`, `inset` and
`outset` all work; they are simply not worth a table row of their own.

Behaviour differs depending on whether `border:` is present. With a color, the style is
folded into the border shorthand. Without one, only the style is overridden, so the theme's
existing border color and width remain. `(border-style:dashed)` alone therefore turns
Obsidian's left stripe dashed rather than drawing a full dashed box.

### `radius:`

A number in pixels, with or without the unit. `radius:0` gives sharp corners; large values
approach a pill.

```markdown
> [!note] (radius:20, gradient:#11998e-#38ef7d, text:white) Rounded
```

Callouts already have `overflow: hidden` globally, so background and gradient are clipped to
the radius correctly — but so is any content that overflows.

## Typography: font, font-size

### `font:`

Exactly five accepted values; anything else is ignored and the theme font stays.

| Value | Resolves to |
|---|---|
| `mono` | `var(--font-monospace)` |
| `serif` | `var(--font-interface-theme), ui-serif, serif` |
| `sans` | `var(--font-interface), ui-sans-serif, sans-serif` |
| `hand` | `"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive` |
| `marker` | `"Permanent Marker", "Segoe Print", "Chalkboard", cursive` |

`serif` and `sans` both start from an Obsidian theme variable, so on many themes they look
identical to the default text and the user sees "nothing happened". `mono`, `hand` and
`marker` are the three that visibly change anything on a typical setup. `marker` depends on
fonts that are absent on most systems and quietly falls back to a generic cursive.

### `font-size:`

An integer from 1 to 5. Values outside the range, or non-numeric ones, are ignored.

| Value | Size |
|---|---|
| 1 | `0.85em` |
| 2 | `0.92em` |
| 3 | `1em` (default) |
| 4 | `1.2em` |
| 5 | `1.5em` |

The size is set on the callout element and the title is pinned to `1em` of that, so the
title scales along with the body rather than staying fixed.

## Icons: icon, no-icon

### `icon:`

Any Lucide icon id, lowercased.

```markdown
> [!note] (icon:rocket) Launch
```

Obsidian sometimes overwrites a custom type's icon with its default shortly after render,
so the plugin re-applies the icon on the next tick and watches the element briefly. This is
why an icon can visibly flicker once on slow renders — expected, not a bug.

If the theme omits the icon element entirely, the plugin creates one and prepends it to the
title.

Icon ids come from Obsidian's bundled Lucide set. When unsure of a name, the *Change Icon of
Callout at Cursor* command opens a searchable picker — but note it writes the unsupported
pipe form (see [internals](internals.md#known-bugs-and-inconsistencies)), so use it to
*discover* the name and then type `icon:<name>` into the parentheses yourself.

### `icon-color:` (alias `iconcolor:`)

Colors the icon on its own, overriding the colour it would otherwise take from `title:`.

```markdown
> [!note] (title:#8892b0, icon-color:#64ffda) Muted title, bright icon
```

Without it the icon follows `title:`. Obsidian styles the icon's SVG directly, so the
plugin sets both a colour and the `--icon-color` variable to reach it — up to v1.0.7 it only
coloured the container, which the SVG never inherited, leaving the icon on the theme accent.

### `no-icon` (alias `noicon`)

A standalone flag; hides the icon.

```markdown
> [!note] (no-icon, bg:#f1c40f, text:black) Plain box
```

`no-icon` and `icon:` are mutually exclusive and `no-icon` wins. The title row still
occupies space even with the icon hidden — hiding the icon does not remove the title bar.

## Alignment and density

### `center`

Standalone flag. Centers the title, the content, and the flex alignment of the callout.

### `title:center`

Centers only the title; content stays left-aligned. Ignored if `center` is also present —
`center` is checked first and the title-only branch is skipped.

### `compact`

Standalone flag. Reduces padding to `0.3em` on the callout and `0.3em 0.6em` on the title
and content.

### `dense`

Standalone flag. Everything `compact` does, plus a tighter line-height (`1.3`) and reduced
margins on list items and paragraphs. It is a **superset** of `compact`, so `(dense, compact)`
is redundant.

Use it when a panel has to hold a long list; `compact` alone when only the padding is in the
way.

> In v1.0.7 and earlier `dense` was parsed as an exact alias of `compact` and had no
> line-height effect, even though the usage guide described one. Notes written against those
> versions keep working — `dense` still implies `compact` — they just render tighter now.

### `padding:0`

An undocumented alias: `padding:0` sets the compact flag. Any other `padding:` value is
ignored. Prefer `compact` — it is what the settings UI and every example use.

## Layout: col, grid, custom layouts

### `col:N` (alias `column:N`)

Splits lists inside the callout into N columns. Covered in depth in
[layouts.md](layouts.md#multi-column-lists).

Any positive integer parses; 2–4 is the practical range. Non-numeric values are ignored.

### `span:N`

Spans a grid panel across `N` columns inside a `> [!multi-callout]` container.

```markdown
> [!multi-callout]
>
>> [!note] (1:3, span:2) Spans 2 columns
>> Content
>
>> [!note] (3:3) Regular 1 column
>> Content
```

Clamped to the total column count (`Math.min(span, columns)`). Ignored if non-numeric or less than 1.

### Grid position `N:M` or `N:M:R`

A bare token of digits separated by `:`, `,` or `/`. It must be delimited by the start of
the metadata, whitespace, or a comma on both sides — which it naturally is when written as
a normal comma-separated parameter.

`M` (the column count) is the only part that affects rendering. See
[layouts.md](layouts.md#dashboard-grids-multi-callout) and trap 4 in SKILL.md.

### Custom layout name

A bare word matching a layout saved in the Visual Layout Builder applies that CSS-grid
layout. The built-in bare words — `compact`, `dense`, `center`, `no-icon`, `noicon` — are
reserved and win over a layout of the same name; since v1.0.9 the builder will not save
one. Up to v1.0.8 layout names were matched first, so such a layout silently disabled that
flag in every note in the vault. Names are normalised on save to lowercase with spaces replaced by underscores, so
reference them exactly as they appear in the saved-layouts list. See
[layouts.md](layouts.md#custom-visual-layouts).

## Presets: style

```markdown
> [!note] (style:my-preset) Title
```

Applies a saved custom style to any callout type. The value is lowercased and matched
against saved preset names; no match means nothing happens.

The preset is applied **before** the rest of the inline metadata, so any parameter written
alongside it overrides the corresponding preset property. `(style:card, bg:red)` is "the
card preset, but red".

The alternative is using the preset name as the callout type — `> [!card]` — which applies
the same style without needing `style:` at all. Both routes end in the same code path.

## Parameter quick table

| Parameter | Aliases | Value | Notes |
|---|---|---|---|
| `bg:` | `background:` | color | applied at 15% opacity |
| `text:` | — | color · `dark-border` · `light-border` | content only |
| `title:` | — | color · `center` · `dark-border` · `light-border` | colors icon too |
| `link:` | — | color · `dark-border` · `light-border` | |
| `gradient:` | — | `c1-c2` | full opacity; removes border |
| `neon:` | — | color | needs 6-digit hex or palette name for the glow |
| `border:` | — | color · `none` | all four sides |
| `border-width:` | `bw:` | number or length | unitless is treated as px |
| `border-style:` | `bs:` | `solid` `dashed` `dotted` `double` … | any CSS keyword passes through |
| `radius:` | — | number or length | unitless is treated as px |
| `font:` | — | `mono` `serif` `sans` `hand` `marker` | others ignored |
| `font-size:` | — | `1`–`5` | 3 is default |
| `icon:` | — | Lucide id | |
| `icon-color:` | `iconcolor:` | color | overrides the colour taken from `title:` |
| `no-icon` | `noicon` | flag | beats `icon:` |
| `center` | — | flag | beats `title:center` |
| `compact` | `padding:0` | flag | padding only |
| `dense` | — | flag | compact + tighter line-height |
| `col:` | `column:` | integer | lists only |
| `N:M` / `N:M:R` | `,` `/` separators | bare token | only M matters |
| `style:` | — | preset name | applied before inline params |
| *(layout name)* | — | bare word | on `multi-callout` wrappers |

## Silently ignored input

Nothing in the plugin reports an error. These all render as if you had written less:

- metadata that is not the first thing after `]`
- unbalanced parentheses
- the pipe form `[!note|bg:red]`
- a `font:` value outside the five names
- a `font-size:` outside 1–5, or non-numeric
- a `col:` that is not a number
- a `style:` or layout name with no saved match
- a `padding:` value other than `0`
- an unknown key of any kind
- a key with nothing after the colon, such as `bg:`
- a hex code with a missing `#` (it resolves to itself and CSS drops it)

A preset name containing a colon is no longer among them either: `style:Note: Important`
keeps the whole name. Up to v1.0.8 it was cut at the first colon and matched nothing.

Units are no longer among them: `border-width:4` and `border-width:4px` both work, as do
`radius:20` and `radius:20px`. Up to v1.0.7 the second form of each produced `4pxpx` and was
dropped.

When output looks under-styled, the fastest diagnosis is to remove parameters one at a time
until the missing effect appears.
