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
    private onSelect: (style: CalloutStyle) => void;

    constructor(app: App, styles: CalloutStyle[], onSelect: (style: CalloutStyle) => void) {
        super(app);
        this.styles = styles;
        this.onSelect = onSelect;
        this.setPlaceholder('Select a custom callout style...');
    }

    getSuggestions(query: string): CalloutStyle[] {
        return this.styles.filter(s =>
            s.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    renderSuggestion(style: CalloutStyle, el: HTMLElement): void {
        el.setCssProps({
            'display': 'flex',
            'align-items': 'center',
            'gap': '10px',
            'padding': '4px 0',
        });

        const swatch = el.createDiv();
        swatch.setCssProps({
            'width': '28px',
            'height': '28px',
            'border-radius': '6px',
            'flex-shrink': '0',
            'background': style.bg || 'var(--interactive-accent)',
            'border': `2px solid ${style.border || style.bg || 'var(--background-modifier-border)'}`,
        });

        const info = el.createDiv();
        info.setCssProps({ 'flex': '1', 'min-width': '0' });

        const nameEl = info.createDiv({ text: style.name });
        nameEl.setCssProps({
            'font-weight': '600',
            'font-size': '0.95rem',
            'color': 'var(--text-normal)',
        });

        const metaEl = info.createDiv();
        const parts: string[] = [];
        if (style.bg) parts.push(`bg: ${style.bg}`);
        if (style.neon) parts.push('neon');
        if (style.compact) parts.push('compact');
        if (style.noIcon) parts.push('no-icon');
        metaEl.textContent = parts.length > 0 ? parts.join(' · ') : 'Custom Style';
        metaEl.setCssProps({
            'font-size': '0.75rem',
            'color': 'var(--text-muted)',
            'white-space': 'nowrap',
            'overflow': 'hidden',
            'text-overflow': 'ellipsis',
        });
    }

    onChooseSuggestion(style: CalloutStyle): void {
        this.onSelect(style);
    }
}
