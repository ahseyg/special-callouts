/**
 * Special Callouts - Suggester Modal
 * Modal for selecting custom callout styles
 */

import { App, SuggestModal } from 'obsidian';
import { CalloutStyle } from '../types';

/**
 * Modal for selecting and inserting custom callout styles
 */
export class CustomCalloutSuggester extends SuggestModal<CalloutStyle> {
    private styles: CalloutStyle[];
    private editor: any;

    constructor(app: App, styles: CalloutStyle[], editor: any) {
        super(app);
        this.styles = styles;
        this.editor = editor;
        this.setPlaceholder('Select a custom callout style...');
    }

    getSuggestions(query: string): CalloutStyle[] {
        return this.styles.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    renderSuggestion(style: CalloutStyle, el: HTMLElement): void {
        el.createDiv({ text: style.name, cls: 'suggestion-title' });
        el.createDiv({
            text: `${style.bg} • ${style.icon}`,
            cls: 'suggestion-note'
        });
    }

    onChooseSuggestion(style: CalloutStyle): void {
        const cursor = this.editor.getCursor();
        const calloutText = `> [!${style.name}]\n> `;
        this.editor.replaceRange(calloutText, cursor);
        this.editor.setCursor({ line: cursor.line + 1, ch: 2 });
    }
}
