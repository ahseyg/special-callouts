/**
 * Special Callouts - How To Use Modal
 * Shows usage instructions
 */

/**
 * Creates and displays the how to use modal
 */
export function showHowToUse(): void {
    const modal = document.createElement('div');
    modal.style.cssText = 'position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 12px; padding: 2rem; max-width: 650px; max-height: 80vh; overflow-y: auto; z-index: 10000; box-shadow: 0 8px 32px rgba(0,0,0,0.3);';

    const title = modal.createEl('h2', { text: 'How to Use Custom Styles' });
    title.style.cssText = 'margin: 0 0 1.5rem 0; font-size: 1.4rem;';

    const content = modal.createDiv();
    content.innerHTML = `
        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.75rem 0; color: var(--interactive-accent);">⌨️ Quick Insert via Command Palette</h3>
            <p style="margin: 0 0 0.5rem 0;">Press <code style="background: var(--background-modifier-border); padding: 2px 6px; border-radius: 3px;">Ctrl/Cmd+P</code> and type:</p>
            <ul style="margin: 0; padding-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;"><strong>"Insert Custom Callout"</strong> - Browse all your saved styles</li>
                <li><strong>"Insert [style-name]"</strong> - Directly insert a specific style</li>
            </ul>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.75rem 0; color: var(--interactive-accent);">📝 Manual Usage Methods</h3>
            
            <div style="margin-bottom: 1rem; padding: 1rem; background: var(--background-secondary); border-radius: 6px;">
                <strong>Method 1: Direct callout type</strong><br>
                <code style="background: var(--background-modifier-border); padding: 2px 6px; border-radius: 3px;">> [!your-style-name]</code>
            </div>
            
            <div style="margin-bottom: 1rem; padding: 1rem; background: var(--background-secondary); border-radius: 6px;">
                <strong>Method 2: With metadata</strong><br>
                <code style="background: var(--background-modifier-border); padding: 2px 6px; border-radius: 3px;">> [!note] (style:your-style-name)</code>
            </div>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.75rem 0; color: var(--interactive-accent);">📐 Layout Systems</h3>
            <p style="margin: 0 0 0.5rem 0; font-size: 0.9em;"><strong>1. Inline Grid (Simple):</strong> Quick alignments using <code style="background: var(--background-modifier-border); padding: 2px 4px; border-radius: 3px;">(position:cols)</code></p>
            <code style="background: var(--background-modifier-border); padding: 2px 6px; border-radius: 3px; display: block; margin-bottom: 1rem;">> [!multi-callout]<br>> > [!info] (1:2)<br>> > [!tip] (2:2)</code>
            
            <p style="margin: 0 0 0.5rem 0; font-size: 0.9em;"><strong>2. Visual Layout Builder (Advanced):</strong> Create Excel-like merged grids in settings, then use their name!</p>
            <code style="background: var(--background-modifier-border); padding: 2px 6px; border-radius: 3px; display: block;">> [!multi-callout] (my_dashboard)<br>> > [!info]<br>> > [!tip]</code>
        </div>

        <div style="margin-bottom: 1.5rem;">
            <h3 style="margin: 0 0 0.75rem 0; color: var(--interactive-accent);">💡 Pro Tips</h3>
            <ul style="margin: 0; padding-left: 1.5rem;">
                <li style="margin-bottom: 0.5rem;">Use <code style="background: var(--background-modifier-border); padding: 2px 4px; border-radius: 3px;">(title:red)</code> to override title color</li>
                <li style="margin-bottom: 0.5rem;">Try <code style="background: var(--background-modifier-border); padding: 2px 4px; border-radius: 3px;">(no-icon)</code> for a minimalist look</li>
                <li>Click "Metadata Reference" to see all available parameters</li>
            </ul>
        </div>

        <div style="background: linear-gradient(135deg, #667eea 15%, #764ba2 85%); padding: 1rem; border-radius: 6px; color: white;">
            <strong>⚡ Quick Tip:</strong> Assign hotkeys to your favorite styles in Settings → Hotkeys → Special Callouts
        </div>
    `;

    const closeBtn = modal.createEl('button', { text: 'Got it!' });
    closeBtn.style.cssText = 'margin-top: 1.5rem; padding: 0.6rem 1.5rem; background: var(--interactive-accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; width: 100%;';
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
