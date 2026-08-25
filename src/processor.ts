/**
 * Special Callouts - Callout Processor
 * Core logic for processing and styling callouts
 * 
 * IMPORTANT: Before modifying this file, read RULES.md for mandatory protocols.
 */

import { CalloutStyle, CalloutConfig, SpecialCalloutsSettings } from './types';
import { BG_TINT_OPACITY, DEFAULT_CALLOUT_CONFIG, DEFAULT_STANDARD_STYLES, FONT_FAMILIES, FONT_SIZES, resolveCalloutType } from './constants';
import { resolveColor, applyTextBorder, createTransparentBg, debounce, toPx, neonStyles, isCssGradient } from './utils';
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

        // [!tldr] is Obsidian's own alias for [!abstract] and renders identically, so a
        // recoloured abstract has to reach it too.
        const resolvedType = resolveCalloutType(calloutType);
        const standardStyle = this.settings.standardStyles[resolvedType];
        const defaultStyle = DEFAULT_STANDARD_STYLES[resolvedType];

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
                this.applyGridLayout(calloutEl, gridConfig, config);
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

        // AI_CONTEXT: Ayri ikon rengi. title: ile birlikte verilirse bu kazanir, cunku
        // styles.css'te [data-sc-icon-color] kurali [data-sc-title-color]'dan sonra gelir.
        if (config.iconColor) {
            calloutEl.setCssProps({ '--sc-icon-color': config.iconColor });
            calloutEl.setAttribute('data-sc-icon-color', '');
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
                this.forceApplyIcon(iconEl as HTMLElement, config.icon);
            }
        }

        if (config.border) {
            if (config.border === 'none') {
                calloutEl.setAttribute('data-sc-no-border', '');
            } else {
                // The width belongs in the shorthand. Writing 1px here and leaving
                // border-width to the later data-sc-bw rule worked only because that rule
                // is declared afterwards in styles.css — the two paths disagreed and CSS
                // order was hiding it.
                const style = config.borderStyle || 'solid';
                const width = config.borderWidth ? toPx(config.borderWidth) : '1px';
                calloutEl.setCssProps({ '--sc-border': `${width} ${style} ${config.border}` });
                calloutEl.setAttribute('data-sc-border', '');
            }
        }

        if (config.borderWidth) {
            calloutEl.setCssProps({ '--sc-border-width': toPx(config.borderWidth) });
            calloutEl.setAttribute('data-sc-bw', '');
        }

        if (config.borderStyle && !config.border) {
            calloutEl.setCssProps({ '--sc-border-style': config.borderStyle });
            calloutEl.setAttribute('data-sc-bs', '');
        }

        if (config.radius) {
            calloutEl.setCssProps({ '--sc-radius': toPx(config.radius) });
            calloutEl.setAttribute('data-sc-radius', '');
        }

        if (config.neon) {
            calloutEl.setCssProps(neonStyles(config.neon));
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

        // AI_CONTEXT: dense is compact plus a tighter line-height. It sets compact too (see
        // parser.ts), so writing `dense` alone still reduces padding as it always has.
        if (config.dense) {
            calloutEl.setAttribute('data-dense', 'true');
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
        let value: string | null = null;

        if (isCssGradient(gradient)) {
            // A saved style holds the finished function; splitting it on '-' would cut
            // `linear-gradient` in two and leave the callout with no background at all.
            value = gradient.trim();
        } else {
            const colors = gradient.split('-');
            if (colors.length === 2) {
                const c1 = resolveColor(colors[0], this.settings.standardColors, this.settings.customColors);
                const c2 = resolveColor(colors[1], this.settings.standardColors, this.settings.customColors);
                value = `linear-gradient(90deg, ${c1}, ${c2})`;
            }
        }

        if (!value) return;

        // Use CSS var + data attribute; .callout[data-sc-gradient] rule in styles.css applies it
        calloutEl.setCssProps({ '--sc-gradient': value });
        calloutEl.setAttribute('data-sc-gradient', '');
        calloutEl.setAttribute('data-sc-no-border', '');
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
    private applyGridLayout(calloutEl: HTMLElement, gridConfig: import('./types').GridConfig, config: import('./types').CalloutConfig): void {
        const gap = 10;
        const span = Math.min(config.span ?? 1, gridConfig.columns);
        const widthCalc = span > 1
            ? `calc(((100% - ${(gridConfig.columns - 1) * gap}px) / ${gridConfig.columns}) * ${span} + ${(span - 1) * gap}px)`
            : `calc((100% - ${(gridConfig.columns - 1) * gap}px) / ${gridConfig.columns})`;

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
        if (span > 1) {
            calloutEl.setAttribute('data-grid-span', span.toString());
        }
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
            if (!calloutEl.isConnected) return;
            this.applyAreasToChildren(contentEl as HTMLElement);
        });

        observer.observe(contentEl, { childList: true });
        this.registerObserver(calloutEl, observer);
    }

    /**
     * Stores an observer against its callout, replacing any previous one, and drops
     * entries whose element has left the document.
     *
     * The map has to stay strong so onunload can disconnect everything. That means a
     * callout the user has scrolled or navigated away from would otherwise sit in it for
     * as long as the plugin is loaded, holding its observer and the closure over its
     * content element. Sweeping on insert bounds the map by the callouts actually on
     * screen. A WeakMap would collect on its own but leaves nothing to disconnect at
     * unload, and observers that outlive the plugin keep calling back into it.
     */
    private registerObserver(calloutEl: HTMLElement, observer: MutationObserver): void {
        this.observers.get(calloutEl)?.disconnect();

        this.observers.forEach((existing, el) => {
            if (!el.isConnected) {
                existing.disconnect();
                this.observers.delete(el);
            }
        });

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
     * Applies a saved style object to a callout.
     *
     * A saved style is inline metadata that happens to be stored rather than typed, so it
     * goes through the same applyConfig as everything else. Keeping a second copy of the
     * apply logic here is what let the two drift: this path folded the border width into
     * the --sc-border shorthand while the inline path hardcoded 1px, and it applied the
     * three colours unguarded, so a style with an empty bg wrote
     * `color-mix(in srgb,  15%, transparent)` — invalid at computed-value time, which drops
     * the background to transparent instead of leaving Obsidian's default alone.
     *
     * Fields CalloutStyle does not carry (gradient, dense, the readability strokes) simply
     * stay at their defaults; there is no separate behaviour to maintain for them.
     */
    applyStyleObject(calloutEl: HTMLElement, style: CalloutStyle): void {
        // The style editor composes a gradient into the bg field rather than a field of its
        // own, so a gradient preset used to reach applyColor and be wrapped in color-mix() —
        // invalid, and the callout rendered with no background.
        const bgIsGradient = !!style.bg && isCssGradient(style.bg);

        this.applyConfig(calloutEl, {
            ...DEFAULT_CALLOUT_CONFIG,
            bg: bgIsGradient ? '' : (style.bg || ''),
            gradient: bgIsGradient ? style.bg : '',
            text: style.text || '',
            link: style.link || '',
            titleColor: style.titleColor || '',
            iconColor: style.iconColor || '',
            border: style.border || '',
            // boldBorder predates border-width and means the same thing; an explicit width wins.
            borderWidth: style.borderWidth || (style.boldBorder ? '4px' : ''),
            borderStyle: style.borderStyle || '',
            radius: style.borderRadius || '',
            neon: style.neon || '',
            font: style.font || '',
            fontSize: style.fontSize ?? null,
            icon: style.icon || null,
            noIcon: !!style.noIcon,
            compact: !!style.compact,
            center: !!style.center,
            titleCenter: !!style.titleCenter
        });
    }

    /**
     * Applies background color
     */
    applyColor(callout: HTMLElement, color: string): void {
        // CSS var + data attr; .callout[data-sc-bg] rule in styles.css applies !important.
        // The 15% is the single most surprising thing about bg:, so it is expressed once in
        // createTransparentBg rather than spelled out at each call site.
        callout.setCssProps({ '--sc-bg-color': createTransparentBg(color, BG_TINT_OPACITY) });
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
            // A frame is long enough for the note to have been closed underneath us.
            if (!container.isConnected) return;

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
                // The last retry lands two seconds out; by then the note may be closed.
                // Every delay still runs while the callout is on screen — a Dataview list
                // can be in the DOM at 100ms and not finished, which is what the later
                // attempts are for.
                if (!calloutEl.isConnected) return;

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
        const contentEl = calloutEl.querySelector('.callout-content');
        if (!contentEl) return;

        const observer = new MutationObserver((mutations) => {
            if (!calloutEl.isConnected) return;
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
        this.registerObserver(calloutEl, observer);
    }

    /**
     * Safely applies an icon bypassing Obsidian's native override
     */
    private forceApplyIcon(iconEl: HTMLElement, iconName: string): void {
        const apply = () => {
            iconEl.empty();
            setIcon(iconEl, iconName);
            iconEl.removeClass('sc-hidden');
        };

        // Apply immediately
        apply();

        // Obsidian often overwrites the custom type's icon with the default 'pencil'
        // shortly after the element is rendered. We wait for the next tick to override it back.
        window.setTimeout(() => {
            apply();
        }, 0);

        // Fallback: If Obsidian takes longer, observe the element temporarily
        const observer = new MutationObserver(() => {
            observer.disconnect();
            apply();
        });
        observer.observe(iconEl, { childList: true });
        
        // Clean up observer after a short window to prevent memory leaks
        window.setTimeout(() => observer.disconnect(), 150);
    }

    /**
     * Cleans up all observers
     */
    cleanup(): void {
        this.observers.forEach(o => o.disconnect());
        this.observers.clear();
    }
}
