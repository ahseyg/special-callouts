# Special Callouts — Complete Usage Guide

Everything you need to know about using Special Callouts in Obsidian. From basic styling to advanced dashboard layouts with Dataview integration.

---

## Table of Contents

- [Basic Syntax](#-basic-syntax)
- [Colors & Backgrounds](#-colors--backgrounds)
- [Typography](#-typography)
- [Borders & Shapes](#-borders--shapes)
- [Visual Effects](#-visual-effects)
- [Text Readability Borders](#-text-readability-borders)
- [Layout: Center & Compact](#-layout-center--compact)
- [Multi-Column Lists](#-multi-column-lists)
- [Dataview Integration](#-dataview-integration)
- [Grid Layout (Multi-Callout)](#-grid-layout-multi-callout)
- [Custom Style Presets](#-custom-style-presets)
- [Settings Panel Overview](#%EF%B8%8F-settings-panel-overview)
- [Command Palette](#-command-palette)
- [Tips & Tricks](#-tips--tricks)
- [Troubleshooting](#-troubleshooting)

---

## Basic Syntax

Add parameters inside parentheses `( )` right after the callout type:

```markdown
> [!note] (param1:value1, param2:value2) Your Title
> Your content here...
```

**Key rules:**
- Parameters go inside `( )` before the title text
- Multiple parameters are separated by commas `,`
- Parameter names are case-insensitive
- You can use named colors (`red`, `blue`) or hex codes (`#ff0000`)

**Simplest example:**
```markdown
> [!note] (bg:blue, text:white) Hello World
> This is a blue callout with white text.
```

---

## Colors & Backgrounds

### Background Color — `bg:`

```markdown
> [!note] (bg:red) Named Color
> Using a predefined color name.

> [!note] (bg:#2ecc71) Hex Color
> Using a hex color code.
```

**Available named colors:**
| Name | Hex | Preview |
|------|-----|---------|
| `red` | `#e74c3c` | 🔴 |
| `blue` | `#3498db` | 🔵 |
| `green` | `#2ecc71` | 🟢 |
| `yellow` | `#f1c40f` | 🟡 |
| `orange` | `#e67e22` | 🟠 |
| `purple` | `#9b59b6` | 🟣 |
| `pink` | `#e84393` | 💗 |
| `teal` | `#1abc9c` | 🩵 |
| `grey`/`gray` | `#95a5a6` | ⚪ |

> You can also define your own custom color names in **Settings → Colors → Custom Colors**.

### Text Color — `text:`

```markdown
> [!note] (bg:#2c3e50, text:#ecf0f1) Dark Background
> Light text for readability on dark backgrounds.
```

### Title Color — `title:`

```markdown
> [!note] (bg:#1a1a2e, title:#e94560, text:#eee) Custom Title
> The title above is red, content text is light gray.
```

### Link Color — `link:`

```markdown
> [!note] (bg:#2c3e50, text:white, link:orange) Links
> Visit [[My Page]] or [Google](https://google.com) — links appear orange.
```

### Gradient Background — `gradient:`

Two colors separated by a dash `-`:

```markdown
> [!tip] (gradient:blue-purple, text:white) Blue to Purple
> Smooth gradient background.

> [!tip] (gradient:#667eea-#764ba2, text:white) Hex Gradient
> Using hex codes for precise colors.

> [!tip] (gradient:#11998e-#38ef7d, text:white) Green Gradient
> Fresh green tones.
```

---

## Typography

### Font Family — `font:`

| Value | Style | Best For |
|-------|-------|----------|
| `mono` | `Monospace` | Code, terminals, data |
| `serif` | `Serif` | Formal text, articles |
| `sans` | `Sans-serif` | Clean, modern look |
| `hand` | `Handwritten` | Sticky notes, casual |
| `marker` | `Marker/Bold` | Headers, emphasis |

```markdown
> [!note] (font:mono, bg:#0f0e17, text:#00ff41) Terminal
> $ npm install special-callouts
> $ echo "Ready!"

> [!note] (font:hand, bg:#f1c40f, text:#2c3e50, no-icon) Sticky Note
> Don't forget to buy milk!

> [!note] (font:serif, bg:#fdf2e9, text:#6c3483) Elegant
> A refined, classic serif appearance.
```

### Font Size — `font-size:`

Scale from `1` (smallest) to `5` (largest). Default is `3`.

```markdown
> [!info] (font-size:1) Size 1 — Tiny text
> For footnotes or fine print.

> [!info] (font-size:3) Size 3 — Default
> Normal reading size.

> [!info] (font-size:5) Size 5 — Huge text
> For big headers or emphasis.
```

---

## Borders & Shapes

### Border Color — `border:`

```markdown
> [!note] (border:red) Red Border
> Replaces the default left border with a full red border.

> [!note] (border:none) No Border
> Completely removes all borders.
```

### Border Width — `border-width:`

Value in pixels:
```markdown
> [!note] (border:#3498db, border-width:4) Thick Border
> 4px blue border on all sides.
```

### Border Style — `border-style:`

| Value | Look |
|-------|------|
| `solid` | ── (default) |
| `dashed` | - - - |
| `dotted` | · · · |
| `double` | ═══ |

```markdown
> [!warning] (border:#e74c3c, border-style:dashed, border-width:2) Dashed
> Dashed red border.

> [!note] (border:#3498db, border-style:dotted, border-width:2) Dotted
> Dotted blue border.

> [!note] (border:#2ecc71, border-style:double, border-width:3) Double
> Double green border.
```

### Corner Radius — `radius:`

Value in pixels (0 = sharp corners, 30+ = pill shape):

```markdown
> [!note] (radius:0, bg:#e74c3c, text:white) Sharp Corners
> No rounding at all.

> [!note] (radius:20, bg:#3498db, text:white) Rounded
> Nicely rounded corners.

> [!note] (radius:50, bg:#9b59b6, text:white) Pill Shape
> Maximum rounding for a capsule look.
```

---

## Visual Effects

### Neon Glow — `neon:`

Adds a colored glowing border + box-shadow:

```markdown
> [!danger] (neon:#ff0000, bg:#1a0000, text:#ff6b6b) Red Neon
> Glowing red border with shadow.

> [!info] (neon:#00f2ff, bg:#0a0a1a, text:#00f2ff) Cyan Neon
> Futuristic cyber glow.

> [!tip] (neon:#00ff88, bg:#001a0e, text:#00ff88) Green Neon
> Matrix-style green glow.
```

> **Pro tip:** Neon works best on dark backgrounds. Use a dark `bg:` color for maximum effect.

### Hide Icon — `no-icon`

```markdown
> [!note] (no-icon, bg:#f1c40f, text:black) No Icon
> The default callout icon is hidden.
```

---

## Text Readability Borders

When text color is similar to the background, add a stroke border for readability:

### Basic Usage

```markdown
> [!note] (bg:#e74c3c, text:dark-border) Dark Stroke
> Text has a dark outline for contrast on red.
```

### Grouped Syntax — Combine Color + Border

Use parentheses to set both color and border in one parameter:

```markdown
> [!note] (bg:#e74c3c, text:(white, dark-border)) Grouped
> White text with dark stroke — very readable!

> [!note] (bg:#2c3e50, text:(cyan, light-border)) Light Stroke
> Cyan text with light stroke on dark background.
```

### Available for All Text Elements

| Target | Parameter | Example |
|--------|-----------|---------|
| Content text | `text:` | `text:(white, dark-border)` |
| Title | `title:` | `title:(yellow, dark-border)` |
| Links | `link:` | `link:(orange, light-border)` |

---

## Layout: Center & Compact

### Center — `center`

Centers both the title and content:

```markdown
> [!tip] (center, bg:#2ecc71, text:white) Centered
> Everything is aligned to the center.
> Great for quotes, announcements, or highlight boxes.
```

### Title Center Only — `title:center`

Centers only the title, content stays left-aligned:

```markdown
> [!quote] (title:center, bg:#2d3436, text:#dfe6e9, title:#74b9ff) Centered Title
> The title is centered but this content flows normally.
> Useful for formal or document-style layouts.
```

### Compact — `compact`

Reduces padding for a dense, widget-like appearance:

```markdown
> [!info] (compact, bg:#3498db, text:white) Compact
> Minimal padding. Perfect for dashboards.

> [!warning] (compact, bg:#e67e22, text:white) Dense Warning
> Takes less vertical space.
```

> **Dashboard tip:** Combine `compact` with `multi-callout` grids for information-dense dashboards.

---

## Multi-Column Lists

Split bullet or numbered lists into newspaper-style columns using `col:N`:

### Basic Usage

```markdown
> [!note] (col:2) Two Columns
> - Item 1
> - Item 2
> - Item 3
> - Item 4
> - Item 5
```

Result: Items flow **top-to-bottom, then left-to-right** (newspaper style).
5 items with `col:2` → Column 1: Items 1,2,3 | Column 2: Items 4,5

### Three Columns

```markdown
> [!note] (col:3, bg:#2c3e50, text:#ecf0f1) Tech Stack
> - React
> - Vue
> - Angular
> - Svelte
> - Next.js
> - Nuxt
> - Remix
> - Astro
> - SolidJS
```

### With Tasks

```markdown
> [!todo] (col:2, bg:#1a1a2e, text:#a29bfe) Project Tasks
> - [x] Design mockup
> - [x] Setup project
> - [ ] Build frontend
> - [ ] API integration
> - [ ] Testing
> - [ ] Deployment
```

---

## Dataview Integration

Special Callouts works seamlessly with [Dataview](https://github.com/blacksmithgu/obsidian-dataview) plugin. You can pull dynamic data and display it in multi-column layouts.

### Task Lists from Dataview

Pull tasks from your vault and display them in columns:

````markdown
> [!todo] (col:2, bg:#1a1a2e, text:#a29bfe, title:#00cec9) 📋 Active Tasks
> ```dataview
> TASK
> FROM "Projects"
> WHERE !completed
> LIMIT 20
> ```
````

### Grouped Lists

Pull lists from multiple sources:

````markdown
> [!note] (col:3, bg:#2d3436, text:#dfe6e9) Reading List
> ```dataview
> LIST
> FROM #book AND #to-read
> SORT file.name ASC
> ```
````

### How It Works Technically

- The column engine uses **CSS Grid** for reliable distribution
- A **retry mechanism** (100ms → 2s, 5 attempts) ensures columns work even when Dataview loads content asynchronously
- A **MutationObserver** watches for dynamically added content and re-applies the column layout
- Works with: `ul`, `ol`, `.dataview`, `.block-language-dataview`, grouped Dataview lists

> **Important:** If you use the Homepage plugin, the retry mechanism ensures columns work on your home page too, even on first load.

---

## Grid Layout (Multi-Callout)

Create side-by-side callout layouts using the `[!multi-callout]` wrapper.

### Basic 2-Column Grid

```markdown
> [!multi-callout]
> > [!info] (1:2) Left Panel
> > Content for the left side.
>
> > [!tip] (2:2) Right Panel
> > Content for the right side.
```

### 3-Column Grid

```markdown
> [!multi-callout]
> > [!info] (1:3, bg:#3498db, text:white) Stats
> > Users: 1,234
>
> > [!success] (2:3, bg:#2ecc71, text:white) Revenue
> > $12,345
>
> > [!warning] (3:3, bg:#e67e22, text:white) Alerts
> > 3 pending
```

### Grid Syntax

| Syntax | Meaning |
|--------|---------|
| `(1:2)` | Position 1 of 2 columns (left half) |
| `(2:2)` | Position 2 of 2 columns (right half) |
| `(1:3)` | Position 1 of 3 columns (left third) |
| `(2:3:2)` | Position 2, 3 columns, row 2 |

### Multi-Row Dashboard

```markdown
> [!multi-callout]
> > [!note] (1:3, bg:#0f0e17, text:#a7a9be, font:mono, neon:#00f2ff, compact) CPU
> > Usage: 45%
>
> > [!note] (2:3, bg:#0f0e17, text:#a7a9be, font:mono, neon:#ff6bcb, compact) RAM
> > Usage: 6.2 GB
>
> > [!note] (3:3, bg:#0f0e17, text:#a7a9be, font:mono, neon:#ffd93d, compact) Disk
> > Free: 128 GB
```

### Mobile Responsive

On screens smaller than 600px, grid columns automatically stack vertically.

---

## Custom Style Presets

### Creating Presets

1. Open **Settings → Special Callouts**
2. In the **Custom Callouts** section, configure your style:
   - Set name, icon, colors, fonts, borders, effects
   - Use the **Live Preview** to see changes in real-time
3. Click **Save**

### Using Presets

**Method 1: Direct callout type**
```markdown
> [!my-custom-style]
> This uses the "my-custom-style" preset directly.
```

**Method 2: Style parameter on any callout**
```markdown
> [!note] (style:my-custom-style) My Title
> Apply any preset to any standard callout type.
```

### Sharing Presets

- **Export:** Click the Export button in settings — copies JSON to clipboard
- **Import:** Click Import and paste the JSON

---

## Settings Panel Overview

The plugin settings panel has four main sections:

### 1. Quick Actions
Two buttons at the top:
- **How to Use** — Opens usage instructions modal
- **Metadata Reference** — Opens full parameter reference modal

### 2. Custom Callouts
- **Quick Start Presets:** One-click templates (Ocean Deep, Neon Glow, Forest, Sunset)
- **Random:** Generate a random unique style instantly
- **Live Preview:** See your callout in real-time as you edit
- **Identity:** Style name + icon picker (with fuzzy search)
- **Palette:** Background, border, title, text, and link colors with hex inputs and color pickers
- **Effects:** Neon glow toggle with color picker
- **Typography:** Font family dropdown + font size selector
- **Structure:** Border style, thickness slider, corner radius slider
- **Layout Modes:** Compact mode toggle, hide icon toggle
- **Import/Export:** Share styles as JSON

### 3. Standard Callouts
Modify the default appearance of Obsidian's built-in callout types (note, info, warning, etc.):
- Grid or List view
- Click to edit background, title, and text colors
- Reset to defaults anytime

### 4. Colors
- **Standard Colors:** Edit the hex values of named colors (red, blue, green...)
- **Custom Colors:** Add your own named colors to use anywhere (e.g., `brand-blue → #1a73e8`)

---

## Command Palette

Press `Ctrl/Cmd + P` and search for:

| Command | Description |
|---------|-------------|
| `Insert Custom Callout` | Browse all saved custom styles and insert one |
| `Insert "[style-name]" callout` | Directly insert a specific custom style |
| `Show Metadata Reference` | Open the parameter reference modal |

> You can assign **hotkeys** to any of these commands in Settings → Hotkeys → Special Callouts.

---

## Tips & Tricks

### Combine Multiple Parameters
```markdown
> [!note] (bg:#0f0e17, text:#a7a9be, font:mono, neon:#ff6bcb, radius:12, compact, title:#ff6bcb) Full Power
> Use as many parameters as you need!
```

### Dataview Dashboard Pattern
````markdown
> [!multi-callout]
> > [!todo] (1:2, col:2, compact, bg:#1a1a2e, text:#dfe6e9) Tasks
> > ```dataview
> > TASK FROM "Projects" WHERE !completed LIMIT 10
> > ```
>
> > [!note] (2:2, col:2, compact, bg:#1a1a2e, text:#dfe6e9) Reading
> > ```dataview
> > LIST FROM #book AND #to-read LIMIT 10
> > ```
````

### Sticky Note Style
```markdown
> [!note] (bg:#f1c40f, text:black, font:hand, radius:0, no-icon, compact) 
> Quick reminder!
```

### Code Terminal
```markdown
> [!note] (bg:#0f0e17, text:#00ff41, font:mono, border:none, title:#00ff41) ~/terminal
> $ git status
> $ git add .
> $ git commit -m "feat: new feature"
```

### Warning Banner
```markdown
> [!danger] (center, bg:#e74c3c, text:white, font-size:4, neon:#ff0000, radius:0) WARNING
> This action cannot be undone!
```

---

## Troubleshooting

### Columns not appearing on page load
**Cause:** Dataview or Homepage plugin loads content asynchronously.
**Solution:** The plugin includes a retry mechanism (5 attempts from 100ms to 2s). If columns still don't appear, try switching to a different note and back.

### Multi-callout grid not working in Reading Mode
**Solution:** This was fixed in v1.0.1. Make sure you're using the latest version.

### Gradient + border issue
**Note:** When using `gradient:`, the border is automatically set to `none`. This is by design to prevent visual artifacts. If you need a border with gradients, add `border:color` after the gradient parameter.

### Custom style not appearing
**Check:**
1. Style name doesn't contain spaces (use hyphens: `my-style`)
2. Plugin is enabled
3. Settings were saved (click Save button)

---

## Contributing & Bug Reports

This plugin is **open source**! We welcome contributions, bug reports, and feature requests.

- **Bug Reports:** [Open an issue on GitHub](https://github.com/ahseyg/special-callouts/issues)
- **Feature Requests:** Same link — we'd love to hear your ideas!
- **Pull Requests:** Fork the repo, make your changes, and submit a PR

When reporting a bug, please include:
1. Your Obsidian version
2. The callout markdown that causes the issue
3. A screenshot if possible
4. Whether the issue occurs in Edit mode, Reading mode, or both
