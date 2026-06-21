<p align="center">
  <a href="https://community.obsidian.md/plugins/special-callouts"><img src="https://img.shields.io/badge/Obsidian-Install-7c3aed?logo=obsidian&logoColor=white" alt="Install from Obsidian"/></a>
  <img src="https://img.shields.io/github/stars/ahseyg/special-callouts?style=flat&color=3498db" alt="Stars"/>
  <img src="https://img.shields.io/github/issues/ahseyg/special-callouts?style=flat&color=e74c3c" alt="Issues"/>
  <img src="https://img.shields.io/github/license/ahseyg/special-callouts?style=flat&color=2ecc71" alt="License"/>
  <img src="https://img.shields.io/github/v/release/ahseyg/special-callouts?style=flat&color=f39c12" alt="Version"/>
</p>

<p align="center">
  <a href="USAGE_GUIDE.md">Usage Guide</a> · <a href="README_TR.md">Türkçe</a> · <a href="https://github.com/ahseyg/special-callouts/issues">Report Bug</a> · <a href="https://github.com/ahseyg/special-callouts/issues">Request Feature</a>
</p>

# Special Callouts for Obsidian

Transform your Obsidian notes with premium, dynamic, and fully customizable callouts. Turn generic boxes into magazine-quality layouts, code terminals, or neon-glowing alerts. Customize everything directly from your markdown — or create reusable presets in the visual settings panel.

**Open source** · MIT License · Contributions welcome

---

## Features

- **Inline customization** — background, text, border, gradient, neon, icon — directly in markdown
- **Custom style presets** — design once, reuse by name
- **Multi-column lists** — split any list into 2–4 columns
- **Visual layout builder** — drag-and-merge grid designer
- **Typography control** — 5 font families, 5 size scales
- **Neon and gradient effects** — glowing borders, smooth color transitions
- **Dataview integration** — column layouts work with Dataview queries
- **Import/Export** — share styles as JSON between vaults

---

## Quick Start

### Inline Parameters

Add parameters inside parentheses right after the callout type:

```markdown
> [!note] (bg:#2ecc71, text:white) Hello World
> This is a green callout with white text.
```

### Custom Presets

Create a style in **Settings → Special Callouts**, name it (e.g., `terminal`), and use it anywhere:

```markdown
> [!terminal]
> System ready.
> Waiting for command...
```

Or apply it to any standard callout:

```markdown
> [!info] (style:terminal)
> This info box now looks like a terminal.
```

---

## Screenshots

### Colors, Gradients and Effects

![Colors & Backgrounds](assets/colors_backgrounds.png)

![Gradients](assets/gradients.png)

![Neon Glow Effects](assets/neon_glow_effects.png)

### Visual Layout Builder

Design complex dashboard grids by dragging and merging cells — no code required. Access from **Settings → Special Callouts → Visual Layout Builder**.

![Visual Builder Settings](assets/visual_builder_settings.png)

### Dashboard Grids

Use the visual builder or inline grid syntax to create multi-panel layouts. Callouts are automatically placed into the merged areas you designed.

![Ultimate Dashboard Grid](assets/ultimate_dashboard.png)

### Typography and Borders

![Typography & Fonts](assets/typography_fonts.png)

![Border Styles](assets/border_styles.png)

### Multi-Column Lists

![Standard Columns](assets/standard_columns.png)

---

## Examples

### Gradients

```markdown
> [!tip] (gradient:#667eea-#764ba2, text:white) Purple Gradient
> Separate two colors with a hyphen.
```

### Multi-Column

```markdown
> [!note] (col:3, bg:#2c3e50, text:#ecf0f1) Skills
> - HTML     - TypeScript
> - CSS      - React
> - JS       - Node.js
```

### Grid Layout

```markdown
> [!multi-callout]
> > [!info] (1:2, bg:#3498db, text:white) Left Panel
> > Content here.
>
> > [!tip] (2:2, bg:#2ecc71, text:white) Right Panel
> > Content here.
```

### Neon Glow

```markdown
> [!danger] (neon:#ff0000, bg:#1a0000, text:#ff6b6b) Alert
> Glowing border and box-shadow. Best on dark backgrounds.
```

See the [Usage Guide](USAGE_GUIDE.md) for all examples and parameters.

---

## Metadata Reference

`> [!type] (param:value, param2:value2) Title`

### Colors
| Parameter | Example | Description |
| :--- | :--- | :--- |
| `bg` | `bg:#ff0000` | Background color |
| `text` | `text:white` | Content text color |
| `title` | `title:cyan` | Title and icon color |
| `link` | `link:orange` | Link color |
| `gradient` | `gradient:blue-purple` | Two-color gradient |
| `neon` | `neon:#00f2ff` | Neon border + glow |
| `icon` | `icon:sun` | Lucide icon name |
| `no-icon` | `(no-icon)` | Hide icon |

### Borders
| Parameter | Example | Description |
| :--- | :--- | :--- |
| `border` | `border:red` | Border color |
| `border-width` | `border-width:4` | Thickness (px) |
| `border-style` | `border-style:dashed` | `solid`, `dashed`, `dotted`, `double` |
| `radius` | `radius:20` | Corner roundness (px) |

### Typography
| Parameter | Example | Description |
| :--- | :--- | :--- |
| `font` | `font:mono` | `mono`, `serif`, `sans`, `hand`, `marker` |
| `font-size` | `font-size:4` | `1` (tiny) → `5` (huge) |

### Layout
| Parameter | Example | Description |
| :--- | :--- | :--- |
| `col` | `(col:3)` | Multi-column lists |
| `center` | `(center)` | Center content |
| `compact` | `(compact)` | Reduce padding |
| Grid | `(1:2)` | Position in grid |

Full reference in the [Usage Guide](USAGE_GUIDE.md).

---

## Installation

### Community Plugins (Recommended)

1. **Settings → Community Plugins**
2. Turn off Restricted Mode
3. Browse → search **Special Callouts**
4. Install → Enable

Or open directly: [community.obsidian.md/plugins/special-callouts](https://community.obsidian.md/plugins/special-callouts)

### Manual

1. Download `main.js`, `styles.css`, `manifest.json` from the [latest release](https://github.com/ahseyg/special-callouts/releases)
2. Create `VaultFolder/.obsidian/plugins/special-callouts/`
3. Copy the files into the folder
4. Enable in Settings → Community Plugins

---

## Contributing

- **Bug reports:** [Open an issue](https://github.com/ahseyg/special-callouts/issues) — include Obsidian version, callout markdown, and a screenshot
- **Feature requests:** [Open an issue](https://github.com/ahseyg/special-callouts/issues)
- **Pull requests:** Fork → Branch → Code → PR

If you find this plugin useful, consider giving it a [star](https://github.com/ahseyg/special-callouts).

---

## License

MIT — See [LICENSE](LICENSE) for details.

---
<p align="center">
  Developed by <a href="https://github.com/ahseyg">ahseyg</a>
</p>
