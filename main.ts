/**
 * Special Callouts - Main Plugin Entry Point
 * Advanced callout styling with grid layouts, custom colors, gradients, glow effects, and multi-column support
 * 
 * IMPORTANT: Before modifying this file, read RULES.md for mandatory protocols.
 * 
 * @author ahseyg
 * @license MIT
 */

import { App, Plugin, Editor, FuzzySuggestModal } from 'obsidian';
import { SpecialCalloutsSettings } from './src/types';
import { DEFAULT_SETTINGS } from './src/constants';
import { CalloutProcessor } from './src/processor';
import { findMetadataSpan } from './src/parser';
import { CustomCalloutSuggester } from './src/modals/SuggesterModal';
import { SpecialCalloutsSettingTab } from './src/settings/SettingsTab';
import { AdvancedBuilderModal } from './src/modals/AdvancedBuilderModal';
import { IconPickerModal } from './src/modals/IconPickerModal';

class ColumnSuggesterModal extends FuzzySuggestModal<string> {
    items: string[];
    callback: (item: string) => void;

    constructor(app: App, items: string[], callback: (item: string) => void) {
        super(app);
        this.items = items;
        this.callback = callback;
    }

    getItems(): string[] {
        return this.items;
    }

    getItemText(item: string): string {
        return item;
    }

    onChooseItem(item: string, evt: MouseEvent | KeyboardEvent): void {
        this.callback(item);
    }
}

/**
 * Formats the "Default Callout Metadata" setting into the parenthesised form the renderer
 * actually parses. Tolerates the user typing their own parentheses around it.
 *
 * Returns a leading-space-prefixed block ready to append after `]`, or '' when unset.
 */
function formatMetadata(raw: string | undefined): string {
    const meta = (raw || '').trim();
    if (!meta) return '';
    const inner = meta.startsWith('(') && meta.endsWith(')') ? meta.slice(1, -1).trim() : meta;
    return inner ? ` (${inner})` : '';
}

/**
 * Main plugin class
 */
export default class SpecialCallouts extends Plugin {
    settings: SpecialCalloutsSettings;
    private processor: CalloutProcessor;
    private registeredStyleCommands = new Set<string>();

    async onload(): Promise<void> {
        await this.loadSettings();

        // Initialize callout processor
        this.processor = new CalloutProcessor(this.settings);

        // Add settings tab
        this.addSettingTab(new SpecialCalloutsSettingTab(this.app, this));

        // Register commands
        this.registerCommands();

        // Register markdown post processor for callouts
        this.registerMarkdownPostProcessor((element) => {
            const callouts = element.querySelectorAll('.callout');
            callouts.forEach((callout) => {
                this.processor.processCallout(callout as HTMLElement);
            });
        });

    }

    /**
     * Registers all plugin commands based on usage scenarios
     */
    private registerCommands(): void {
        // SCENARIO 1: Insert Custom Style (The Quick Access)
        this.addCommand({
            id: 'insert-custom-callout',
            name: 'Insert Custom Style...',
            editorCallback: (editor) => {
                const styles = this.settings.customStyles;
                if (styles.length === 0) {
                    this.insertCalloutTemplate(editor, 'note');
                    return;
                }
                new CustomCalloutSuggester(this.app, styles, (style) => {
                    this.insertCalloutTemplate(editor, style.name);
                }).open();
            }
        });

        // SCENARIO 2: Wrap Selection in Callout
        this.addCommand({
            id: 'wrap-selection-in-callout',
            name: 'Wrap Selection in Callout...',
            editorCallback: (editor) => {
                const selection = editor.getSelection();
                if (!selection) return;

                const styles = this.settings.customStyles;
                new CustomCalloutSuggester(this.app, styles, (style) => {
                    const header = `> [!${style.name}]${formatMetadata(this.settings.defaultMetadata)}\n`;
                    const wrapped = selection.split('\n').map(l => `> ${l}`).join('\n');
                    editor.replaceSelection(header + wrapped);
                }).open();
            }
        });

        // SCENARIO 3: Insert Multi-Column Layout (The Scaffolder)
        this.addCommand({
            id: 'insert-multi-column-layout',
            name: 'Insert Multi-Column Layout...',
            editorCallback: (editor) => {
                const options = ['2 columns', '3 columns', '4 columns'];
                new ColumnSuggesterModal(this.app, options, (choice: string) => {
                    if (!choice) return;
                    const cols = parseInt(choice);
                    if (isNaN(cols) || cols < 1) return;

                    let template = `> [!multi-callout]\n>\n`;
                    for (let i = 1; i <= cols; i++) {
                        template += `>> [!note] (${i}:${cols}) Panel ${i}\n>> Content\n>\n`;
                    }
                    editor.replaceRange(template, editor.getCursor());
                }).open();
            }
        });

        // SCENARIO 4: Contextual Icon Change
        this.addCommand({
            id: 'change-current-callout-icon',
            name: 'Change Icon of Callout at Cursor',
            editorCallback: (editor) => {
                const cursor = editor.getCursor();
                const line = editor.getLine(cursor.line);
                
                // Callout baslıgı mı? Nested callout'lar icin >> de kabul edilir.
                const head = line.match(/^\s*>+\s*\[![^\]]+\]/);
                if (!head) return;

                new IconPickerModal(this.app, (icon: string) => {
                    const span = findMetadataSpan(line, head[0].length);
                    let newLine: string;

                    if (span) {
                        // Metadata varsa icon'u icine yaz: mevcutsa degistir, yoksa ekle
                        const existing = span.content.trim();
                        const meta = existing.includes('icon:')
                            ? existing.replace(/icon:[^,)]*/, `icon:${icon}`)
                            : existing ? `${existing}, icon:${icon}` : `icon:${icon}`;
                        newLine = line.slice(0, span.start) + `(${meta})` + line.slice(span.end + 1);
                    } else {
                        newLine = line.slice(0, head[0].length) + ` (icon:${icon})` + line.slice(head[0].length);
                    }

                    editor.setLine(cursor.line, newLine);
                }).open();
            }
        });

        // SCENARIO 5: Advanced Builder
        this.addCommand({
            id: 'advanced-callout-builder',
            name: 'Advanced Callout Builder...',
            editorCallback: (editor) => {
                new AdvancedBuilderModal(this.app, this, editor).open();
            }
        });

        this.registerStyleCommands();
    }

    /**
     * Registers one insert command per saved custom style.
     *
     * Also called from saveSettings, so a style created in settings gets its command straight
     * away instead of only after Obsidian is reloaded. Already-registered ids are skipped, so
     * repeated calls do not stack duplicate registrations.
     *
     * A command whose style was deleted stays until the next reload — Obsidian offers no
     * reliable way to withdraw one, and a stale entry is a far smaller annoyance than a
     * missing one.
     */
    private registerStyleCommands(): void {
        this.settings.customStyles
            .filter((style) => style.showInCommandPalette !== false)
            .forEach((style) => {
                const id = `insert-${style.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                if (this.registeredStyleCommands.has(id)) return;
                this.registeredStyleCommands.add(id);

                this.addCommand({
                    id,
                    name: `Insert "${style.name}" Callout`,
                    editorCallback: (editor) => this.insertCalloutTemplate(editor, style.name)
                });
            });

        (this.settings.customLayouts || [])
            .filter((layout) => layout.showInCommandPalette === true)
            .forEach((layout) => {
                const id = `insert-layout-${layout.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
                if (this.registeredStyleCommands.has(id)) return;
                this.registeredStyleCommands.add(id);

                this.addCommand({
                    id,
                    name: `Insert "${layout.name}" Layout`,
                    editorCallback: (editor) => {
                        let template = `> [!multi-callout] (${layout.name})\n>\n`;
                        for (let i = 1; i <= layout.cols; i++) {
                            template += `>> [!note] Panel ${i}\n>> Content\n>\n`;
                        }
                        editor.replaceRange(template, editor.getCursor());
                    }
                });
            });
    }

    /**
     * Helper to insert a callout template with default metadata
     */
    private insertCalloutTemplate(editor: Editor, type: string): void {
        const cursor = editor.getCursor();
        const calloutText = `> [!${type}]${formatMetadata(this.settings.defaultMetadata)}\n> `;
        editor.replaceRange(calloutText, cursor);
        editor.setCursor({ line: cursor.line + 1, ch: 2 });
    }

    onunload(): void {
        this.processor.cleanup();
    }

    /**
     * Loads settings, filling in defaults the saved file predates.
     *
     * Object.assign is shallow: it hands back a saved `standardStyles` or `standardColors`
     * object whole, so anything added to the defaults after a vault first saved its
     * settings would never appear there. Merging those two records key by key — defaults
     * first, the user's own values over the top — means a new standard type or palette
     * entry reaches existing vaults without touching what they have changed.
     */
    async loadSettings(): Promise<void> {
        const saved = ((await this.loadData()) || {}) as Partial<SpecialCalloutsSettings>;

        this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
        this.settings.standardStyles = Object.assign({}, DEFAULT_SETTINGS.standardStyles, saved.standardStyles);
        this.settings.standardColors = Object.assign({}, DEFAULT_SETTINGS.standardColors, saved.standardColors);
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        // Update processor with new settings
        if (this.processor) {
            this.processor.updateSettings(this.settings);
        }
        // Yeni olusturulan preset'in komutu yeniden yukleme beklemeden gorunsun
        this.registerStyleCommands();
    }
}
