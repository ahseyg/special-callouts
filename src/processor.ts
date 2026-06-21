/**
 * Special Callouts - Callout Processor
 * Core logic for processing and styling callouts
 * 
 * IMPORTANT: Before modifying this file, read RULES.md for mandatory protocols.
 */

import { CalloutStyle, CalloutConfig, SpecialCalloutsSettings } from './types';
import { DEFAULT_STANDARD_STYLES, FONT_FAMILIES, FONT_SIZES } from './constants';
import { resolveColor, applyTextBorder, debounce } from './utils';
import { parseMetadata, parseGridLayout, extractMetadata } from './parser';
import { setIcon } from 'obsidian';

/**
 * CalloutProcessor handles all callout styling operations
 */
export class CalloutProcessor {
    private settings: SpecialCalloutsSettings;
    private observers: Map<HTMLElement, MutationObserver> = new Map();
    private processedElements: WeakMap<HTMLElement, string> = new WeakMap();
    private debouncedColumnApply: (container: HTMLElement, colCount: number) => void;

    constructor(settings: SpecialCalloutsSettings) {
        this.settings = settings;
        this.debouncedColumnApply = debounce((container: HTMLElement, colCount: number) => {
            this.applyColumnsToContainer(container, colCount);
        }, 50);
    }

    /**
     * Updates the settings reference
     */
    updateSettings(settings: SpecialCalloutsSettings): void {
        this.settings = settings;
    }

    /**
     * Main entry point for processing a callout element
     */
    processCallout(calloutEl: HTMLElement): void {
        try {
            const titleEl = calloutEl.querySelector('.callout-title');
            if (!titleEl) return;

            const innerTitleEl = titleEl.querySelector('.callout-title-inner') || titleEl;
            const fullText = innerTitleEl.textContent || '';
            const cacheKey = `${calloutEl.getAttribute('data-callout')}_${fullText}`;

            // Skip if already processed with same content
            if (this.processedElements.get(calloutEl) === cacheKey) return;
            this.processedElements.set(calloutEl, cacheKey);

            const calloutType = calloutEl.getAttribute('data-callout');

            // Apply standard style if modified
            this.applyStandardStyleIfModified(calloutEl, calloutType);

            // Apply custom style by type name
            this.applyCustomStyleByType(calloutEl, calloutType);

            // Parse and apply metadata
            this.processMetadata(calloutEl, innerTitleEl as HTMLElement, fullText);
        } catch (error) {
            console.error('Special Callouts: Error processing callout', error);
        }
    }

    /**
     * Applies standard style if user has modified it
     */
    private applyStandardStyleIfModified(calloutEl: HTMLElement, calloutType: string | null): void {
        if (!calloutType) return;

        const standardStyle = this.settings.standardStyles[calloutType.toLowerCase()];
        const defaultStyle = DEFAULT_STANDARD_STYLES[calloutType.toLowerCase()];

        if (standardStyle && defaultStyle) {
            const isModified = standardStyle.bg !== defaultStyle.bg ||
                standardStyle.text !== defaultStyle.text ||
                standardStyle.titleColor !== defaultStyle.titleColor ||
                standardStyle.link !== defaultStyle.link;

            if (isModified) {
                this.applyStyleObject(calloutEl, standardStyle);
            }
        }
    }

    /**
     * Applies custom style if callout type matches a custom style name
     */
    private applyCustomStyleByType(calloutEl: HTMLElement, calloutType: string | null): void {
        if (!calloutType) return;

        const typeStyle = this.settings.customStyles.find(
            s => s.name.toLowerCase() === calloutType.toLowerCase()
        );
        if (typeStyle) {
            this.applyStyleObject(calloutEl, typeStyle);
        }
    }

    /**
     * Processes inline metadata from callout title
     */
    private processMetadata(calloutEl: HTMLElement, innerTitleEl: HTMLElement, fullText: string): void {
        const extracted = extractMetadata(fullText);
        if (!extracted) return;

        // Update title text
        if (innerTitleEl.textContent !== extracted.title) {
            innerTitleEl.textContent = extracted.title;
        }

        // Extract custom layout names
        const layoutNames = (this.settings.customLayouts || []).map(l => l.name);

        // Parse metadata
        const { config, layoutParam, styleParam } = parseMetadata(
            extracted.content,
            this.settings.standardColors,
            this.settings.customColors,
            layoutNames
        );

        // Apply style parameter first
        if (styleParam) {
            const manualStyle = this.settings.customStyles.find(
                s => s.name.toLowerCase() === styleParam
            );
            if (manualStyle) {
                this.applyStyleObject(calloutEl, manualStyle);
            }
        }

        // Apply parsed configuration
        this.applyConfig(calloutEl, config);

        // Handle grid layout
        if (layoutParam) {
            const gridConfig = parseGridLayout(layoutParam);
            if (gridConfig && gridConfig.columns > 0) {
                this.applyGridLayout(calloutEl, gridConfig);
            }
        }

        // AI_CONTEXT: Removed advanced grid and flex logic (flex, gridCols, gridW, gridH, vertical)
        // These were undocumented and caused complexity. The visual builder handles complex layouts now.

        // Handle column layout for lists
        if (config.col !== null) {
            calloutEl.setAttribute('data-col', config.col.toString());
            calloutEl.setCssProps({ '--smart-list-cols': config.col.toString() });
            this.applyColumnsToContainer(calloutEl, config.col);
            this.setupObserver(calloutEl, config.col);
            // AI_CONTEXT: Retry mechanism required because Dataview/Homepage plugins load content asynchronously
            // AI_CONTEXT_WARN: Do NOT remove - columns won't work on initial page load without this
            this.scheduleColumnRetry(calloutEl, config.col);
        }

        // Handle custom visual layout
        if (config.customLayout) {
            const layout = this.settings.customLayouts.find(l => l.name.toLowerCase() === config.customLayout);
            if (layout) {
                this.applyCustomLayoutAreas(calloutEl, layout);
            }
        }
    }

    /**
     * Applies configuration to callout element
     */
    private applyConfig(calloutEl: HTMLElement, config: CalloutConfig): void {
        if (config.bg) {
            this.applyColor(calloutEl, config.bg);
        }

        if (config.text) {
            this.applyTextColor(calloutEl, config.text);
        }

        if (config.textBorder) {
            const content = calloutEl.querySelector('.callout-content');
            if (content) applyTextBorder(content as HTMLElement, config.textBorder);
        }

        if (config.link) {
            this.applyLinkColor(calloutEl, config.link);
        }

        if (config.linkBorder) {
            calloutEl.setAttribute('data-link-border', config.linkBorder);
        }

        if (config.titleColor) {
            // Set CSS custom property; .callout[data-sc-title-color] rule in styles.css applies it
            calloutEl.setCssProps({ '--sc-title-color': config.titleColor });
            calloutEl.setAttribute('data-sc-title-color', '');
        }

        if (config.titleBorder) {
            const title = calloutEl.querySelector('.callout-title');
            if (title) applyTextBorder(title as HTMLElement, config.titleBorder);
        }

        if (config.noIcon) {
            const icon = calloutEl.querySelector('.callout-icon');
            if (icon) (icon as HTMLElement).addClass('sc-hidden');
        } else if (config.icon) {
            let iconEl = calloutEl.querySelector('.callout-icon');
            if (!iconEl) {
                // AI_CONTEXT: Eger icon elementi yoksa (bazı temalar/ayarlar) baslıgın basına ekliyoruz
                const titleEl = calloutEl.querySelector('.callout-title');
                if (titleEl) {
                    iconEl = titleEl.createDiv({ cls: 'callout-icon' });
                    titleEl.prepend(iconEl);
                }
            }
            if (iconEl) {
                (iconEl as HTMLElement).empty();
                setIcon(iconEl as HTMLElement, config.icon);
                (iconEl as HTMLElement).removeClass('sc-hidden');
            }
        }

        if (config.border) {
            if (config.border === 'none') {
                calloutEl.setAttribute('data-sc-no-border', '');
            } else {
                const style = config.borderStyle || 'solid';
                calloutEl.setCssProps({ '--sc-border': `1px ${style} ${config.border}` });
                calloutEl.setAttribute('data-sc-border', '');
            }
        }

        if (config.borderWidth) {
            calloutEl.setCssProps({ '--sc-border-width': config.borderWidth + 'px' });
            calloutEl.setAttribute('data-sc-bw', '');
        }

        if (config.borderStyle && !config.border) {
            calloutEl.setCssProps({ '--sc-border-style': config.borderStyle });
            calloutEl.setAttribute('data-sc-bs', '');
        }

        if (config.radius) {
            calloutEl.setCssProps({ '--sc-radius': config.radius + 'px' });
            calloutEl.setAttribute('data-sc-radius', '');
        }

        if (config.neon) {
            calloutEl.setCssProps({
                '--sc-neon-border': `2px solid ${config.neon}`,
                '--sc-neon-shadow': `0 0 8px 2px ${config.neon}40, inset 0 0 8px 2px ${config.neon}20`
            });
            calloutEl.setAttribute('data-sc-neon', '');
        }

        if (config.gradient) {
            this.applyGradient(calloutEl, config.gradient);
        }

        if (config.font && FONT_FAMILIES[config.font]) {
            calloutEl.setCssProps({ '--font-interface': FONT_FAMILIES[config.font], '--sc-font-family': FONT_FAMILIES[config.font] });
            calloutEl.setAttribute('data-sc-font', '');
        }

        if (config.fontSize && FONT_SIZES[config.fontSize]) {
            calloutEl.setCssProps({ '--sc-font-size': FONT_SIZES[config.fontSize] });
            calloutEl.setAttribute('data-sc-fontsize', '');
        }

        // AI_CONTEXT: Compact mode reduces padding throughout the callout
        // AI_CONTEXT_WHY: Users want denser callouts for dashboards/lists
        // AI_CONTEXT_WARN: Must set padding on callout, title, AND content elements
        // AI_CONTEXT_WARN: Also sets data-compact attribute for CSS fallback
        if (config.compact) {
            // CSS class .callout[data-compact="true"] in styles.css handles all padding overrides
            calloutEl.setAttribute('data-compact', 'true');
        }

        // AI_CONTEXT: Center mode aligns everything to the center
        if (config.center) {
            // CSS .callout[data-center="true"] in styles.css handles all alignment overrides
            calloutEl.setAttribute('data-center', 'true');
        } else if (config.titleCenter) {
            calloutEl.setAttribute('data-title-center', 'true');
        }
    }

    /**
     * Applies gradient background
     */
    private applyGradient(calloutEl: HTMLElement, gradient: string): void {
        const colors = gradient.split('-');
        if (colors.length === 2) {
            const c1 = resolveColor(colors[0], this.settings.standardColors, this.settings.customColors);
            const c2 = resolveColor(colors[1], this.settings.standardColors, this.settings.customColors);
            // Use CSS var + data attribute; .callout[data-sc-gradient] rule in styles.css applies it
            calloutEl.setCssProps({ '--sc-gradient': `linear-gradient(90deg, ${c1}, ${c2})` });
            calloutEl.setAttribute('data-sc-gradient', '');
            calloutEl.setAttribute('data-sc-no-border', '');
        }
    }

    /**
     * Gets the direct wrapper of the callout under .callout-content,
     * which handles the nested blockquote issue.
     */
    private getDirectWrapper(calloutEl: HTMLElement): HTMLElement {
        let current: HTMLElement | null = calloutEl;
        let parent = current.parentElement;
        
        // Traverse up until the parent is .callout-content
        while (parent && !parent.classList.contains('callout-content')) {
            current = parent;
            parent = parent.parentElement;
        }
        
        return current || calloutEl;
    }

    /**
     * Neutralizes blockquote wrapper styles to fix the "purple line" bug
     */
    private neutralizeWrapper(wrapper: HTMLElement): void {
        if (wrapper.tagName === 'BLOCKQUOTE') {
            wrapper.addClass('sc-wrapper-bq');
        } else if (wrapper.tagName === 'P') {
            wrapper.addClass('sc-wrapper-p');
        }
    }

    /**
     * Applies grid layout to callout
     */
    private applyGridLayout(calloutEl: HTMLElement, gridConfig: { position: number; columns: number; row: number }): void {
        const gap = 10;
        const widthCalc = `calc((100% - ${(gridConfig.columns - 1) * gap}px) / ${gridConfig.columns})`;

        const wrapper = this.getDirectWrapper(calloutEl);
        this.neutralizeWrapper(wrapper);

        // Use CSS custom property + class; .sc-grid-item-wrapper rule in styles.css applies flex/width
        wrapper.setCssProps({ '--sc-flex-width': widthCalc });
        wrapper.addClass('sc-grid-item-wrapper');

        if (wrapper !== calloutEl) {
            calloutEl.setCssProps({ '--sc-callout-width': '100%' });
            calloutEl.addClass('sc-area-inner');
        }

        calloutEl.setAttribute('data-grid-pos', gridConfig.position.toString());
        calloutEl.setAttribute('data-grid-cols', gridConfig.columns.toString());
        calloutEl.setAttribute('data-grid-row', gridConfig.row.toString());
    }

    /**
     * Applies visually built custom layouts from settings using grid-template-areas
     */
    private applyCustomLayoutAreas(calloutEl: HTMLElement, layout: import('./types').CustomLayout): void {
        const content = calloutEl.querySelector('.callout-content');
        if (!content) return;

        // Set CSS custom properties; .callout[data-sc-custom-layout] rule in styles.css drives the grid
        calloutEl.setCssProps({
            '--sc-grid-cols': `repeat(${layout.cols}, 1fr)`,
            '--sc-grid-areas': layout.gridAreas
        });
        calloutEl.setAttribute('data-sc-custom-layout', '');

        this.setupCustomLayoutObserver(calloutEl);
        this.applyAreasToChildren(content as HTMLElement);
    }
    
    private setupCustomLayoutObserver(calloutEl: HTMLElement): void {
        const contentEl = calloutEl.querySelector('.callout-content');
        if (!contentEl) return;
        
        const observer = new MutationObserver(() => {
            this.applyAreasToChildren(contentEl as HTMLElement);
        });
        
        observer.observe(contentEl, { childList: true });
        
        // Clean up previous observer if exists
        if (this.observers.has(calloutEl)) {
            this.observers.get(calloutEl)?.disconnect();
        }
        this.observers.set(calloutEl, observer);
    }
    
    private applyAreasToChildren(contentEl: HTMLElement): void {
        const children = Array.from(contentEl.children);

        let areaIndex = 1;
        children.forEach(child => {
            const el = child as HTMLElement;

            // Skip structural/empty nodes inserted by Markdown rendering
            if (el.tagName === 'BR' || el.tagName === 'HR') return;
            if (el.tagName === 'P') {
                const html = el.innerHTML.trim();
                if (html === '' || html === '<br>') return;
            }

            this.neutralizeWrapper(el);
            // CSS var + class; .sc-area-child rule in styles.css sets grid-area, flex, etc.
            el.setCssProps({ '--sc-grid-area': `area${areaIndex}` });
            el.addClass('sc-area-child');

            const innerCallout = el.classList.contains('callout') ? el : el.querySelector('.callout');
            if (innerCallout) {
                // .sc-area-inner in styles.css sets flex:1, width:100%, etc.
                (innerCallout as HTMLElement).addClass('sc-area-inner');
            }

            areaIndex++;
        });
    }

    /**
     * Applies a style object to callout
     */
    applyStyleObject(calloutEl: HTMLElement, style: CalloutStyle): void {
        this.applyColor(calloutEl, style.bg);
        this.applyTextColor(calloutEl, style.text);
        this.applyLinkColor(calloutEl, style.link);

        if (style.border) {
            const width = style.borderWidth ?
                (style.borderWidth.endsWith('px') ? style.borderWidth : style.borderWidth + 'px') :
                (style.boldBorder ? '4px' : '1px');

            const bStyle = style.borderStyle || 'solid';
            // CSS var + data attr; .callout[data-sc-border] in styles.css applies with !important
            calloutEl.setCssProps({ '--sc-border': `${width} ${bStyle} ${style.border}` });
            calloutEl.setAttribute('data-sc-border', '');
        }

        if (style.titleColor) {
            calloutEl.setCssProps({ '--sc-title-color': style.titleColor });
            calloutEl.setAttribute('data-sc-title-color', '');
        }

        if (style.font && FONT_FAMILIES[style.font]) {
            calloutEl.setCssProps({ '--font-interface': FONT_FAMILIES[style.font], '--sc-font-family': FONT_FAMILIES[style.font] });
            calloutEl.setAttribute('data-sc-font', '');
        }

        if (style.fontSize && FONT_SIZES[style.fontSize]) {
            calloutEl.setCssProps({ '--sc-font-size': FONT_SIZES[style.fontSize] });
            calloutEl.setAttribute('data-sc-fontsize', '');
        }

        // Advanced Borders
        if (style.borderWidth) calloutEl.setCssProps({ '--callout-border-width': style.borderWidth });
        if (style.borderStyle) {
            calloutEl.setCssProps({ '--sc-border-style': style.borderStyle });
            calloutEl.setAttribute('data-sc-bs', '');
        }
        if (style.borderRadius) {
            calloutEl.setCssProps({ '--sc-radius': style.borderRadius });
            calloutEl.setAttribute('data-sc-radius', '');
        }

        // Layout & Effects
        if (style.noIcon) {
            calloutEl.classList.add('no-icon');
            const icon = calloutEl.querySelector('.callout-icon');
            if (icon) (icon as HTMLElement).addClass('sc-hidden');
        } else if (style.icon) {
            let iconEl = calloutEl.querySelector('.callout-icon');
            if (!iconEl) {
                const titleEl = calloutEl.querySelector('.callout-title');
                if (titleEl) {
                    iconEl = titleEl.createDiv({ cls: 'callout-icon' });
                    titleEl.prepend(iconEl);
                }
            }
            if (iconEl) {
                (iconEl as HTMLElement).empty();
                setIcon(iconEl as HTMLElement, style.icon);
                (iconEl as HTMLElement).removeClass('sc-hidden');
            }
        }

        if (style.compact) {
            // CSS .callout[data-compact="true"] in styles.css handles all padding overrides
            calloutEl.setAttribute('data-compact', 'true');
        }

        if (style.center) {
            calloutEl.setAttribute('data-center', 'true');
        } else if (style.titleCenter) {
            calloutEl.setAttribute('data-title-center', 'true');
        }

        if (style.neon) {
            calloutEl.setCssProps({
                '--sc-neon-border': `2px solid ${style.neon}`,
                '--sc-neon-shadow': `0 0 10px ${style.neon}, inset 0 0 5px ${style.neon}20`
            });
            calloutEl.setAttribute('data-sc-neon', '');
        }
    }

    /**
     * Applies background color
     */
    applyColor(callout: HTMLElement, color: string): void {
        // CSS var + data attr; .callout[data-sc-bg] rule in styles.css applies !important
        callout.setCssProps({ '--sc-bg-color': `color-mix(in srgb, ${color} 15%, transparent)` });
        callout.setAttribute('data-sc-bg', '');
    }

    /**
     * Applies text color
     */
    applyTextColor(callout: HTMLElement, color: string): void {
        // CSS var + data attr; .callout[data-sc-text] > .callout-content rule in styles.css applies it
        callout.setCssProps({ '--sc-text-color': color });
        callout.setAttribute('data-sc-text', '');
    }

    /**
     * Applies link color
     */
    applyLinkColor(callout: HTMLElement, color: string): void {
        callout.setAttribute('data-link-color', color);
        callout.setCssProps({ '--link-color': color });
    }

    /**
     * Applies column layout to list containers using CSS Grid
     * 
     * AI_CONTEXT: Uses CSS Grid instead of CSS Columns for reliable distribution.
     * AI_CONTEXT_WHY: CSS Columns with column-fill has unpredictable behavior.
     *                 Grid with manual row calculation gives exact control.
     * AI_CONTEXT_WARN: Do NOT switch back to CSS columns - they don't work reliably.
     * AI_CONTEXT_SIDE_EFFECT: Changes list display to grid, sets grid-row on each li.
     * 
     * Distribution: Items flow top-to-bottom, then left-to-right (newspaper style)
     * Formula: rowCount = Math.ceil(itemCount / colCount)
     * Example: 7 items, 2 cols -> 4 rows -> Col1: 1,2,3,4  Col2: 5,6,7
     */
    applyColumnsToContainer(container: HTMLElement, colCount: number): void {
        window.requestAnimationFrame(() => {
            const contentEl = container.querySelector('.callout-content');
            if (!contentEl) return;

            const lists = contentEl.querySelectorAll('ul, ol, .dataview.list-view-ul, .dataview-result-list-ul, .dataview ul, .block-language-dataview ul, .cm-embed-block ul, .cm-embed-block ol, .markdown-rendered ul, .markdown-rendered ol');

            lists.forEach(list => {
                const listEl = list as HTMLElement;
                const items = listEl.querySelectorAll(':scope > li, :scope > .list-item');
                const itemCount = items.length;

                if (itemCount === 0) return;

                const rowCount = Math.ceil(itemCount / colCount);

                // CSS class + vars; .sc-multi-col-list rule in styles.css sets display:grid etc.
                listEl.setCssProps({
                    '--sc-list-cols': colCount.toString(),
                    '--sc-list-rows': rowCount.toString()
                });
                listEl.addClass('sc-multi-col-list');

                items.forEach((li, index) => {
                    const liEl = li as HTMLElement;
                    const col = Math.floor(index / rowCount) + 1;
                    const row = (index % rowCount) + 1;

                    liEl.setCssProps({ '--sc-col': col.toString(), '--sc-row': row.toString() });
                    liEl.addClass('sc-multi-col-item');
                });
            });
        });
    }

    /**
     * Schedules retry attempts for column layout (handles Dataview/Homepage delayed rendering)
     * 
     * AI_CONTEXT: Dataview and Homepage plugins render content asynchronously after initial page load.
     *             Without retry, columns won't apply when page first opens.
     * AI_CONTEXT_WHY: MutationObserver alone isn't enough - sometimes content is already there but
     *                 not fully rendered. Multiple retries at increasing intervals ensure we catch it.
     * AI_CONTEXT_WARN: Do NOT remove retry delays or reduce them significantly.
     *                  2000ms final delay is intentional for slow Dataview queries.
     * AI_CONTEXT_SIDE_EFFECT: Creates 5 setTimeout calls per col:X callout. Minimal performance impact.
     */
    private scheduleColumnRetry(calloutEl: HTMLElement, colCount: number): void {
        const retryDelays = [100, 300, 600, 1000, 2000];

        retryDelays.forEach(delay => {
            window.setTimeout(() => {
                const contentEl = calloutEl.querySelector('.callout-content');
                if (!contentEl) return;

                const lists = contentEl.querySelectorAll('ul, ol, .dataview.list-view-ul, .dataview-result-list-ul, .dataview ul, .block-language-dataview ul, .cm-embed-block ul, .cm-embed-block ol, .markdown-rendered ul, .markdown-rendered ol');
                if (lists.length > 0) {
                    this.applyColumnsToContainer(calloutEl, colCount);
                }
            }, delay);
        });
    }

    /**
     * Sets up mutation observer for dynamic content
     */
    setupObserver(calloutEl: HTMLElement, colCount: number): void {
        if (this.observers.has(calloutEl)) {
            this.observers.get(calloutEl)?.disconnect();
        }

        const contentEl = calloutEl.querySelector('.callout-content');
        if (!contentEl) return;

        const observer = new MutationObserver((mutations) => {
            let update = false;
            mutations.forEach(m => {
                if (m.addedNodes.length > 0) {
                    m.addedNodes.forEach(n => {
                        if (n.nodeType === 1) {
                            const el = n as Element;
                            if (el.matches('ul,ol,.dataview,.cm-embed-block,.markdown-rendered') || el.querySelector('ul,ol,.dataview,.cm-embed-block,.markdown-rendered')) {
                                update = true;
                            }
                        }
                    });
                }
                // Text change inside could mean dataview re-rendered
                if (m.type === 'characterData') update = true;
            });
            if (update) this.debouncedColumnApply(calloutEl, colCount);
        });

        observer.observe(contentEl, { childList: true, subtree: true, characterData: true });
        this.observers.set(calloutEl, observer);
    }

    /**
     * Cleans up all observers
     */
    cleanup(): void {
        this.observers.forEach(o => o.disconnect());
        this.observers.clear();
    }
}
