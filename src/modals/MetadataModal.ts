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
        // Example box
        const exampleBox = contentEl.createDiv();
        exampleBox.addClass('sc-modal-info-box');
        exampleBox.createEl('strong', { text: '💡 Example:' }).addClass('sc-text-accent');
        exampleBox.createEl('br');
        const exCode = exampleBox.createEl('code', {
            text: '(bg:#1a1a2e, text:(white, dark-border), neon:#00f2ff, radius:10)',
        });
        exCode.addClass('sc-modal-code-block');

        // Pro tip box
        const tipBox = contentEl.createDiv();
        tipBox.addClass('sc-modal-info-box');
        tipBox.createEl('strong', { text: 'Pro Tip: ' }).addClass('sc-text-accent');
        tipBox.appendText('Use ');
        tipBox.createEl('code', { text: 'Ctrl/Cmd+P' });
        tipBox.appendText(' to open the command palette and type "Special Callouts" to see all available commands.');

        // Available Modifiers Table
        this.createTable(contentEl, '🎨 Style & Colors', [
            ['bg:color', 'Background color (hex or named)'],
            ['text:color', 'Text color'],
            ['border:color', 'Border color (or "none")'],
            ['neon:color', 'Glowing border effect'],
            ['radius:10', 'Corner radius in pixels'],
            ['title:color', 'Title color'],
        ]);

        this.createTable(contentEl, '📐 Layout & Structure', [
            ['col:2', 'Split content into 2 columns'],
            ['col:3', 'Split content into 3 columns'],
            ['center', 'Center align all text'],
            ['no-icon', 'Hide the callout icon'],
        ]);
    }

    onClose(): void {
        this.contentEl.empty();
    }

    private createTable(container: HTMLElement, title: string, rows: [string, string][]): void {
        const section = container.createDiv();
        section.addClass('sc-modal-section');

        const h3 = section.createEl('h3', { text: title });
        h3.addClass('sc-modal-section-title');

        const table = section.createEl('table');
        table.addClass('sc-modal-table');

        rows.forEach(([param, desc], i) => {
            const tr = table.createEl('tr');
            const isLast = i === rows.length - 1;

            const td1 = tr.createEl('td');
            td1.addClass('sc-modal-table-td1');
            if (!isLast) td1.addClass('sc-modal-table-row-border');
            td1.createEl('code', { text: param });

            const td2 = tr.createEl('td');
            td2.addClass('sc-modal-table-td2');
            if (!isLast) td2.addClass('sc-modal-table-row-border');
            td2.setText(desc);
        });
    }
}
