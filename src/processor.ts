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
            calloutEl.style.setProperty('--smart-list-cols', config.col.toString());
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
            const title = calloutEl.querySelector('.callout-title');
            if (title) (title as HTMLElement).style.color = config.titleColor;
            const icon = calloutEl.querySelector('.callout-icon');
            if (icon) (icon as HTMLElement).style.color = config.titleColor;
        }

        if (config.titleBorder) {
            const title = calloutEl.querySelector('.callout-title');
            if (title) applyTextBorder(title as HTMLElement, config.titleBorder);
        }

        if (config.noIcon) {
            const icon = calloutEl.querySelector('.callout-icon');
            if (icon) (icon as HTMLElement).style.display = 'none';
        }

        if (config.border) {
            if (config.border === 'none') {
                calloutEl.style.setProperty('border', 'none', 'important');
            } else {
                // Default to solid if not specified, but respect border-style if present
                const style = config.borderStyle || 'solid';
                calloutEl.style.setProperty('border', `1px ${style} ${config.border}`, 'important');
            }
        }

        if (config.borderWidth) {
            calloutEl.style.borderWidth = config.borderWidth + 'px';
        }

        if (config.borderStyle && !config.border) {
            // If style is set but color isn't, use current border color or default
            calloutEl.style.borderStyle = config.borderStyle;
        }

        if (config.radius) {
            calloutEl.style.borderRadius = config.radius + 'px';
            calloutEl.style.overflow = 'hidden';
        }

        if (config.neon) {
            const neonBorder = `2px solid ${config.neon}`;
            calloutEl.style.setProperty('border', neonBorder, 'important');
            calloutEl.style.boxShadow = `0 0 8px 2px ${config.neon}40, inset 0 0 8px 2px ${config.neon}20`;
        }

        if (config.gradient) {
            this.applyGradient(calloutEl, config.gradient);
        }

        if (config.font && FONT_FAMILIES[config.font]) {
            calloutEl.style.setProperty('--font-interface', FONT_FAMILIES[config.font]);
            calloutEl.style.setProperty('font-family', FONT_FAMILIES[config.font], 'important');
        }

        if (config.fontSize && FONT_SIZES[config.fontSize]) {
            calloutEl.style.fontSize = FONT_SIZES[config.fontSize];
            // Ensure title scales slightly differently or stays readable if needed
            const title = calloutEl.querySelector('.callout-title');
            if (title) (title as HTMLElement).style.fontSize = '1em'; // reset title relative to container
        }

        // AI_CONTEXT: Compact mode reduces padding throughout the callout
        // AI_CONTEXT_WHY: Users want denser callouts for dashboards/lists
        // AI_CONTEXT_WARN: Must set padding on callout, title, AND content elements
        // AI_CONTEXT_WARN: Also sets data-compact attribute for CSS fallback
        if (config.compact) {
            // Set data attribute for CSS fallback
            calloutEl.setAttribute('data-compact', 'true');

            // Reduce main callout padding
            calloutEl.style.setProperty('padding', '0.3em', 'important');

            // Reduce title padding
            const title = calloutEl.querySelector('.callout-title');
            if (title) {
                (title as HTMLElement).style.setProperty('padding', '0.3em 0.6em', 'important');
                (title as HTMLElement).style.setProperty('min-height', 'auto', 'important');
            }

            // Reduce content padding
            const content = calloutEl.querySelector('.callout-content');
            if (content) {
                (content as HTMLElement).style.setProperty('padding', '0.3em 0.6em', 'important');
            }
        }

        // AI_CONTEXT: Center mode aligns everything to the center
        if (config.center) {
            calloutEl.style.setProperty('text-align', 'center', 'important');
            calloutEl.style.setProperty('align-items', 'center', 'important');

            const title = calloutEl.querySelector('.callout-title');
            if (title) {
                (title as HTMLElement).style.setProperty('justify-content', 'center', 'important');
                (title as HTMLElement).style.setProperty('text-align', 'center', 'important');
            }

            const content = calloutEl.querySelector('.callout-content');
            if (content) {
                (content as HTMLElement).style.setProperty('text-align', 'center', 'important');
                // Ensure block level elements are also centered if possible
                (content as HTMLElement).style.setProperty('display', 'flex', 'important');
                (content as HTMLElement).style.setProperty('flex-direction', 'column', 'important');
                (content as HTMLElement).style.setProperty('align-items', 'center', 'important');
            }
        } else if (config.titleCenter) {
            const title = calloutEl.querySelector('.callout-title');
            if (title) {
                (title as HTMLElement).style.setProperty('justify-content', 'center', 'important');
                (title as HTMLElement).style.setProperty('text-align', 'center', 'important');
            }
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
            calloutEl.style.background = `linear-gradient(90deg, ${c1}, ${c2})`;
            calloutEl.style.border = 'none';
            calloutEl.style.color = 'white';
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
            wrapper.style.setProperty('border', 'none', 'important');
            wrapper.style.setProperty('margin', '0', 'important');
            wrapper.style.setProperty('padding', '0', 'important');
        } else if (wrapper.tagName === 'P') {
            wrapper.style.setProperty('margin', '0', 'important');
            wrapper.style.setProperty('padding', '0', 'important');
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

        wrapper.style.flex = `0 0 ${widthCalc}`;
        wrapper.style.width = widthCalc;
        wrapper.style.maxWidth = widthCalc;
        wrapper.style.setProperty('margin', '0', 'important');
        
        if (wrapper !== calloutEl) {
            // Ensure the callout itself fills the wrapper
            calloutEl.style.width = '100%';
            calloutEl.style.margin = '0';
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
        
        const contentEl = content as HTMLElement;
        contentEl.style.setProperty('display', 'grid', 'important');
        contentEl.style.setProperty('grid-template-columns', `repeat(${layout.cols}, 1fr)`, 'important');
        // Let rows be auto-sized instead of forced 1fr, prevents squishing
        contentEl.style.setProperty('grid-template-areas', layout.gridAreas, 'important');
        contentEl.style.setProperty('gap', '10px', 'important');
        contentEl.style.setProperty('align-items', 'stretch', 'important');
        
        // Setup observer to apply grid-areas to children as they render
        this.setupCustomLayoutObserver(calloutEl);
        
        // Also try immediately in case they are already rendered
        this.applyAreasToChildren(contentEl);
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
            el.style.setProperty('grid-area', `area${areaIndex}`, 'important');
            el.style.setProperty('margin', '0', 'important');
            el.style.setProperty('height', '100%', 'important'); // Force wrapper to fill grid cell
            el.style.setProperty('display', 'flex', 'important'); // Magic fix: Make wrapper flex
            el.style.setProperty('flex-direction', 'column', 'important');
            
            const innerCallout = el.classList.contains('callout') ? el : el.querySelector('.callout');
            if (innerCallout) {
                const calloutHtmlEl = innerCallout as HTMLElement;
                calloutHtmlEl.style.setProperty('width', '100%', 'important');
                calloutHtmlEl.style.setProperty('margin', '0', 'important');
                calloutHtmlEl.style.setProperty('flex', '1', 'important'); // Allow callout to grow and fill wrapper
                calloutHtmlEl.style.setProperty('display', 'flex', 'important');
                calloutHtmlEl.style.setProperty('flex-direction', 'column', 'important');
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
            // Apply border to all sides as per user preference
            const width = style.borderWidth ?
                (style.borderWidth.endsWith('px') ? style.borderWidth : style.borderWidth + 'px') :
                (style.boldBorder ? '4px' : '1px');

            const bStyle = style.borderStyle || 'solid';
            calloutEl.style.setProperty('border', `${width} ${bStyle} ${style.border}`, 'important');

            // Override border-left if it was set by defaults
            calloutEl.style.borderLeft = `${width} ${bStyle} ${style.border}`;
        }

        if (style.titleColor) {
            const title = calloutEl.querySelector('.callout-title');
            if (title) (title as HTMLElement).style.color = style.titleColor;
            const icon = calloutEl.querySelector('.callout-icon');
            if (icon) (icon as HTMLElement).style.color = style.titleColor;
        }

        if (style.font && FONT_FAMILIES[style.font]) {
            calloutEl.style.setProperty('--font-interface', FONT_FAMILIES[style.font]);
            calloutEl.style.setProperty('font-family', FONT_FAMILIES[style.font], 'important');
        }

        if (style.fontSize && FONT_SIZES[style.fontSize]) {
            calloutEl.style.fontSize = FONT_SIZES[style.fontSize];
            const title = calloutEl.querySelector('.callout-title');
            if (title) (title as HTMLElement).style.fontSize = '1em';
        }

        // Advanced Borders
        if (style.borderWidth) calloutEl.style.setProperty('--callout-border-width', style.borderWidth);
        if (style.borderStyle) calloutEl.style.borderStyle = style.borderStyle;
        if (style.borderRadius) calloutEl.style.borderRadius = style.borderRadius;

        // Layout & Effects
        if (style.noIcon) {
            calloutEl.classList.add('no-icon');
            const icon = calloutEl.querySelector('.callout-icon');
            if (icon) (icon as HTMLElement).style.display = 'none';
        }

        if (style.compact) {
            calloutEl.style.setProperty('padding', '0.3em', 'important');
            const title = calloutEl.querySelector('.callout-title');
            if (title) {
                (title as HTMLElement).style.setProperty('padding', '0.3em 0.6em', 'important');
                (title as HTMLElement).style.setProperty('min-height', 'auto', 'important');
            }
            const content = calloutEl.querySelector('.callout-content');
            if (content) {
                (content as HTMLElement).style.setProperty('padding', '0.3em 0.6em', 'important');
            }
        }

        if (style.center) {
            calloutEl.style.setProperty('text-align', 'center', 'important');
            calloutEl.style.setProperty('align-items', 'center', 'important');

            const title = calloutEl.querySelector('.callout-title');
            if (title) {
                (title as HTMLElement).style.setProperty('justify-content', 'center', 'important');
                (title as HTMLElement).style.setProperty('text-align', 'center', 'important');
            }

            const content = calloutEl.querySelector('.callout-content');
            if (content) {
                (content as HTMLElement).style.setProperty('text-align', 'center', 'important');
                (content as HTMLElement).style.setProperty('display', 'flex', 'important');
                (content as HTMLElement).style.setProperty('flex-direction', 'column', 'important');
                (content as HTMLElement).style.setProperty('align-items', 'center', 'important');
            }
        } else if (style.titleCenter) {
            const title = calloutEl.querySelector('.callout-title');
            if (title) {
                (title as HTMLElement).style.setProperty('justify-content', 'center', 'important');
                (title as HTMLElement).style.setProperty('text-align', 'center', 'important');
            }
        }

        if (style.neon) {
            calloutEl.style.boxShadow = `0 0 10px ${style.neon}, inset 0 0 5px ${style.neon}20`;
            calloutEl.style.borderColor = style.neon;
        }
    }

    /**
     * Applies background color
     */
    applyColor(callout: HTMLElement, color: string): void {
        callout.style.backgroundColor = `color-mix(in srgb, ${color} 15%, transparent)`;
    }

    /**
     * Applies text color
     */
    applyTextColor(callout: HTMLElement, color: string): void {
        const content = callout.querySelector('.callout-content');
        if (content) (content as HTMLElement).style.color = color;
    }

    /**
     * Applies link color
     */
    applyLinkColor(callout: HTMLElement, color: string): void {
        callout.setAttribute('data-link-color', color);
        callout.style.setProperty('--link-color', color);
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
        requestAnimationFrame(() => {
            const contentEl = container.querySelector('.callout-content');
            if (!contentEl) return;

            const lists = contentEl.querySelectorAll('ul, ol, .dataview.list-view-ul, .dataview-result-list-ul, .dataview ul, .block-language-dataview ul');
            lists.forEach(list => {
                const listEl = list as HTMLElement;
                const items = listEl.querySelectorAll(':scope > li');
                const itemCount = items.length;

                if (itemCount === 0) return;

                // AI_CONTEXT: Grid approach - full control over placement
                const rowCount = Math.ceil(itemCount / colCount);

                // Apply grid layout
                listEl.style.display = 'grid';
                listEl.style.gridTemplateColumns = `repeat(${colCount}, 1fr)`;
                listEl.style.gridTemplateRows = `repeat(${rowCount}, auto)`;
                listEl.style.gap = '0.25em 2em';
                listEl.style.width = '100%';

                // Remove any previous column styles
                listEl.style.columnCount = '';
                listEl.style.columnFill = '';
                listEl.style.height = '';

                // AI_CONTEXT: Manual placement - item i goes to column (i / rowCount) and row (i % rowCount)
                // This creates top-to-bottom, left-to-right flow
                items.forEach((li, index) => {
                    const liEl = li as HTMLElement;
                    const col = Math.floor(index / rowCount) + 1;
                    const row = (index % rowCount) + 1;

                    liEl.style.gridColumn = col.toString();
                    liEl.style.gridRow = row.toString();
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
            setTimeout(() => {
                const contentEl = calloutEl.querySelector('.callout-content');
                if (!contentEl) return;

                const lists = contentEl.querySelectorAll('ul, ol, .dataview.list-view-ul, .dataview-result-list-ul, .dataview ul, .block-language-dataview ul');
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
            mutations.forEach(m => m.addedNodes.forEach(n => {
                if (n.nodeType === 1 && ((n as Element).matches('ul,ol,.dataview') || (n as Element).querySelector('ul,ol,.dataview'))) {
                    update = true;
                }
            }));
            if (update) this.debouncedColumnApply(calloutEl, colCount);
        });

        observer.observe(contentEl, { childList: true, subtree: true });
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
