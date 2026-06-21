/**
 * Special Callouts - How To Use Modal
 * Shows usage instructions using Obsidian's safe Modal API
 */

import { App, Modal } from 'obsidian';

/**
 * Creates and displays the how to use modal
 */
export function showHowToUse(app: App): void {
    new HowToModal(app).open();
}

class HowToModal extends Modal {
    constructor(app: App) {
        super(app);
        this.titleEl.setText('How to Use Custom Styles');
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();

        // Section: Command Palette
        this.createSection(contentEl, '⌨️ Quick Insert via Command Palette', (section) => {
            section.createEl('p', {
                text: 'Press Ctrl/Cmd+P and type:',
            });
            const ul = section.createEl('ul');
            const li1 = ul.createEl('li');
            li1.createEl('strong', { text: '"Insert Custom Callout"' });
            li1.appendText(' - Browse all your saved styles');
            
            const li2 = ul.createEl('li');
            li2.createEl('strong', { text: '"Insert [style-name]"' });
            li2.appendText(' - Directly insert a specific style');
        });

        // Section: Manual Usage
        this.createSection(contentEl, '📝 Manual Usage Methods', (section) => {
            this.createMethodBox(section, 'Method 1: Direct callout type', '> [!your-style-name]');
            this.createMethodBox(section, 'Method 2: With metadata', '> [!note] (style:your-style-name)');
        });

        // Section: Layout Systems
        this.createSection(contentEl, '📐 Layout Systems', (section) => {
            const p1 = section.createEl('p');
            p1.createEl('strong', { text: '1. Inline Grid (Simple):' });
            p1.appendText(' Quick alignments using ');
            p1.createEl('code', { text: '(position:cols)' });

            const code1 = section.createEl('code');
            code1.addClass('sc-block');
            code1.addClass('sc-mb-1');
            code1.setText('> [!multi-callout]\n> > [!info] (1:2)\n> > [!tip] (2:2)');

            const p2 = section.createEl('p');
            p2.createEl('strong', { text: '2. Visual Layout Builder (Advanced):' });
            p2.appendText(' Create Excel-like merged grids in settings, then use their name!');

            section.createEl('code', { text: '> [!multi-callout] (my_dashboard)\n> > [!info]\n> > [!tip]' });
        });

        // Section: Pro Tips
        this.createSection(contentEl, '💡 Pro Tips', (section) => {
            const ul = section.createEl('ul');
            const tip1 = ul.createEl('li');
            tip1.appendText('Use ');
            tip1.createEl('code', { text: '(title:red)' });
            tip1.appendText(' to override title color');

            const tip2 = ul.createEl('li');
            tip2.appendText('Try ');
            tip2.createEl('code', { text: '(no-icon)' });
            tip2.appendText(' for a minimalist look');

            ul.createEl('li', { text: 'Click "Metadata Reference" to see all available parameters' });
        });

        // Tip banner
        const banner = contentEl.createDiv();
        banner.addClass('sc-modal-banner');
        banner.createEl('strong', { text: '⚡ Quick Tip: ' });
        banner.appendText('Assign hotkeys to your favorite styles in Settings → Hotkeys → Special Callouts');
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private createSection(container: HTMLElement, title: string, fill: (el: HTMLElement) => void): void {
        const section = container.createDiv();
        section.addClass('sc-mb-1-5');
        const h3 = section.createEl('h3', { text: title });
        h3.addClass('sc-modal-h3');
        fill(section);
    }

    private createMethodBox(container: HTMLElement, label: string, code: string): void {
        const box = container.createDiv();
        box.addClass('sc-modal-method-box');
        box.createEl('strong', { text: label });
        box.createEl('br');
        box.createEl('code', { text: code });
    }
}
