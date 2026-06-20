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
        el.setCssStyles({'display': 'flex',
            'alignItems': 'center',
            'gap': '12px',
            'padding': '8px 12px',
        });

        const iconContainer = el.createDiv();
        iconContainer.setCssProps({
            'width': '24px',
            'height': '24px',
            'display': 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'color': 'var(--text-muted)',
        });

        setIcon(iconContainer, icon);

        const textDiv = el.createDiv({ text: icon });
        textDiv.setCssStyles({'fontSize': '0.9rem' });
    }

    onChooseItem(icon: string, _evt: MouseEvent | KeyboardEvent): void {
        this.onChoose(icon);
    }
}
