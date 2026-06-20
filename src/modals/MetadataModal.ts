/**
 * Special Callouts - Metadata Reference Modal
 * Shows all available metadata parameters using Obsidian's safe Modal API
 */

import { App, Modal } from 'obsidian';

/**
 * Creates and displays the metadata reference modal
 */
export function showMetadataReference(app: App): void {
    new MetadataReferenceModal(app).open();
}

class MetadataReferenceModal extends Modal {
    constructor(app: App) {
        super(app);
        this.titleEl.setText('Metadata Reference');
    }

    onOpen(): void {
        const { contentEl } = this;
        contentEl.empty();
        contentEl.addClass('sc-metadata-modal');

        // Colors
        this.createTable(contentEl, '🎨 Colors', [
            ['bg:red or bg:#ff0000', 'Background color'],
            ['text:white', 'Content text color'],
            ['title:cyan', 'Title text color'],
            ['link:orange', 'Link color'],
        ]);

        // Typography
        this.createTable(contentEl, 'Aa Typography', [
            ['font:mono', 'Monospace font'],
            ['font:serif', 'Serif font'],
            ['font:hand', 'Handwritten style'],
            ['font-size:1 to 5', 'Font size (3 is default)'],
            ['text:dark-border', 'Dark outline on text'],
        ]);

        // Text Border
        this.createTable(contentEl, '✨ Text Border (Readability)', [
            ['text:dark-border', 'Dark outline on text'],
            ['text:light-border', 'Light outline on text'],
            ['text:(white, dark-border)', 'Grouped: color + border'],
            ['title:(cyan, dark-border)', 'Same for title'],
        ]);

        // Effects
        this.createTable(contentEl, '🎨 Effects', [
            ['neon:#00f2ff', 'Neon border with glow'],
            ['gradient:blue-purple', '2-color gradient background'],
            ['border:red', 'Border color'],
            ['border:none', 'Remove all borders'],
            ['border-width:4', 'Border thickness (px)'],
            ['border-style:dashed', 'dashed, dotted, double, solid'],
            ['radius:20', 'Corner roundness (px)'],
            ['no-icon', 'Hide the callout icon'],
        ]);

        // Layout
        this.createTable(contentEl, '📊 Layout', [
            ['col:3', 'Multi-column list (inside callout)'],
            ['compact', 'Reduce padding (dense mode)'],
            ['center', 'Center title and content'],
            ['title:center', 'Center title only'],
            ['1:3', 'Grid: position 1 of 3 columns'],
            ['1:3:2', 'Grid: pos 1, 3 cols, row 2'],
        ]);

        // Presets
        this.createTable(contentEl, '⚡ Presets', [
            ['style:my-style', 'Apply saved custom style'],
        ]);

        // Example box
        const exampleBox = contentEl.createDiv();
        exampleBox.style.setProperty('background', 'var(--background-primary-alt)');
        exampleBox.style.setProperty('padding', '1rem');
        exampleBox.style.setProperty('border-radius', '8px');
        exampleBox.style.setProperty('border', '1px solid var(--background-modifier-border)');
        exampleBox.style.setProperty('margin-bottom', '1rem');
        exampleBox.createEl('strong', { text: '💡 Example:' }).style.setProperty('color', 'var(--text-accent)');
        exampleBox.createEl('br');
        const exCode = exampleBox.createEl('code', {
            text: '(bg:#1a1a2e, text:(white, dark-border), neon:#00f2ff, radius:10)',
        });
        exCode.style.setProperty('display', 'block');
        exCode.style.setProperty('margin-top', '0.5rem');
        exCode.style.setProperty('padding', '0.5rem');
        exCode.style.setProperty('background', 'var(--background-secondary)');
        exCode.style.setProperty('border-radius', '4px');

        // Pro tip box
        const tipBox = contentEl.createDiv();
        tipBox.style.setProperty('background', 'var(--background-primary-alt)');
        tipBox.style.setProperty('padding', '1rem');
        tipBox.style.setProperty('border-radius', '8px');
        tipBox.style.setProperty('border', '1px solid var(--background-modifier-border)');
        tipBox.createEl('strong', { text: 'Pro Tip: ' }).style.setProperty('color', 'var(--text-accent)');
        tipBox.appendText('Use ');
        tipBox.createEl('code', { text: 'Ctrl/Cmd+P' });
        tipBox.appendText(' and type "Insert Custom Callout" to quickly access your styles.');
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private createTable(container: HTMLElement, title: string, rows: [string, string][]): void {
        const section = container.createDiv();
        section.style.setProperty('margin-bottom', '2rem');

        const h3 = section.createEl('h3', { text: title });
        h3.style.setProperty('margin', '0 0 1rem 0');
        h3.style.setProperty('font-weight', '600');
        h3.style.setProperty('border-bottom', '2px solid var(--interactive-accent)');
        h3.style.setProperty('padding-bottom', '0.5rem');

        const table = section.createEl('table');
        table.style.setProperty('width', '100%');
        table.style.setProperty('border-collapse', 'collapse');
        table.style.setProperty('font-size', '0.9rem');

        rows.forEach(([param, desc], i) => {
            const tr = table.createEl('tr');
            const isLast = i === rows.length - 1;

            const td1 = tr.createEl('td');
            td1.style.setProperty('padding', '10px 0');
            td1.style.setProperty('width', '45%');
            td1.style.setProperty('color', 'var(--code-normal)');
            if (!isLast) td1.style.setProperty('border-bottom', '1px solid var(--background-modifier-border)');
            td1.createEl('code', { text: param });

            const td2 = tr.createEl('td');
            td2.style.setProperty('padding', '10px 0');
            td2.style.setProperty('color', 'var(--text-muted)');
            if (!isLast) td2.style.setProperty('border-bottom', '1px solid var(--background-modifier-border)');
            td2.setText(desc);
        });
    }
}
