/**
 * Special Callouts - Icon Picker Modal
 * Fuzzy search modal for selecting icons
 */

import { App, FuzzySuggestModal, getIconIds, setIcon } from 'obsidian';

export class IconPickerModal extends FuzzySuggestModal<string> {
    onChoose: (icon: string) => void;

    constructor(app: App, onChoose: (icon: string) => void) {
        super(app);
        this.onChoose = onChoose;
        this.setPlaceholder('Search for an icon... (e.g. star, pencil, flame)');
    }

    getItems(): string[] {
        return getIconIds();
    }

    getItemText(icon: string): string {
        return icon;
    }

    renderSuggestion(match: { item: string }, el: HTMLElement): void {
        const icon = match.item;
        el.addClass('mod-icon-item');
        el.style.display = 'flex';
        el.style.alignItems = 'center';
        el.style.gap = '12px';
        el.style.padding = '8px 12px';

        const iconContainer = el.createDiv();
        iconContainer.style.width = '24px';
        iconContainer.style.height = '24px';
        iconContainer.style.display = 'flex';
        iconContainer.style.alignItems = 'center';
        iconContainer.style.justifyContent = 'center';
        iconContainer.style.color = 'var(--text-muted)';

        setIcon(iconContainer, icon);

        const textDiv = el.createDiv({ text: icon });
        textDiv.style.fontSize = '0.9rem';
    }

    onChooseItem(icon: string, evt: MouseEvent | KeyboardEvent): void {
        this.onChoose(icon);
    }
}
