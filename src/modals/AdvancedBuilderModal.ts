/**
 * Special Callouts - Advanced Builder Modal
 * Interactive modal for building a callout with custom parameters
 */

import { App, Modal, Setting, setIcon } from 'obsidian';
import SpecialCallouts from '../../main';
import { IconPickerModal } from './IconPickerModal';

export class AdvancedBuilderModal extends Modal {
    private plugin: SpecialCallouts;
    private editor: any;
    
    // Callout parameters
    private type: string = 'note';
    private bg: string = '';
    private icon: string = '';
    private radius: string = '';
    private isCompact: boolean = false;
    private isCenter: boolean = false;

    constructor(app: App, plugin: SpecialCallouts, editor: any) {
        super(app);
        this.plugin = plugin;
        this.editor = editor;
    }

    onOpen() {
        const { contentEl } = this;
        contentEl.empty();
        
        contentEl.createEl('h2', { text: 'Advanced Callout Builder' });

        new Setting(contentEl)
            .setName('Callout Type')
            .setDesc('Standard Obsidian callout types (note, tip, warning...)')
            .addText(text => text
                .setPlaceholder('note')
                .setValue(this.type)
                .onChange(value => this.type = value || 'note'));

        new Setting(contentEl)
            .setName('Background Color')
            .setDesc('Hex code or standard color name')
            .addText(text => text
                .setPlaceholder('#ff0000 or red')
                .setValue(this.bg)
                .onChange(value => this.bg = value));

        const iconSetting = new Setting(contentEl)
            .setName('Icon')
            .setDesc('Choose a Lucide icon');
        
        const iconPreview = iconSetting.nameEl.createSpan();
        iconPreview.style.marginLeft = '10px';
        if (this.icon) setIcon(iconPreview, this.icon);

        iconSetting.addButton(btn => btn
            .setButtonText('Select Icon')
            .onClick(() => {
                new IconPickerModal(this.app, (selected) => {
                    this.icon = selected;
                    iconPreview.empty();
                    setIcon(iconPreview, selected);
                }).open();
            }));

        new Setting(contentEl)
            .setName('Corner Radius')
            .setDesc('Border radius in pixels')
            .addSlider(slider => slider
                .setLimits(0, 30, 1)
                .setValue(parseInt(this.radius) || 4)
                .onChange(value => this.radius = value.toString()));

        new Setting(contentEl)
            .setName('Compact Mode')
            .setDesc('Reduced padding for dense layouts')
            .addToggle(toggle => toggle
                .setValue(this.isCompact)
                .onChange(value => this.isCompact = value));

        new Setting(contentEl)
            .setName('Center Align')
            .setDesc('Center all text and title')
            .addToggle(toggle => toggle
                .setValue(this.isCenter)
                .onChange(value => this.isCenter = value));

        new Setting(contentEl)
            .addButton(btn => btn
                .setButtonText('Insert Callout')
                .setCta()
                .onClick(() => {
                    this.insertCallout();
                    this.close();
                }))
            .addButton(btn => btn
                .setButtonText('Cancel')
                .onClick(() => this.close()));
    }

    private insertCallout() {
        const params: string[] = [];
        if (this.bg) params.push(`bg:${this.bg}`);
        if (this.icon) params.push(`icon:${this.icon}`);
        if (this.radius && this.radius !== '4') params.push(`radius:${this.radius}`);
        if (this.isCompact) params.push('compact');
        if (this.isCenter) params.push('center');

        const metadata = params.length > 0 ? ` (${params.join(', ')})` : '';
        const template = `> [!${this.type}]${metadata}\n> `;
        
        const cursor = this.editor.getCursor();
        this.editor.replaceRange(template, cursor);
        this.editor.setCursor({ line: cursor.line + 1, ch: 2 });
    }

    onClose() {
        const { contentEl } = this;
        contentEl.empty();
    }
}
