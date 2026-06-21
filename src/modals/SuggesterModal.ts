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
        el.addClass('sc-suggester-item');

        const swatch = el.createDiv();
        swatch.addClass('sc-suggester-swatch');
        swatch.setCssProps({
            '--sc-swatch-bg': style.bg || 'var(--interactive-accent)',
            '--sc-swatch-border': `2px solid ${style.border || style.bg || 'var(--background-modifier-border)'}`,
        });

        const info = el.createDiv();
        info.addClass('sc-suggester-info');

        const nameEl = info.createDiv({ text: style.name });
        nameEl.addClass('sc-suggester-name');

        const metaEl = info.createDiv();
        const parts: string[] = [];
        if (style.bg) parts.push(`bg: ${style.bg}`);
        if (style.neon) parts.push('neon');
        if (style.compact) parts.push('compact');
        if (style.noIcon) parts.push('no-icon');
        metaEl.textContent = parts.length > 0 ? parts.join(' · ') : 'Custom Style';
        metaEl.addClass('sc-suggester-meta');
    }

    onChooseSuggestion(style: CalloutStyle): void {
        this.onSelect(style);
    }
}
