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
import { CustomCalloutSuggester } from './src/modals/SuggesterModal';
import { showMetadataReference } from './src/modals/MetadataModal';
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
 * Main plugin class
 */
export default class SpecialCallouts extends Plugin {
    settings: SpecialCalloutsSettings;
    private processor: CalloutProcessor;

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

        console.log('Special Callouts plugin loaded');
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
                    const defaultMeta = this.settings.defaultMetadata ? `|${this.settings.defaultMetadata}` : '';
                    const header = `> [!${style.name}${defaultMeta}]\n`;
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
                const options = ['2 Sütun', '3 Sütun', '4 Sütun'];
                new ColumnSuggesterModal(this.app, options, (choice: string) => {
                    if (!choice) return;
                    const cols = parseInt(choice.split(' ')[0]);
                    let template = `> [!multi-callout]\n>\n`;
                    for (let i = 1; i <= cols; i++) {
                        template += `>> [!note] (${i}:${cols})\n>> Sütun ${i} içeriği\n>\n`;
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
                
                // Callout baslıgı olup olmadıgını kontrol et (örn: > [!note])
                const match = line.match(/^>\s*\[!([^\]|]+)(?:\|([^\]]*))?\]/);
                if (!match) return;

                
                const existingMeta = match[2] || '';

                new IconPickerModal(this.app, (icon: string) => {
                    // Metadata icinde zaten icon varsa degistir, yoksa ekle
                    let newMeta = existingMeta;
                    if (newMeta.includes('icon:')) {
                        newMeta = newMeta.replace(/icon:[^,|]*/, `icon:${icon}`);
                    } else {
                        newMeta = newMeta ? `${newMeta}, icon:${icon}` : `icon:${icon}`;
                    }
                    const newLine = line.replace(/\[!([^\]|]+)(?:\|[^\]]*)?\]/, `[!$1|${newMeta}]`);
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

        // Show Metadata Reference
        this.addCommand({
            id: 'show-metadata-reference',
            name: 'Show Metadata Reference',
            callback: () => {
                showMetadataReference(this.app);
            }
        });

        // Register individual commands for each custom style
        this.settings.customStyles.forEach((style) => {
            this.addCommand({
                id: `insert-${style.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: `Insert "${style.name}" Callout`,
                editorCallback: (editor) => this.insertCalloutTemplate(editor, style.name)
            });
        });
    }

    /**
     * Helper to insert a callout template with default metadata
     */
    private insertCalloutTemplate(editor: Editor, type: string): void {
        const cursor = editor.getCursor();
        const defaultMeta = this.settings.defaultMetadata ? `|${this.settings.defaultMetadata}` : '';
        const calloutText = `> [!${type}${defaultMeta}]\n> `;
        editor.replaceRange(calloutText, cursor);
        editor.setCursor({ line: cursor.line + 1, ch: 2 });
    }

    onunload(): void {
        this.processor.cleanup();
        console.log('Special Callouts plugin unloaded');
    }

    async loadSettings(): Promise<void> {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }

    async saveSettings(): Promise<void> {
        await this.saveData(this.settings);
        // Update processor with new settings
        if (this.processor) {
            this.processor.updateSettings(this.settings);
        }
    }
}
