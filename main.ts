/**
 * Special Callouts - Main Plugin Entry Point
 * Advanced callout styling with grid layouts, custom colors, gradients, glow effects, and multi-column support
 * 
 * IMPORTANT: Before modifying this file, read RULES.md for mandatory protocols.
 * 
 * @author ahseyg
 * @license MIT
 */

import { Plugin } from 'obsidian';
import { SpecialCalloutsSettings } from './src/types';
import { DEFAULT_SETTINGS } from './src/constants';
import { CalloutProcessor } from './src/processor';
import { CustomCalloutSuggester } from './src/modals/SuggesterModal';
import { showMetadataReference } from './src/modals/MetadataModal';
import { SpecialCalloutsSettingTab } from './src/settings/SettingsTab';

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
     * Registers all plugin commands
     */
    private registerCommands(): void {
        // Insert Custom Callout command
        this.addCommand({
            id: 'insert-custom-callout',
            name: 'Insert Custom Callout',
            editorCallback: (editor) => {
                const styles = this.settings.customStyles;
                if (styles.length === 0) {
                    const cursor = editor.getCursor();
                    editor.replaceRange('> [!note]\n> ', cursor);
                    editor.setCursor({ line: cursor.line + 1, ch: 2 });
                    return;
                }

                const suggester = new CustomCalloutSuggester(this.app, styles, editor);
                suggester.open();
            }
        });

        // Show Metadata Reference command
        this.addCommand({
            id: 'show-metadata-reference',
            name: 'Show Metadata Reference',
            callback: () => {
                showMetadataReference();
            }
        });

        // Register commands for each custom style
        this.settings.customStyles.forEach((style) => {
            this.addCommand({
                id: `insert-${style.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
                name: `Insert "${style.name}" callout`,
                editorCallback: (editor) => {
                    const cursor = editor.getCursor();
                    const calloutText = `> [!${style.name}]\n> `;
                    editor.replaceRange(calloutText, cursor);
                    editor.setCursor({ line: cursor.line + 1, ch: 2 });
                }
            });
        });
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
