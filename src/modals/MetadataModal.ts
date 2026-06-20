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
        exampleBox.setCssStyles({ 'background': 'var(--background-primary-alt)' });
        exampleBox.setCssStyles({ 'padding': '1rem' });
        exampleBox.setCssStyles({ 'borderRadius': '8px' });
        exampleBox.setCssStyles({ 'border': '1px solid var(--background-modifier-border)' });
        exampleBox.setCssStyles({ 'marginBottom': '1rem' });
        exampleBox.createEl('strong', { text: '💡 Example:' }).setCssStyles({ 'color': 'var(--text-accent)' });
        exampleBox.createEl('br');
        const exCode = exampleBox.createEl('code', {
            text: '(bg:#1a1a2e, text:(white, dark-border), neon:#00f2ff, radius:10)',
        });
        exCode.setCssStyles({ 'display': 'block' });
        exCode.setCssStyles({ 'marginTop': '0.5rem' });
        exCode.setCssStyles({ 'padding': '0.5rem' });
        exCode.setCssStyles({ 'background': 'var(--background-secondary)' });
        exCode.setCssStyles({ 'borderRadius': '4px' });

        // Pro tip box
        const tipBox = contentEl.createDiv();
        tipBox.setCssStyles({ 'background': 'var(--background-primary-alt)' });
        tipBox.setCssStyles({ 'padding': '1rem' });
        tipBox.setCssStyles({ 'borderRadius': '8px' });
        tipBox.setCssStyles({ 'border': '1px solid var(--background-modifier-border)' });
        tipBox.createEl('strong', { text: 'Pro Tip: ' }).setCssStyles({ 'color': 'var(--text-accent)' });
        tipBox.appendText('Use ');
        tipBox.createEl('code', { text: 'Ctrl/Cmd+P' });
        tipBox.appendText(' to open the command palette and type "Special Callouts" to see all available commands.');
        tipBox.setCssStyles({ 'marginBottom': '1rem' });

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
        section.setCssStyles({ 'marginBottom': '2rem' });

        const h3 = section.createEl('h3', { text: title });
        h3.setCssStyles({ 'margin': '0 0 1rem 0' });
        h3.setCssStyles({ 'fontWeight': '600' });
        h3.setCssStyles({ 'borderBottom': '2px solid var(--interactive-accent)' });
        h3.setCssStyles({ 'paddingBottom': '0.5rem' });

        const table = section.createEl('table');
        table.setCssStyles({ 'width': '100%' });
        table.setCssStyles({ 'borderCollapse': 'collapse' });
        table.setCssStyles({ 'fontSize': '0.9rem' });

        rows.forEach(([param, desc], i) => {
            const tr = table.createEl('tr');
            const isLast = i === rows.length - 1;

            const td1 = tr.createEl('td');
            td1.setCssStyles({ 'padding': '10px 0' });
            td1.setCssStyles({ 'width': '45%' });
            td1.setCssStyles({ 'color': 'var(--code-normal)' });
            if (!isLast) td1.setCssStyles({ 'borderBottom': '1px solid var(--background-modifier-border)' });
            td1.createEl('code', { text: param });

            const td2 = tr.createEl('td');
            td2.setCssStyles({ 'padding': '10px 0' });
            td2.setCssStyles({ 'color': 'var(--text-muted)' });
            if (!isLast) td2.setCssStyles({ 'borderBottom': '1px solid var(--background-modifier-border)' });
            td2.setText(desc);
        });
    }
}
