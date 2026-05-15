/**
 * Special Callouts - Metadata Reference Modal
 * Shows all available metadata parameters
 */

/**
 * Creates and displays the metadata reference modal
 */
export function showMetadataReference(): void {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: var(--background-primary);
        border: 1px solid var(--background-modifier-border);
        border-radius: 16px;
        padding: 2.5rem;
        max-width: 700px;
        width: 90%;
        max-height: 85vh;
        overflow-y: auto;
        z-index: 10000;
        box-shadow: 0 20px 60px -20px rgba(0,0,0,0.5);
    `;

    const title = modal.createEl('h2', { text: 'Metadata Reference' });
    title.style.cssText = 'margin: 0 0 2rem 0; font-size: 1.8rem; font-weight: 700; color: var(--text-normal); letter-spacing: -0.02em;';

    const content = modal.createDiv();
    content.innerHTML = `
        <div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-weight: 600; border-bottom: 2px solid var(--interactive-accent); padding-bottom: 0.5rem;">🎨 Colors</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); width: 45%; color: var(--code-normal);"><code>bg:red</code> or <code>bg:#ff0000</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Background color</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>text:white</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Content text color</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>title:cyan</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Title text color</td></tr>
                <tr><td style="padding: 10px 0; color: var(--code-normal);"><code>link:orange</code></td><td style="padding: 10px 0; color: var(--text-muted);">Link color</td></tr>
            </table>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-weight: 600; border-bottom: 2px solid var(--interactive-accent); padding-bottom: 0.5rem;">Aa Typography</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); width: 45%; color: var(--code-normal);"><code>font:mono</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Monospace font</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>font:serif</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Serif font</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>font:hand</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Handwritten style</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>font-size:1</code> to <code>5</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Font size (3 is default)</td></tr>
                <tr><td style="padding: 10px 0; color: var(--code-normal);"><code>text:dark-border</code></td><td style="padding: 10px 0; color: var(--text-muted);">Dark outline on text</td></tr>
            </table>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-weight: 600; border-bottom: 2px solid var(--interactive-accent); padding-bottom: 0.5rem;">✨ Text Border (Readability)</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); width: 45%; color: var(--code-normal);"><code>text:dark-border</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Dark outline on text</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>text:light-border</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Light outline on text</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>text:(white, dark-border)</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Grouped: color + border</td></tr>
                <tr><td style="padding: 10px 0; color: var(--code-normal);"><code>title:(cyan, dark-border)</code></td><td style="padding: 10px 0; color: var(--text-muted);">Same for title</td></tr>
            </table>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-weight: 600; border-bottom: 2px solid var(--interactive-accent); padding-bottom: 0.5rem;">🎨 Effects</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); width: 45%; color: var(--code-normal);"><code>neon:#00f2ff</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Neon border with glow</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>gradient:blue-purple</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">2-color gradient background</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>border:red</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Border color</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>border:none</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Remove all borders</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>border-width:4</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Border thickness (px)</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>border-style:dashed</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">dashed, dotted, double, solid</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>radius:20</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Corner roundness (px)</td></tr>
                <tr><td style="padding: 10px 0; color: var(--code-normal);"><code>no-icon</code></td><td style="padding: 10px 0; color: var(--text-muted);">Hide the callout icon</td></tr>
            </table>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-weight: 600; border-bottom: 2px solid var(--interactive-accent); padding-bottom: 0.5rem;">📊 Layout</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); width: 45%; color: var(--code-normal);"><code>col:3</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Multi-column list (inside callout)</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>compact</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Reduce padding (dense mode)</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>center</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Center title and content</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>title:center</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Center title only</td></tr>
                <tr><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--code-normal);"><code>1:3</code></td><td style="padding: 10px 0; border-bottom: 1px solid var(--background-modifier-border); color: var(--text-muted);">Grid: position 1 of 3 columns</td></tr>
                <tr><td style="padding: 10px 0; color: var(--code-normal);"><code>1:3:2</code></td><td style="padding: 10px 0; color: var(--text-muted);">Grid: pos 1, 3 cols, row 2</td></tr>
            </table>
        </div>

        <div style="margin-bottom: 2rem;">
            <h3 style="margin: 0 0 1rem 0; font-weight: 600; border-bottom: 2px solid var(--interactive-accent); padding-bottom: 0.5rem;">⚡ Presets</h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 0.9rem;">
                <tr><td style="padding: 10px 0; width: 45%; color: var(--code-normal);"><code>style:my-style</code></td><td style="padding: 10px 0; color: var(--text-muted);">Apply saved custom style</td></tr>
            </table>
        </div>

        <div style="background: var(--background-primary-alt); padding: 1rem; border-radius: 8px; border: 1px solid var(--background-modifier-border); margin-bottom: 1rem;">
            <strong style="color: var(--text-accent);">💡 Example:</strong><br>
            <code style="display: block; margin-top: 0.5rem; padding: 0.5rem; background: var(--background-secondary); border-radius: 4px;">(bg:#1a1a2e, text:(white, dark-border), neon:#00f2ff, radius:10)</code>
        </div>

        <div style="background: var(--background-primary-alt); padding: 1rem; border-radius: 8px; border: 1px solid var(--background-modifier-border);">
            <strong style="color: var(--text-accent);">Pro Tip:</strong> Use <code>Ctrl/Cmd+P</code> and type "Insert Custom Callout" to quickly access your styles.
        </div>
    `;

    const closeBtn = modal.createEl('button', { text: 'Close' });
    closeBtn.style.cssText = `
        margin-top: 2rem;
        padding: 0.8rem 1.5rem;
        background: var(--interactive-accent);
        color: white;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
        width: 100%;
        transition: opacity 0.2s ease;
    `;
    closeBtn.onmouseover = () => closeBtn.style.opacity = '0.9';
    closeBtn.onmouseout = () => closeBtn.style.opacity = '1';
    closeBtn.onclick = () => {
        modal.remove();
        overlay.remove();
    };

    const overlay = document.createElement('div');
    overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(4px); z-index: 9999;';
    overlay.onclick = () => {
        modal.remove();
        overlay.remove();
    };

    document.body.appendChild(overlay);
    document.body.appendChild(modal);
}
