
/**
 * Special Callouts - Settings Tab
 * Plugin settings UI
 */

import { App, PluginSettingTab, Setting, setIcon, Notice, Modal, TextAreaComponent, ButtonComponent, DropdownComponent, SliderComponent, ToggleComponent } from 'obsidian';
import { CalloutStyle, SpecialCalloutsSettings } from '../types';
import { DEFAULT_STANDARD_STYLES, QUICK_START_PRESETS, FONT_FAMILIES, FONT_SIZES } from '../constants';
import { isValidHex, normalizeHex } from '../utils';
import { parseMetadata } from '../parser';
import { showHowToUse } from '../modals/HowToModal';
import { showMetadataReference } from '../modals/MetadataModal';
import { IconPickerModal } from '../modals/IconPickerModal';

// Reference to plugin type (will be set as generic to avoid circular deps)
interface PluginWithSettings {
    settings: SpecialCalloutsSettings;
    saveSettings(): Promise<void>;
}

/**
 * Settings tab for Special Callouts plugin
 */
export class SpecialCalloutsSettingTab extends PluginSettingTab {
    plugin: PluginWithSettings;

    // Form state
    tempName = '';
    tempIcon = 'pencil';
    tempBg = '#3498db';
    tempBorder = '#3498db';
    tempText = '#ffffff';
    tempLink = '#dfe4ea';
    tempTitleColor = '#3498db';
    tempBoldBorder = false;
    tempFont = ''; // Default (empty)
    tempFontSize = 3; // Default size
    tempBorderWidth = '';
    tempBorderStyle = 'solid';
    tempBorderRadius = '';
    tempNeon = '';
    tempNoIcon = false;
    tempCompact = false;
    tempCenter = false;
    tempTitleCenter = false;
    newCustomColorName = '';
    newCustomColorHex = '#ffffff';
    editingIndex: number | null = null;
    
    // Layout Builder State (Persist across display calls)
    builderCols = 3;
    builderRows = 2;
    builderLayoutName = '';
    builderGridMatrix: number[][] = [[1,2,3], [4,5,6]];
    builderSelectedCells: {r: number, c: number}[] = [];

    // View modes
    stylesViewMode: 'grid' | 'list' = 'grid';
    standardStylesViewMode: 'grid' | 'list' = 'list';
    standardColorsViewMode: 'grid' | 'list' = 'grid';
    customColorsViewMode: 'grid' | 'list' = 'grid';

    constructor(app: App, plugin: PluginWithSettings) {
        super(app, plugin as any);
        this.plugin = plugin;
    }

    display(): void {
        const { containerEl } = this;
        containerEl.empty();

        this.createHeader(containerEl);
        this.createQuickActions(containerEl);
        this.createGeneralSettings(containerEl);
        this.createLayoutBuilderSection(containerEl);
        this.createCalloutsSection(containerEl);
        this.createColorsSection(containerEl);
    }

    private createHeader(container: HTMLElement): void {
        const header = container.createDiv();
        header.addClass('sc-style-2579959f');

        const title = new Setting(header).setName('Configuration' ).setHeading();
        (title.settingEl).addClass('sc-style-246e97b8');

        const subtitle = header.createEl('p', { text: 'Customize your callout styles with precision' });
        (subtitle).addClass('sc-style-efd0ece4');
    }

    private createQuickActions(container: HTMLElement): void {
        const quickRefDiv = container.createDiv();
        quickRefDiv.addClass('sc-style-958e85a8');

        const howToBtn = quickRefDiv.createEl('button');
        // AI_CONTEXT: Sekonder eylem butonlari icin var(--interactive-normal) kullaniliyor
        // Accent rengi acik/beyaz oldugunda 'color: white' okunaksiz hale geliyordu
        howToBtn.addClass('sc-style-05ed7705');
        howToBtn.onmouseover = () => howToBtn.addClass('sc-style-dfd2f110');
        howToBtn.onmouseout = () => howToBtn.addClass('sc-style-42c960e0');
        setIcon(howToBtn.createSpan(), 'help-circle');
        howToBtn.createSpan({ text: 'How to Use' });
        howToBtn.onclick = () => showHowToUse(this.app);

        const metadataBtn = quickRefDiv.createEl('button');
        metadataBtn.addClass('sc-style-05ed7705');
        metadataBtn.onmouseover = () => metadataBtn.addClass('sc-style-dfd2f110');
        metadataBtn.onmouseout = () => metadataBtn.addClass('sc-style-42c960e0');
        setIcon(metadataBtn.createSpan(), 'list');
        metadataBtn.createSpan({ text: 'Metadata Reference' });
        metadataBtn.onclick = () => showMetadataReference(this.app);
    }

    private createGeneralSettings(container: HTMLElement): void {
        const section = container.createDiv();
        section.addClass('sc-style-656f9746');

        const h1 = new Setting(section).setName('Core Layout' ).setHeading();
        (h1.settingEl).addClass('sc-style-83fa57df');

        new Setting(section)
            .setName('Default Callout Metadata')
            .setDesc('Enter the default metadata (e.g. "col:2, bg:ocean") to automatically append when using the "Insert Custom Callout" command.')
            .addText(text => text
                .setPlaceholder('col:2, bg:ocean')
                .setValue(this.plugin.settings.defaultMetadata || '')
                .onChange(async (value) => {
                    this.plugin.settings.defaultMetadata = value;
                    await this.plugin.saveSettings();
                }));
    }

    private createCalloutsSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.addClass('sc-style-656f9746');

        const h1 = new Setting(section).setName('Callouts' ).setHeading();
        (h1.settingEl).addClass('sc-style-83fa57df');

        this.createCustomStylesSection(section);
        this.createStandardStylesSection(section);
    }

    private createColorsSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.addClass('sc-style-656f9746');

        const h1 = new Setting(section).setName('Colors' ).setHeading();
        (h1.settingEl).addClass('sc-style-83fa57df');

        this.createStandardColorsSection(section);
        this.createCustomColorsSection(section);
    }

    createLayoutBuilderSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.addClass('sc-style-656f9746');

        const h1 = new Setting(section).setName('Visual Layout Builder (Interactive)' ).setHeading();
        (h1.settingEl).addClass('sc-style-83fa57df');

        const desc = section.createEl('p', { text: 'Drag to select cells, then click Merge or Split. Use layouts by typing their name in the callout metadata. e.g. > [!multi-callout] (my_dashboard).' });
        desc.addClass('sc-style-41798230');

        const builderCard = section.createDiv();
        (builderCard).addClass('sc-style-e918ea73');

        let isDragging = false;
        let dragStart: {r: number, c: number} | null = null;
        
        const initMatrix = () => {
            this.builderGridMatrix = [];
            let nextId = 1;
            for(let r=0; r<this.builderRows; r++) {
                let row = [];
                for(let c=0; c<this.builderCols; c++) {
                    row.push(nextId++);
                }
                this.builderGridMatrix.push(row);
            }
        };

        // Ensure matrix exists and matches dimensions (failsafe)
        if (!this.builderGridMatrix || this.builderGridMatrix.length !== this.builderRows || (this.builderGridMatrix[0]?.length || 0) !== this.builderCols) {
            initMatrix();
        }

        const normalizeMatrix = () => {
            let currentId = 1;
            let oldToNew = new Map<number, number>();
            for(let r=0; r<this.builderRows; r++) {
                for(let c=0; c<this.builderCols; c++) {
                    const oldId = this.builderGridMatrix[r][c];
                    if(!oldToNew.has(oldId)) {
                        oldToNew.set(oldId, currentId++);
                    }
                    this.builderGridMatrix[r][c] = oldToNew.get(oldId)!;
                }
            }
        };

        // Settings Row
        const controlsRow = builderCard.createDiv();
        controlsRow.addClass('sc-style-3c58b917');
        
        const nameGroup = controlsRow.createDiv();
        (nameGroup.createEl('label', { text: 'Layout Name' })).addClass('sc-style-83e047a0');
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my_dashboard' });
        nameInput.addClass('sc-style-2e4036f8');
        nameInput.value = this.builderLayoutName;
        nameInput.oninput = (e) => this.builderLayoutName = (e.target as HTMLInputElement).value;

        const colsGroup = controlsRow.createDiv();
        (colsGroup.createEl('label', { text: 'Columns' })).addClass('sc-style-83e047a0');
        const colsSelect = new DropdownComponent(colsGroup);
        [1,2,3,4,5,6,7,8].forEach(n => colsSelect.addOption(n.toString(), n.toString()));
        colsSelect.setValue(this.builderCols.toString());

        const rowsGroup = controlsRow.createDiv();
        (rowsGroup.createEl('label', { text: 'Rows' })).addClass('sc-style-83e047a0');
        const rowsSelect = new DropdownComponent(rowsGroup);
        [1,2,3,4,5,6,7,8].forEach(n => rowsSelect.addOption(n.toString(), n.toString()));
        rowsSelect.setValue(this.builderRows.toString());

        const actionGroup = controlsRow.createDiv();
        actionGroup.addClass('sc-style-8e73ff36');
        
        const mergeBtn = actionGroup.createEl('button');
        mergeBtn.addClass('sc-style-042ed0a9');
        setIcon(mergeBtn.createSpan(), 'combine');
        mergeBtn.createSpan({ text: 'Merge' });
        mergeBtn.onclick = () => {
            if(this.builderSelectedCells.length < 2) return;
            const minR = Math.min(...this.builderSelectedCells.map(s=>s.r));
            const maxR = Math.max(...this.builderSelectedCells.map(s=>s.r));
            const minC = Math.min(...this.builderSelectedCells.map(s=>s.c));
            const maxC = Math.max(...this.builderSelectedCells.map(s=>s.c));
            
            const targetId = this.builderGridMatrix[minR][minC];
            for(let r=minR; r<=maxR; r++) {
                for(let c=minC; c<=maxC; c++) {
                    this.builderGridMatrix[r][c] = targetId;
                }
            }
            normalizeMatrix();
            this.builderSelectedCells = [];
            drawGrid();
        };
        
        const splitBtn = actionGroup.createEl('button');
        splitBtn.addClass('sc-style-e8b62f99');
        setIcon(splitBtn.createSpan(), 'scissors');
        splitBtn.createSpan({ text: 'Split' });
        splitBtn.onclick = () => {
            if(this.builderSelectedCells.length === 0) return;
            let maxExisting = 0;
            for(let r=0; r<this.builderRows; r++) {
                for(let c=0; c<this.builderCols; c++) {
                    if(this.builderGridMatrix[r][c] > maxExisting) maxExisting = this.builderGridMatrix[r][c];
                }
            }
            
            this.builderSelectedCells.forEach(s => {
                const currentId = this.builderGridMatrix[s.r][s.c];
                for(let r=0; r<this.builderRows; r++) {
                    for(let c=0; c<this.builderCols; c++) {
                        if(this.builderGridMatrix[r][c] === currentId) {
                            this.builderGridMatrix[r][c] = ++maxExisting;
                        }
                    }
                }
            });
            normalizeMatrix();
            this.builderSelectedCells = [];
            drawGrid();
        };

        const gridContainer = builderCard.createDiv();
        
        const updateSelectionVisuals = () => {
            const children = Array.from(gridContainer.children) as HTMLElement[];
            children.forEach(cell => {
                const id = parseInt(cell.getAttribute('data-id') || '0');
                const isSelected = this.builderSelectedCells.some(s => this.builderGridMatrix[s.r]?.[s.c] === id);
                if(isSelected) {
                    cell.addClass('sc-style-5e0853c5');
                    cell.addClass('sc-style-e7813acd');
                    cell.addClass('sc-style-4d6aa729');
                    cell.addClass('sc-style-1a92a345');
                } else {
                    cell.addClass('sc-style-9a360b3f');
                    cell.addClass('sc-style-fdf11a02');
                    cell.addClass('sc-style-f31841c1');
                    cell.addClass('sc-style-4eebc6ad');
                }
            });
        };

        const onMouseUp = () => {
            isDragging = false;
            activeDocument.removeEventListener('mouseup', onMouseUp);
        };

        const drawGrid = () => {
            gridContainer.empty();
            gridContainer.addClasses(['sc-var-display', 'sc-var-grid-template-columns', 'sc-var-grid-template-rows', 'sc-var-gap', 'sc-var-background', 'sc-var-padding', 'sc-var-border-radius', 'sc-var-border', 'sc-var-user-select']); gridContainer.setCssProps({ '--sc-dyn-display': `grid`, '--sc-dyn-grid-template-columns': `repeat(${this.builderCols}, 1fr)`, '--sc-dyn-grid-template-rows': `repeat(${this.builderRows}, 80px)`, '--sc-dyn-gap': `8px`, '--sc-dyn-background': `var(--background-primary)`, '--sc-dyn-padding': `15px`, '--sc-dyn-border-radius': `8px`, '--sc-dyn-border': `1px dashed var(--background-modifier-border)`, '--sc-dyn-user-select': `none` });
            
            const processed = new Set<number>();
            
            for(let r=0; r<this.builderRows; r++) {
                for(let c=0; c<this.builderCols; c++) {
                    const id = this.builderGridMatrix[r]?.[c];
                    if(id === undefined || processed.has(id)) continue;
                    processed.add(id);
                    
                    let maxR = r, maxC = c;
                    for(let tr=r; tr<this.builderRows; tr++) {
                        if(this.builderGridMatrix[tr][c] === id) maxR = tr;
                        else break;
                    }
                    for(let tc=c; tc<this.builderCols; tc++) {
                        if(this.builderGridMatrix[r][tc] === id) maxC = tc;
                        else break;
                    }
                    
                    const cell = gridContainer.createDiv();
                    cell.setAttribute('data-id', id.toString());
                    cell.addClasses(['sc-var-grid-row-start', 'sc-var-grid-row-end', 'sc-var-grid-column-start', 'sc-var-grid-column-end', 'sc-var-border', 'sc-var-border-radius', 'sc-var-display', 'sc-var-flex-direction', 'sc-var-align-items', 'sc-var-justify-content', 'sc-var-cursor', 'sc-var-transition', 'sc-var-font-weight', 'sc-var-font-size', 'sc-var-box-shadow']); cell.setCssProps({ '--sc-dyn-grid-row-start': `${r + 1}`, '--sc-dyn-grid-row-end': `${maxR + 2}`, '--sc-dyn-grid-column-start': `${c + 1}`, '--sc-dyn-grid-column-end': `${maxC + 2}`, '--sc-dyn-border': `2px solid var(--background-modifier-border)`, '--sc-dyn-border-radius': `6px`, '--sc-dyn-display': `flex`, '--sc-dyn-flex-direction': `column`, '--sc-dyn-align-items': `center`, '--sc-dyn-justify-content': `center`, '--sc-dyn-cursor': `pointer`, '--sc-dyn-transition': `all 0.15s ease`, '--sc-dyn-font-weight': `bold`, '--sc-dyn-font-size': `1.5rem`, '--sc-dyn-box-shadow': `inset 0 0 10px rgba(0,0,0,0.05)` });
                    
                    cell.createSpan({ text: `${id}` });
                    const subtitle = cell.createSpan({ text: `Callout ${id}` });
                    subtitle.addClass('sc-style-aad34d77');
                    
                    cell.onmousedown = (e) => {
                        isDragging = true;
                        activeDocument.addEventListener('mouseup', onMouseUp);
                        dragStart = {r, c};
                        this.builderSelectedCells = [];
                        for(let br=r; br<=maxR; br++) {
                            for(let bc=c; bc<=maxC; bc++) {
                                this.builderSelectedCells.push({r: br, c: bc});
                            }
                        }
                        updateSelectionVisuals();
                    };
                    
                    cell.onmouseenter = (e) => {
                        if(isDragging && dragStart) {
                            const minRow = Math.min(dragStart.r, r);
                            const maxRow = Math.max(dragStart.r, maxR);
                            const minCol = Math.min(dragStart.c, c);
                            const maxCol = Math.max(dragStart.c, maxC);
                            
                            this.builderSelectedCells = [];
                            for(let tr=minRow; tr<=maxRow; tr++) {
                                for(let tc=minCol; tc<=maxCol; tc++) {
                                    this.builderSelectedCells.push({r: tr, c: tc});
                                }
                            }
                            updateSelectionVisuals();
                        }
                    };
                }
            }
            updateSelectionVisuals();
        };

        colsSelect.onChange(v => { this.builderCols = parseInt(v); initMatrix(); drawGrid(); });
        rowsSelect.onChange(v => { this.builderRows = parseInt(v); initMatrix(); drawGrid(); });
        drawGrid();

        const saveBtnRow = builderCard.createDiv();
        saveBtnRow.addClass('sc-style-639d80c2');
        
        const ioGroup = saveBtnRow.createDiv();
        ioGroup.addClass('sc-style-13262f5a');

        const exportBtn = ioGroup.createEl('button');
        exportBtn.addClass('sc-style-a0d2c240');
        setIcon(exportBtn, 'upload');
        exportBtn.createSpan({ text: 'Export All' });
        exportBtn.onclick = async () => {
            const data = this.plugin.settings.customLayouts || [];
            try {
                await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                new Notice('All layouts copied to clipboard!');
            } catch (e) {}
        };

        const importBtn = ioGroup.createEl('button');
        importBtn.addClass('sc-style-a0d2c240');
        setIcon(importBtn, 'download');
        importBtn.createSpan({ text: 'Import' });
        importBtn.onclick = () => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Import Layouts (JSON)');
            const area = new TextAreaComponent(modal.contentEl);
            area.placeholder = 'Paste JSON here...';
            area.inputEl.addClass('sc-style-199b6f0e');
            area.inputEl.addClass('sc-style-09213361');
            
            const btn = modal.contentEl.createEl('button', { text: 'Import' });
            btn.addClass('sc-style-7724b6b4');
            btn.onclick = async () => {
                try {
                    const data = JSON.parse(area.getValue());
                    if (Array.isArray(data)) {
                        this.plugin.settings.customLayouts = data;
                        await this.plugin.saveSettings();
                        new Notice('Layouts imported!');
                        modal.close();
                        this.display();
                    }
                } catch(e) {
                    new Notice('Invalid JSON');
                }
            };
            modal.open();
        };

        const saveBtn = saveBtnRow.createEl('button', { text: 'Save Layout' });
        saveBtn.addClass('sc-style-d345155f');
        saveBtn.onclick = async () => {
            if (!this.builderLayoutName) {
                new Notice('Please enter a layout name');
                return;
            }
            if (!this.plugin.settings.customLayouts) {
                this.plugin.settings.customLayouts = [];
            }
            
            const cleanName = this.builderLayoutName.toLowerCase().replace(/\s+/g, '_');
            const existingIdx = this.plugin.settings.customLayouts.findIndex(l => l.name === cleanName);
            
            // Read matrix
            let gridAreasStr = '';
            for(let r=0; r<this.builderRows; r++) {
                let rowStr = '';
                for(let c=0; c<this.builderCols; c++) {
                    rowStr += `area${this.builderGridMatrix[r][c]} `;
                }
                gridAreasStr += `"${rowStr.trim()}" `;
            }
            
            const newLayout = {
                name: cleanName,
                cols: this.builderCols,
                rows: this.builderRows,
                gridAreas: gridAreasStr.trim()
            };

            if (existingIdx >= 0) {
                this.plugin.settings.customLayouts[existingIdx] = newLayout;
                new Notice('Layout updated!');
            } else {
                this.plugin.settings.customLayouts.push(newLayout);
                new Notice('Layout saved!');
            }
            
            await this.plugin.saveSettings();
            this.display(); // refresh
        };

        // Saved Layouts List
        if (this.plugin.settings.customLayouts && this.plugin.settings.customLayouts.length > 0) {
            const listDiv = section.createDiv();
            new Setting(listDiv).setName('Saved Layouts' ).setHeading()
            
            const grid = listDiv.createDiv();
            grid.addClass('sc-style-1d29bbfe');
            
            this.plugin.settings.customLayouts.forEach((layout, idx) => {
                const card = grid.createDiv();
                card.addClass('sc-style-0ad8d283');
                
                const info = card.createDiv();
                info.createDiv({ text: layout.name }).addClass('sc-style-1188fbba');
                info.createDiv({ text: `${layout.cols}x${layout.rows} Grid` }).addClass('sc-style-bd308a19');
                
                const actionBtns = card.createDiv();
                actionBtns.addClass('sc-style-9d612677');

                const editBtn = actionBtns.createEl('button');
                setIcon(editBtn, 'pencil');
                editBtn.addClass('sc-style-a84482d8');
                editBtn.title = 'Edit Layout';
                editBtn.onclick = () => {
                    // Hydrate UI State
                    this.builderCols = layout.cols;
                    this.builderRows = layout.rows;
                    this.builderLayoutName = layout.name;
                    
                    colsSelect.setValue(this.builderCols.toString());
                    rowsSelect.setValue(this.builderRows.toString());
                    nameInput.value = this.builderLayoutName;
                    
                    // Parse gridAreas string back to matrix
                    const rowsArr = layout.gridAreas.match(/"([^"]+)"/g)?.map(r => r.replace(/"/g, '').trim().split(/\s+/)) || [];
                    if (rowsArr.length === this.builderRows) {
                        this.builderGridMatrix = rowsArr.map(row => row.map(area => parseInt(area.replace('area', ''))));
                    } else {
                        initMatrix(); // Fallback if corrupted
                    }
                    
                    drawGrid();
                    new Notice(`Editing layout: ${this.builderLayoutName}`);
                    
                    // Scroll to top of builder
                    builderCard.scrollIntoView({ behavior: 'smooth' });
                };

                const delBtn = actionBtns.createEl('button');
                setIcon(delBtn, 'trash');
                delBtn.addClass('sc-style-12c7087c');
                delBtn.title = 'Delete Layout';
                delBtn.onclick = async () => {
                    this.plugin.settings.customLayouts.splice(idx, 1);
                    await this.plugin.saveSettings();
                    this.display();
                };
            });
        }
    }

    createStandardStylesSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.addClass('sc-style-d3297f95');

        const sectionHeader = section.createDiv();
        sectionHeader.addClass('sc-style-0d91c8a8');

        (new Setting(sectionHeader).setName('Standard Callouts').setHeading().settingEl).addClass('sc-style-fc320a4f');

        // Grid/List toggle
        const toggleDiv = sectionHeader.createDiv();
        toggleDiv.addClass('sc-style-827a418e');

        const gridBtn = toggleDiv.createEl('button', { text: 'Grid' });
        gridBtn.addClasses(['sc-var-padding', 'sc-var-border', 'sc-var-cursor', 'sc-var-font-size', 'sc-var-background', 'sc-var-color']);
        gridBtn.setCssProps({
            '--sc-dyn-padding': '4px 10px',
            '--sc-dyn-border': 'none',
            '--sc-dyn-cursor': 'pointer',
            '--sc-dyn-font-size': '0.8rem',
            '--sc-dyn-background': this.standardStylesViewMode === 'grid' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
            '--sc-dyn-color': this.standardStylesViewMode === 'grid' ? 'var(--text-on-accent)' : 'var(--text-muted)'
        });
        gridBtn.onclick = () => { this.standardStylesViewMode = 'grid'; this.display(); };

        const listBtn = toggleDiv.createEl('button', { text: 'List' });
        listBtn.addClasses(['sc-var-padding', 'sc-var-border', 'sc-var-cursor', 'sc-var-font-size', 'sc-var-background', 'sc-var-color']);
        listBtn.setCssProps({
            '--sc-dyn-padding': '4px 10px',
            '--sc-dyn-border': 'none',
            '--sc-dyn-cursor': 'pointer',
            '--sc-dyn-font-size': '0.8rem',
            '--sc-dyn-background': this.standardStylesViewMode === 'list' ? 'var(--interactive-accent)' : 'var(--background-secondary)',
            '--sc-dyn-color': this.standardStylesViewMode === 'list' ? 'var(--text-on-accent)' : 'var(--text-muted)'
        });
        listBtn.onclick = () => { this.standardStylesViewMode = 'list'; this.display(); };

        const standardStyleNames = Object.keys(this.plugin.settings.standardStyles);

        if (this.standardStylesViewMode === 'list') {
            this.renderStandardStylesList(section, standardStyleNames);
        } else {
            this.renderStandardStylesGrid(section, standardStyleNames);
        }
    }

    private renderStandardStylesList(section: HTMLElement, styleNames: string[]): void {
        const list = section.createDiv();
        list.addClass('sc-style-5bcf4cf5');

        styleNames.forEach(styleName => {
            const style = this.plugin.settings.standardStyles[styleName];
            const defaultStyle = DEFAULT_STANDARD_STYLES[styleName];
            const isModified = style.bg !== defaultStyle.bg ||
                style.text !== defaultStyle.text ||
                style.titleColor !== defaultStyle.titleColor;

            const row = list.createDiv();
            (row).addClass('sc-style-92860a82');
            row.onmouseover = () => row.addClass('sc-style-5332d565');
            row.onmouseout = () => row.addClass('sc-style-fdf11a02');

            // Color bar
            const colorBar = row.createDiv();
            colorBar.addClasses(['sc-var-width', 'sc-var-height', 'sc-var-border-radius', 'sc-var-background']); colorBar.setCssProps({ '--sc-dyn-width': `4px`, '--sc-dyn-height': `24px`, '--sc-dyn-border-radius': `2px`, '--sc-dyn-background': `${style.bg}` });

            // Icon
            const iconSpan = row.createSpan();
            iconSpan.addClasses(['sc-var-color', 'sc-var-display', 'sc-var-align-items']); iconSpan.setCssProps({ '--sc-dyn-color': `${style.bg}`, '--sc-dyn-display': `flex`, '--sc-dyn-align-items': `center` });
            setIcon(iconSpan, style.icon || 'file');

            // Name
            const nameSpan = row.createSpan({ text: styleName.charAt(0).toUpperCase() + styleName.slice(1) });
            nameSpan.addClasses(['sc-var-flex', 'sc-var-font-weight', 'sc-var-color', 'sc-var-font-size']); nameSpan.setCssProps({ '--sc-dyn-flex': `1`, '--sc-dyn-font-weight': `500`, '--sc-dyn-color': `${style.bg}`, '--sc-dyn-font-size': `0.95rem` });

            // Modified indicator
            if (isModified) {
                const modBadge = row.createSpan({ text: 'â—' });
                modBadge.addClass('sc-style-1f856992');
                modBadge.title = 'Modified';
            }

            // Edit button
            const editBtn = row.createEl('button');
            editBtn.addClass('sc-style-7236432e');
            setIcon(editBtn, 'pencil');
            editBtn.title = 'Edit';
            editBtn.onclick = (e) => { e.stopPropagation(); this.openStandardStyleEditor(styleName); };

            // Reset button
            if (isModified) {
                const resetBtn = row.createEl('button');
                resetBtn.addClass('sc-style-7236432e');
                setIcon(resetBtn, 'rotate-ccw');
                resetBtn.title = 'Reset';
                resetBtn.onclick = async (e) => {
                    e.stopPropagation();
                    this.plugin.settings.standardStyles[styleName] = { ...DEFAULT_STANDARD_STYLES[styleName] };
                    await this.plugin.saveSettings();
                    this.display();
                };
            }
        });
    }

    private renderStandardStylesGrid(section: HTMLElement, styleNames: string[]): void {
        const grid = section.createDiv();
        grid.addClass('sc-style-17bf2b32');

        styleNames.forEach(styleName => {
            const style = this.plugin.settings.standardStyles[styleName];
            const defaultStyle = DEFAULT_STANDARD_STYLES[styleName];
            const isModified = style.bg !== defaultStyle.bg ||
                style.text !== defaultStyle.text ||
                style.titleColor !== defaultStyle.titleColor;

            const card = grid.createDiv();
            (card).addClass('sc-style-e99cca07');
            card.onmouseover = () => { card.addClass('sc-style-5332d565'); card.addClass('sc-style-1eff9e7a'); };
            card.onmouseout = () => { card.addClass('sc-style-fdf11a02'); card.addClass('sc-style-d760c932'); };
            card.onclick = () => this.openStandardStyleEditor(styleName);

            // Icon
            const iconDiv = card.createDiv();
            iconDiv.addClasses(['sc-var-color', 'sc-var-margin-bottom', 'sc-var-display', 'sc-var-justify-content']); iconDiv.setCssProps({ '--sc-dyn-color': `${style.bg}`, '--sc-dyn-margin-bottom': `8px`, '--sc-dyn-display': `flex`, '--sc-dyn-justify-content': `center` });
            setIcon(iconDiv, style.icon || 'file');

            // Name
            const nameDiv = card.createDiv({ text: styleName.charAt(0).toUpperCase() + styleName.slice(1) });
            nameDiv.addClasses(['sc-var-font-weight', 'sc-var-color', 'sc-var-font-size']); nameDiv.setCssProps({ '--sc-dyn-font-weight': `500`, '--sc-dyn-color': `${style.bg}`, '--sc-dyn-font-size': `0.85rem` });

            // Modified dot
            if (isModified) {
                const modDot = card.createDiv({ text: 'â—' });
                modDot.addClass('sc-style-f69b2e98');
            }
        });
    }

    openStandardStyleEditor(styleName: string): void {
        const style = this.plugin.settings.standardStyles[styleName];
        if (!style) return;

        const editorModal = new Modal(this.app);
        editorModal.titleEl.setText(`Edit "${styleName}" Style`);

        const { contentEl } = editorModal;

        // Preview
        const previewDiv = contentEl.createDiv();
        previewDiv.addClasses(['sc-var-background', 'sc-var-border-left']);
        previewDiv.setCssProps({ '--sc-dyn-background': `color-mix(in srgb, ${style.bg} 15%, transparent)`, '--sc-dyn-border-left': `4px solid ${style.bg}` });
        previewDiv.addClass('sc-style-602659fe');
        previewDiv.addClass('sc-style-b59e4501');
        previewDiv.addClass('sc-style-d3297f95');

        const previewTitle = previewDiv.createEl('strong', { text: style.name });
        previewTitle.addClass('sc-var-color'); previewTitle.setCssProps({ '--sc-dyn-color': style.titleColor || style.bg  });
        previewDiv.createEl('br');
        const previewText = previewDiv.createEl('span', { text: 'Preview text content' });
        previewText.addClass('sc-var-color'); previewText.setCssProps({ '--sc-dyn-color': style.text || 'var(--text-normal)'  });

        const updatePreview = () => {
            previewDiv.addClasses(['sc-var-background', 'sc-var-border-left']);
            previewDiv.setCssProps({ '--sc-dyn-background': `color-mix(in srgb, ${style.bg} 15%, transparent)`, '--sc-dyn-border-left': `4px solid ${style.bg}` });
            previewTitle.textContent = style.name;
            previewTitle.addClass('sc-var-color'); previewTitle.setCssProps({ '--sc-dyn-color': style.titleColor || style.bg  });
            previewText.addClass('sc-var-color'); previewText.setCssProps({ '--sc-dyn-color': style.text || 'var(--text-normal)'  });
        };

        // Background color
        const bgRow = contentEl.createDiv();
        bgRow.addClass('sc-style-e9ebe922');
        bgRow.addClass('sc-style-d0da858a');
        bgRow.addClass('sc-style-2a117045');
        bgRow.addClass('sc-style-7b754eef');
        bgRow.createEl('label', { text: 'Background:' }).addClass('sc-style-019910d6');
        const bgInput = bgRow.createEl('input', { type: 'color', value: style.bg });
        bgInput.oninput = () => { style.bg = bgInput.value; style.border = bgInput.value; updatePreview(); };

        // Title color
        const titleRow = contentEl.createDiv();
        titleRow.addClass('sc-style-e9ebe922');
        titleRow.addClass('sc-style-d0da858a');
        titleRow.addClass('sc-style-2a117045');
        titleRow.addClass('sc-style-7b754eef');
        titleRow.createEl('label', { text: 'Title Color:' }).addClass('sc-style-019910d6');
        const titleInput = titleRow.createEl('input', { type: 'color', value: style.titleColor || style.bg });
        titleInput.oninput = () => { style.titleColor = titleInput.value; updatePreview(); };

        // Text color
        const textRow = contentEl.createDiv();
        textRow.addClass('sc-style-e9ebe922');
        textRow.addClass('sc-style-d0da858a');
        textRow.addClass('sc-style-2a117045');
        textRow.addClass('sc-style-d3297f95');
        textRow.createEl('label', { text: 'Text Color:' }).addClass('sc-style-019910d6');
        const textInput = textRow.createEl('input', { type: 'color', value: style.text || '#ffffff' });
        textInput.oninput = () => { style.text = textInput.value; updatePreview(); };

        // Buttons
        const buttons = contentEl.createDiv();
        buttons.addClass('sc-style-e9ebe922');
        buttons.addClass('sc-style-2a117045');

        const saveBtn = buttons.createEl('button', { text: 'Save' });
        saveBtn.addClass('sc-style-49cdf874');
        saveBtn.addClass('sc-style-440dce23');
        saveBtn.addClass('sc-style-5e0853c5');
        saveBtn.addClass('sc-style-4d6aa729');
        saveBtn.addClass('sc-style-3e0512b1');
        saveBtn.addClass('sc-style-602659fe');
        saveBtn.addClass('sc-style-24b531c6');
        saveBtn.onclick = () => {
            void (async () => {
                this.plugin.settings.standardStyles[styleName] = style;
                await this.plugin.saveSettings();
                editorModal.close();
                this.display();
            })();
        };

        const resetBtn = buttons.createEl('button', { text: 'Reset' });
        resetBtn.addClass('sc-style-5a53f8c5');
        resetBtn.addClass('sc-style-a1222d24');
        resetBtn.addClass('sc-style-4d6aa729');
        resetBtn.addClass('sc-style-3e0512b1');
        resetBtn.addClass('sc-style-602659fe');
        resetBtn.addClass('sc-style-24b531c6');
        resetBtn.onclick = () => {
            void (async () => {
                this.plugin.settings.standardStyles[styleName] = { ...DEFAULT_STANDARD_STYLES[styleName] };
                await this.plugin.saveSettings();
                editorModal.close();
                this.display();
            })();
        };

        const cancelBtn = buttons.createEl('button', { text: 'Cancel' });
        cancelBtn.addClass('sc-style-5a53f8c5');
        cancelBtn.addClass('sc-style-602659fe');
        cancelBtn.addClass('sc-style-24b531c6');
        cancelBtn.onclick = () => editorModal.close();

        editorModal.open();
    }

    createCustomStylesSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.addClass('sc-style-d3297f95');

        const sectionHeader = section.createDiv();
        sectionHeader.addClass('sc-style-3d41e2d2');

        (new Setting(sectionHeader).setName('Custom Callouts').setHeading().settingEl).addClass('sc-style-fc320a4f');

        if (this.editingIndex !== null) {
            const banner = section.createDiv();
            banner.addClass('sc-style-172a5f1d');
            banner.createSpan({ text: `Editing: ${this.tempName || 'Untitled'}` }).addClass('sc-style-647d6e41');
            const cancelBtn = banner.createEl('button', { text: 'Cancel' });
            cancelBtn.addClass('sc-style-8cf4511d');
            cancelBtn.onclick = () => {
                this.editingIndex = null;
                this.resetForm();
                this.display();
            };
        }

        // Creator card
        const creatorCard = section.createDiv();
        (creatorCard).addClass('sc-style-58b7f31a');

        // Quick presets section
        this.createPresetsSection(creatorCard);

        // Form inputs
        const previewBox = this.createFormSection(creatorCard);



        // Saved styles list
        if (this.plugin.settings.customStyles.length > 0) {
            this.createSavedStylesList(section, container);
        }
    }

    private createPresetsSection(creatorCard: HTMLElement): void {
        const presetsDiv = creatorCard.createDiv();
        presetsDiv.addClass('sc-style-7002f9ca');

        const presetsLabel = presetsDiv.createDiv();
        presetsLabel.addClass('sc-style-d9cf68d2');
        (presetsLabel.createEl('span', { text: 'Quick Start' })).addClass('sc-style-e9e540a9');
        presetsLabel.createDiv().addClass('sc-style-bf9d1c7c');

        const presetsGrid = presetsDiv.createDiv();
        presetsGrid.addClass('sc-style-d9c401ed');

        QUICK_START_PRESETS.forEach(preset => {
            const presetBtn = presetsGrid.createEl('button', { text: preset.name });
            (presetBtn).addClass('sc-style-e54bbf0b');
            presetBtn.onmouseover = () => { presetBtn.addClass('sc-var-border-color'); presetBtn.setCssProps({ '--sc-dyn-border-color': preset.border  }); presetBtn.addClass('sc-var-color'); presetBtn.setCssProps({ '--sc-dyn-color': preset.border  }); };
            presetBtn.onmouseout = () => { presetBtn.addClass('sc-style-fdf11a02'); presetBtn.addClass('sc-style-f31841c1'); };
            presetBtn.onclick = () => {
                this.tempName = preset.name.toLowerCase() + '-style';
                this.tempBg = preset.bg;
                this.tempBorder = preset.border;
                this.tempTitleColor = preset.title;
                this.tempText = preset.text;
                this.tempIcon = preset.icon;
                this.display();
            };
        });

        const randomBtn = presetsGrid.createEl('button');
        (randomBtn).addClass('sc-style-aebc428a');
        setIcon(randomBtn.createSpan(), 'dice');
        randomBtn.createSpan({ text: 'Random' }); // Just 'Random' to fit grid
        randomBtn.onmouseover = () => { randomBtn.addClass('sc-style-5e0853c5'); randomBtn.addClass('sc-style-f6234f9f'); };
        randomBtn.onmouseout = () => { randomBtn.addClass('sc-style-403789f1'); randomBtn.addClass('sc-style-f31841c1'); };
        randomBtn.onclick = () => {
            this.applyRandomStyle();
            this.display();
        };
    }

    private createFormSection(creatorCard: HTMLElement): HTMLElement {
        // --- 1. PREVIEW (Top, full width) ---
        const previewLabel = creatorCard.createDiv();
        previewLabel.addClass('sc-style-6751f8e3');
        (previewLabel.createEl('span', { text: 'Live Preview' })).addClass('sc-style-1906f84d');
        previewLabel.createDiv().addClass('sc-style-bf9d1c7c');

        const previewBox = creatorCard.createDiv({ cls: 'callout' });
        previewBox.addClass('sc-style-a780619a');

        // --- 2. CONTROLS GRID ---
        const gridContainer = creatorCard.createDiv();
        gridContainer.addClass('sc-style-e03f38d6');

        const leftCol = gridContainer.createDiv();
        leftCol.addClass('sc-style-6a4f6b63');

        const rightCol = gridContainer.createDiv();
        rightCol.addClass('sc-style-6a4f6b63');

        // === LEFT COLUMN (Visuals) ===

        // PANEL: IDENTITY
        const identityPanel = leftCol.createDiv();
        this.createPanelHeader(identityPanel, 'Identity');

        const identityGrid = identityPanel.createDiv();
        identityGrid.addClass('sc-style-7499c745');

        // Name
        const nameGroup = identityGrid.createDiv();
        (nameGroup.createEl('label', { text: 'Style Name' })).addClass('sc-style-c17b7822');
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my-style' });
        nameInput.addClass('sc-style-293faa8a');
        nameInput.value = this.tempName;
        nameInput.oninput = () => { this.tempName = nameInput.value; this.updatePreview(previewBox); };

        // Icon
        const iconGroup = identityGrid.createDiv();
        (iconGroup.createEl('label', { text: 'Icon' })).addClass('sc-style-c17b7822');

        const iconWrapper = iconGroup.createDiv();
        iconWrapper.addClass('sc-style-4a5d9a10');
        const iconInput = iconWrapper.createEl('input', { type: 'text' });
        iconInput.addClass('sc-style-f0b13e17');
        iconInput.value = this.tempIcon;
        iconInput.oninput = () => { this.tempIcon = iconInput.value; this.updatePreview(previewBox); };

        const iconSearchBtn = iconWrapper.createEl('button');
        iconSearchBtn.addClass('sc-style-d84b68f5');
        setIcon(iconSearchBtn, 'search');
        iconSearchBtn.onclick = () => {
            new IconPickerModal(this.app, (selected) => {
                this.tempIcon = selected;
                iconInput.value = selected;
                this.updatePreview(previewBox);
            }).open();
        };

        // PANEL: COLORS
        const colorsPanel = leftCol.createDiv();
        this.createPanelHeader(colorsPanel, 'Palette');

        const colorsGrid = colorsPanel.createDiv();
        colorsGrid.addClass('sc-style-578b24de');

        const colorConfigs = [
            { label: 'Background', val: () => this.tempBg, set: (v: string) => this.tempBg = v },
            { label: 'Border', val: () => this.tempBorder, set: (v: string) => this.tempBorder = v },
            { label: 'Title', val: () => this.tempTitleColor, set: (v: string) => this.tempTitleColor = v },
            { label: 'Text', val: () => this.tempText, set: (v: string) => this.tempText = v },
            { label: 'Link', val: () => this.tempLink, set: (v: string) => this.tempLink = v }
        ];

        colorConfigs.forEach(c => {
            const row = colorsGrid.createDiv();
            row.addClass('sc-style-b55d3587');

            (row.createEl('label', { text: c.label })).addClass('sc-style-42d3744b');

            const hexInput = row.createEl('input', { type: 'text' });
            hexInput.addClass('sc-style-187fb37d');
            hexInput.value = c.val().toUpperCase();

            const wrapper = row.createDiv();
            wrapper.addClass('sc-style-a822468c');
            const picker = wrapper.createEl('input', { type: 'color' });
            picker.addClass('sc-style-4c6420cf');
            picker.value = c.val();

            const display = wrapper.createDiv();
            display.addClasses(['sc-var-width', 'sc-var-height', 'sc-var-background', 'sc-var-pointer-events']); display.setCssProps({ '--sc-dyn-width': `100%`, '--sc-dyn-height': `100%`, '--sc-dyn-background': `${c.val()}`, '--sc-dyn-pointer-events': `none` });

            picker.oninput = (e: any) => {
                c.set(e.target.value);
                display.addClass('sc-var-background'); display.setCssProps({ '--sc-dyn-background': e.target.value  });
                hexInput.value = e.target.value.toUpperCase();
                this.updatePreview(previewBox);
            };

            hexInput.onchange = (e: any) => {
                let v = e.target.value;
                if (!v.startsWith('#')) v = '#' + v;
                if (isValidHex(v)) {
                    v = normalizeHex(v);
                    c.set(v);
                    picker.value = v;
                    display.addClass('sc-var-background'); display.setCssProps({ '--sc-dyn-background': v  });
                    this.updatePreview(previewBox);
                } else {
                    hexInput.value = c.val().toUpperCase();
                }
            };
            wrapper.appendChild(display);
            wrapper.appendChild(picker);
        });

        // PANEL: EFFECTS
        const effectsPanel = leftCol.createDiv();
        this.createPanelHeader(effectsPanel, 'Effects');

        // Neon
        const neonRow = effectsPanel.createDiv();
        neonRow.addClass('sc-style-7d958f55');

        const neonLabel = neonRow.createDiv();
        neonLabel.createDiv({ text: 'Neon Glow' }).addClass('sc-style-60315bed');

        const neonControls = neonRow.createDiv();
        neonControls.addClass('sc-style-bd9db1cb');

        const neonPicker = neonControls.createEl('input', { type: 'color' });
        neonPicker.addClass('sc-style-c02a4b3f');
        neonPicker.value = this.tempNeon || '#000000';

        const neonToggle = new ToggleComponent(neonControls);
        neonToggle.setValue(!!this.tempNeon);
        neonToggle.onChange(val => {
            if (val) {
                this.tempNeon = neonPicker.value;
            } else {
                this.tempNeon = '';
            }
            this.updatePreview(previewBox);
        });

        neonPicker.oninput = (e: any) => {
            if (neonToggle.getValue()) {
                this.tempNeon = e.target.value;
                this.updatePreview(previewBox);
            }
        };

        // === RIGHT COLUMN (Layout) ===

        // PANEL: TYPOGRAPHY
        const typoPanel = rightCol.createDiv();
        this.createPanelHeader(typoPanel, 'Typography');

        const typoGrid = typoPanel.createDiv();
        typoGrid.addClass('sc-style-7499c745');

        const fontGroup = typoGrid.createDiv();
        (fontGroup.createEl('label', { text: 'Font Family' })).addClass('sc-style-c17b7822');
        const fontSelect = new DropdownComponent(fontGroup);
        fontSelect.selectEl.addClass('sc-style-199b6f0e');
        fontSelect.addOption('', 'Default');
        Object.keys(FONT_FAMILIES).forEach(f => fontSelect.addOption(f, f.charAt(0).toUpperCase() + f.slice(1)));
        fontSelect.setValue(this.tempFont);
        fontSelect.onChange(val => { this.tempFont = val; this.updatePreview(previewBox); });

        const sizeGroup = typoGrid.createDiv();
        (sizeGroup.createEl('label', { text: 'Size' })).addClass('sc-style-c17b7822');
        const sizeSelect = new DropdownComponent(sizeGroup);
        sizeSelect.selectEl.addClass('sc-style-199b6f0e');
        Object.keys(FONT_SIZES).forEach(s => sizeSelect.addOption(s, s));
        sizeSelect.setValue(this.tempFontSize.toString());
        sizeSelect.onChange(val => { this.tempFontSize = parseInt(val); this.updatePreview(previewBox); });


        // PANEL: STRUCTURE
        const structPanel = rightCol.createDiv();
        this.createPanelHeader(structPanel, 'Structure');

        // Border Style
        const bsRow = structPanel.createDiv();
        bsRow.addClass('sc-style-7b754eef');
        (bsRow.createEl('label', { text: 'Border Style' })).addClass('sc-style-c17b7822');
        const bsSelect = new DropdownComponent(bsRow);
        bsSelect.selectEl.addClass('sc-style-199b6f0e');
        ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'].forEach(s => bsSelect.addOption(s, s));
        bsSelect.setValue(this.tempBorderStyle || 'solid');
        bsSelect.onChange(val => { this.tempBorderStyle = val; this.updatePreview(previewBox); });

        // Sliders
        const createSliderRow = (label: string, value: string, setter: (v: string) => void, min: number, max: number, step: number) => {
            const row = structPanel.createDiv();
            row.addClass('sc-style-7b754eef');
            const header = row.createDiv();
            header.addClass('sc-style-952640c5');
            (header.createEl('label', { text: label })).addClass('sc-style-5b6de27b');
            const valLabel = header.createSpan({ text: value || 'Default' });
            valLabel.addClass('sc-style-af89d6d6');

            const slider = new SliderComponent(row);
            slider.sliderEl.addClass('sc-style-199b6f0e');
            slider.setLimits(min, max, step);
            const numVal = parseFloat(value) || 0;
            slider.setValue(numVal);
            slider.onChange(v => {
                const newVal = v === 0 ? '' : v.toString();
                setter(newVal);
                valLabel.setText(newVal || 'Default');
                this.updatePreview(previewBox);
            });
        };

        createSliderRow('Border Thickness', this.tempBorderWidth, (v) => this.tempBorderWidth = v, 0, 20, 1);
        createSliderRow('Corner Radius', this.tempBorderRadius, (v) => this.tempBorderRadius = v, 0, 50, 1);


        // PANEL: LAYOUT
        const layoutPanel = rightCol.createDiv();
        layoutPanel.createDiv().addClass('sc-style-07f9c2fc');
        this.createPanelHeader(layoutPanel, 'Layout Modes');

        const createToggleRow = (label: string, value: boolean, setter: (v: boolean) => void) => {
            const row = layoutPanel.createDiv();
            row.addClass('sc-style-deeba9b8');
            row.createSpan({ text: label }).addClass('sc-style-647d6e41');
            const t = new ToggleComponent(row);
            t.setValue(value);
            t.onChange(v => { setter(v); this.updatePreview(previewBox); });
        };

        createToggleRow('Compact Mode', this.tempCompact, (v) => this.tempCompact = v);
        createToggleRow('Hide Icon', this.tempNoIcon, (v) => this.tempNoIcon = v);


        // --- ACTION BUTTONS ---
        const actionsContainer = creatorCard.createDiv();
        actionsContainer.addClass('sc-style-aefcf1a5');

        this.renderActionButtons(actionsContainer, previewBox); // Call new helper

        this.updatePreview(previewBox);
        return previewBox;
    }

    private renderActionButtons(container: HTMLElement, previewBox: HTMLElement): void {
        const row = container.createDiv();
        row.addClass('sc-style-5b95e9cb');

        const leftGroup = row.createDiv();
        leftGroup.addClass('sc-style-295223d1');

        const exportBtn = leftGroup.createEl('button');
        exportBtn.addClass('sc-style-7e45aa8b');
        setIcon(exportBtn, 'upload');
        exportBtn.createSpan({ text: 'Export' });
        exportBtn.onclick = async () => {
            const styleData = this.getStyleFromForm();
            try {
                await navigator.clipboard.writeText(JSON.stringify(styleData, null, 2));
                new Notice('Style JSON copied to clipboard!');
            } catch (e) {}
        };

        const importBtn = leftGroup.createEl('button');
        importBtn.addClass('sc-style-7e45aa8b');
        setIcon(importBtn, 'download');
        importBtn.createSpan({ text: 'Import' });
        importBtn.onclick = () => {
            new ImportStyleModal(this.app, this.plugin.settings, (imported: any) => {
                this.loadStyleToForm(imported);
                this.updatePreview(previewBox);
                new Notice('Imported!');
            }).open();
        };

        const cancelBtn = row.createEl('button', { text: 'Reset' });
        cancelBtn.onclick = () => {
            this.resetForm();
            this.editingIndex = null;
            this.updatePreview(previewBox);
            this.display();
        };

        const saveBtn = row.createEl('button', { text: this.editingIndex !== null ? 'Update Style' : 'Create Style' });
        saveBtn.addClass('sc-style-b01285b3');
        saveBtn.onclick = async () => {
            await this.saveCurrentStyle();
            this.resetForm();
            this.display();
        };
    }

    private OLD_createFormSection(creatorCard: HTMLElement): HTMLElement {
        // Name & Icon row
        const topRow = creatorCard.createDiv();
        topRow.addClass('sc-style-06b211e9');

        // Name input
        const nameGroup = topRow.createDiv();
        (nameGroup.createEl('label', { text: 'Name' })).addClass('sc-style-169e9fa4');
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my-callout' });
        nameInput.addClass('sc-style-e59b57c9');
        nameInput.value = this.tempName;

        // Icon input
        const iconGroup = topRow.createDiv();
        (iconGroup.createEl('label', { text: 'Icon' })).addClass('sc-style-169e9fa4');

        const iconWrapper = iconGroup.createDiv();
        iconWrapper.addClass('sc-style-4a5d9a10');

        const iconInput = iconWrapper.createEl('input', { type: 'text', placeholder: 'star' });
        iconInput.addClass('sc-style-0ac45602');
        iconInput.value = this.tempIcon;

        const iconBtn = iconWrapper.createEl('button');
        iconBtn.addClass('sc-style-bf8cdf4e');
        setIcon(iconBtn, 'search');
        iconBtn.title = 'Browse Icons';

        iconBtn.onmouseover = () => { iconBtn.addClass('sc-style-5332d565'); iconBtn.addClass('sc-style-f31841c1'); };
        iconBtn.onmouseout = () => { iconBtn.addClass('sc-style-fdf11a02'); iconBtn.addClass('sc-style-7abb3a4e'); };

        iconBtn.onclick = () => {
            new IconPickerModal(this.app, (selectedIcon) => {
                this.tempIcon = selectedIcon;
                iconInput.value = selectedIcon;
                this.updatePreview(previewBox);
            }).open();
        };

        // Typography Row
        const typoRow = creatorCard.createDiv();
        typoRow.addClass('sc-style-06b211e9');

        // Font Family
        const fontGroup = typoRow.createDiv();
        (fontGroup.createEl('label', { text: 'Font Family' })).addClass('sc-style-169e9fa4');

        const fontSelect = new DropdownComponent(fontGroup);
        fontSelect.selectEl.addClass('sc-style-199b6f0e');
        fontSelect.selectEl.addClass('sc-style-403789f1');

        fontSelect.addOption('', 'Default');
        Object.keys(FONT_FAMILIES).forEach(f => fontSelect.addOption(f, f.charAt(0).toUpperCase() + f.slice(1)));

        fontSelect.setValue(this.tempFont);
        fontSelect.onChange((val) => {
            this.tempFont = val;
            this.updatePreview(previewBox);
        });

        // Font Size
        const sizeGroup = typoRow.createDiv();
        (sizeGroup.createEl('label', { text: 'Size' })).addClass('sc-style-169e9fa4');

        const sizeSelect = new DropdownComponent(sizeGroup);
        sizeSelect.selectEl.addClass('sc-style-199b6f0e');
        sizeSelect.selectEl.addClass('sc-style-403789f1');

        Object.keys(FONT_SIZES).forEach(s => sizeSelect.addOption(s, s === '3' ? '3 (Normal)' : s));

        sizeSelect.setValue(this.tempFontSize.toString());
        sizeSelect.onChange((val) => {
            this.tempFontSize = parseInt(val);
            this.updatePreview(previewBox);
        });

        // Colors label
        const colorsLabel = creatorCard.createDiv();
        colorsLabel.addClass('sc-style-d9cf68d2');
        (colorsLabel.createEl('span', { text: 'Colors' })).addClass('sc-style-e9e540a9');
        colorsLabel.createDiv().addClass('sc-style-bf9d1c7c');

        // Colors grid
        const colorsGrid = creatorCard.createDiv();
        colorsGrid.addClass('sc-style-47bdaa88');

        const colorConfigs = [
            { label: 'BG', value: () => this.tempBg, setter: (v: string) => this.tempBg = v },
            { label: 'Border', value: () => this.tempBorder, setter: (v: string) => this.tempBorder = v },
            { label: 'Title', value: () => this.tempTitleColor, setter: (v: string) => this.tempTitleColor = v },
            { label: 'Text', value: () => this.tempText, setter: (v: string) => this.tempText = v },
            { label: 'Link', value: () => this.tempLink, setter: (v: string) => this.tempLink = v }
        ];

        // Preview
        const previewLabel = creatorCard.createDiv();
        previewLabel.addClass('sc-style-6751f8e3');
        (previewLabel.createEl('span', { text: 'Preview' })).addClass('sc-style-e9e540a9');
        previewLabel.createDiv().addClass('sc-style-bf9d1c7c');

        const previewBox = creatorCard.createDiv({ cls: 'callout' });
        previewBox.addClass('sc-style-d3277930');

        colorConfigs.forEach(config => {
            const colorItem = colorsGrid.createDiv();
            colorItem.addClass('sc-style-cdbe310e');

            const colorLabel = colorItem.createEl('label', { text: config.label });
            colorLabel.addClass('sc-style-5989156b');

            const colorPicker = colorItem.createEl('input', { type: 'color' });
            colorPicker.addClass('sc-style-5ed30816');
            colorPicker.value = config.value();

            const hexInput = colorItem.createEl('input', { type: 'text' });
            hexInput.addClass('sc-style-9cf4d32c');
            hexInput.value = config.value().toUpperCase();
            hexInput.placeholder = '#FFFFFF';

            colorPicker.addEventListener('input', (e) => {
                const newValue = (e.target as HTMLInputElement).value;
                config.setter(newValue);
                hexInput.value = newValue.toUpperCase();
                this.updatePreview(previewBox);
            });

            hexInput.addEventListener('input', (e) => {
                let val = (e.target as HTMLInputElement).value;
                if (!val.startsWith('#')) val = '#' + val;
                if (isValidHex(val)) {
                    const normalized = normalizeHex(val);
                    config.setter(normalized);
                    colorPicker.value = normalized;
                    this.updatePreview(previewBox);
                }
            });

            hexInput.addEventListener('blur', () => {
                hexInput.value = config.value().toUpperCase();
            });
        });

        nameInput.oninput = () => { this.tempName = nameInput.value; this.updatePreview(previewBox); };
        iconInput.oninput = () => { this.tempIcon = iconInput.value; this.updatePreview(previewBox); };

        this.updatePreview(previewBox);
        return previewBox;
    }

    private createActionButtons(creatorCard: HTMLElement, section: HTMLElement, previewBox: HTMLElement): void {
        const bottomRow = creatorCard.createDiv();
        bottomRow.addClass('sc-style-c955cbf4');

        const leftGroup = bottomRow.createDiv();
        leftGroup.addClass('sc-style-47c52002');

        const toggleRow = leftGroup.createDiv();
        toggleRow.addClass('sc-style-bd9db1cb');
        const toggle = toggleRow.createEl('input', { type: 'checkbox' });
        toggle.checked = this.tempBoldBorder;
        toggle.addClass('sc-style-094a63df');
        toggle.onchange = () => { this.tempBoldBorder = toggle.checked; this.updatePreview(previewBox); };
        (toggleRow.createEl('span', { text: 'Bold border' })).addClass('sc-style-15aacc3a');

        const centerToggle = toggleRow.createEl('input', { type: 'checkbox' });
        centerToggle.checked = this.tempCenter;
        centerToggle.addClass('sc-style-094a63df');
        centerToggle.onchange = () => { this.tempCenter = centerToggle.checked; this.updatePreview(previewBox); };
        (toggleRow.createEl('span', { text: 'Center' })).addClass('sc-style-15aacc3a');

        const titleCenterToggle = toggleRow.createEl('input', { type: 'checkbox' });
        titleCenterToggle.checked = this.tempTitleCenter;
        titleCenterToggle.addClass('sc-style-094a63df');
        titleCenterToggle.onchange = () => { this.tempTitleCenter = titleCenterToggle.checked; this.updatePreview(previewBox); };
        (toggleRow.createEl('span', { text: 'Title Center' })).addClass('sc-style-acb67b42');

        // ------------------------------------------------------------
        // IMPORT / EXPORT BUTTONS
        // ------------------------------------------------------------
        const ioGroup = leftGroup.createDiv();
        ioGroup.addClass('sc-style-ff941712');

        // EXPORT BUTTON
        const exportBtn = ioGroup.createEl('button');
        (exportBtn).addClass('sc-style-c7d21299');
        setIcon(exportBtn, 'upload'); // Changed from 'download'
        const expLabel = exportBtn.createSpan({ text: 'Export' });
        exportBtn.title = 'Copy current style to clipboard as JSON';

        exportBtn.onmouseover = () => { exportBtn.addClass('sc-style-f31841c1'); exportBtn.addClass('sc-style-5332d565'); };
        exportBtn.onmouseout = () => { exportBtn.addClass('sc-style-7abb3a4e'); exportBtn.addClass('sc-style-fdf11a02'); };

        exportBtn.onclick = async () => {
            const styleData = {
                name: this.tempName,
                bg: this.tempBg,
                border: this.tempBorder,
                text: this.tempText,
                link: this.tempLink,
                titleColor: this.tempTitleColor,
                icon: this.tempIcon,
                boldBorder: this.tempBoldBorder,
                center: this.tempCenter,
                titleCenter: this.tempTitleCenter
            };

            try {
                await navigator.clipboard.writeText(JSON.stringify(styleData, null, 2));
                new Notice('Style JSON copied to clipboard!');
                exportBtn.addClass('sc-style-b2ac600d');
                exportBtn.addClass('sc-style-f6234f9f');
                window.setTimeout(() => {
                    exportBtn.addClass('sc-style-403789f1');
                    exportBtn.addClass('sc-style-7abb3a4e');
                }, 1000);
            } catch (err) {
                new Notice('Failed to copy to clipboard.');
                console.error(err);
            }
        };

        // IMPORT BUTTON
        const importBtn = ioGroup.createEl('button');
        (importBtn).addClass('sc-style-c7d21299');
        setIcon(importBtn, 'download'); // Changed from 'upload'
        importBtn.createSpan({ text: 'Import' });
        importBtn.title = 'Paste JSON style';

        importBtn.onmouseover = () => { importBtn.addClass('sc-style-f31841c1'); importBtn.addClass('sc-style-5332d565'); };
        importBtn.onmouseout = () => { importBtn.addClass('sc-style-7abb3a4e'); importBtn.addClass('sc-style-fdf11a02'); };

        importBtn.onclick = () => {
            const modal = new ImportStyleModal(this.app, this.plugin.settings, (importedStyle: any) => {
                // Apply imported style to form
                this.tempName = importedStyle.name || this.tempName;
                this.tempBg = importedStyle.bg || this.tempBg;
                this.tempBorder = importedStyle.border || this.tempBorder;
                this.tempText = importedStyle.text || this.tempText;
                this.tempLink = importedStyle.link || this.tempLink;
                this.tempTitleColor = importedStyle.titleColor || this.tempBg;
                this.tempIcon = importedStyle.icon || this.tempIcon;
                this.tempBoldBorder = importedStyle.boldBorder || false;

                // Refresh UI
                this.display();
                new Notice('Style imported successfully!');
            });
            modal.open();
        };

        const buttonsRow = bottomRow.createDiv();
        buttonsRow.addClass('sc-style-0ed0e90f');

        // Cancel button
        const cancelBtn = buttonsRow.createEl('button', { text: 'Cancel' });
        (cancelBtn).addClass('sc-style-cf7c062c');
        cancelBtn.onmouseover = () => cancelBtn.addClass('sc-style-d0def548');
        cancelBtn.onmouseout = () => cancelBtn.addClass('sc-style-2128f674');
        cancelBtn.onclick = () => {
            this.editingIndex = null;
            this.resetForm();
            this.display();
        };

        // Save button
        const saveBtn = buttonsRow.createEl('button', { text: this.editingIndex !== null ? 'Update Style' : 'Save Style' });
        (saveBtn).addClass('sc-style-3459676a');
        saveBtn.onmouseover = () => saveBtn.addClass('sc-style-d0def548');
        saveBtn.onmouseout = () => saveBtn.addClass('sc-style-2128f674');
        saveBtn.onclick = async () => {
            if (this.tempName) {
                // Check for duplicate names
                const existingIndex = this.plugin.settings.customStyles.findIndex(
                    s => s.name.toLowerCase() === this.tempName.toLowerCase()
                );

                if (existingIndex !== -1 && existingIndex !== this.editingIndex) {
                    const errorDiv = creatorCard.querySelector('.duplicate-error');
                    if (errorDiv) errorDiv.remove();

                    const error = creatorCard.createDiv({ cls: 'duplicate-error' });
                    error.addClass('sc-style-eb4140ec');
                    error.textContent = `A style named "${this.tempName}" already exists. Please use a different name.`;

                    window.setTimeout(() => error.remove(), 3000);
                    return;
                }

                const newStyle: CalloutStyle = {
                    name: this.tempName,
                    bg: this.tempBg,
                    border: this.tempBorder,
                    text: this.tempText,
                    link: this.tempLink,
                    icon: this.tempIcon,
                    titleColor: this.tempTitleColor,
                    boldBorder: this.tempBoldBorder,
                    font: this.tempFont,
                    fontSize: this.tempFontSize,
                    center: this.tempCenter,
                    titleCenter: this.tempTitleCenter
                };

                if (this.editingIndex !== null) {
                    this.plugin.settings.customStyles[this.editingIndex] = newStyle;
                    this.editingIndex = null;
                } else {
                    this.plugin.settings.customStyles.push(newStyle);
                }

                await this.plugin.saveSettings();
                this.resetForm();
                this.display();
            }
        };
    }

    private createSavedStylesList(section: HTMLElement, container: HTMLElement): void {
        const savedHeader = section.createDiv();
        savedHeader.addClass('sc-style-aceab0cc');

        const headerTitle = new Setting(savedHeader).setName('Saved Styles' ).setHeading();
        headerTitle.addClass('sc-style-e2b74ba6');

        const viewToggle = savedHeader.createDiv();
        viewToggle.addClass('sc-style-9d612677');

        const gridBtn = viewToggle.createEl('button', { text: 'Grid' });
        gridBtn.addClasses(['sc-var-padding', 'sc-var-border', 'sc-var-background', 'sc-var-color', 'sc-var-border-radius', 'sc-var-cursor', 'sc-var-font-size']);
        gridBtn.setCssProps({
            '--sc-dyn-padding': '5px 12px',
            '--sc-dyn-border': '1px solid var(--background-modifier-border)',
            '--sc-dyn-background': this.stylesViewMode === 'grid' ? 'var(--interactive-accent)' : 'var(--background-primary)',
            '--sc-dyn-color': this.stylesViewMode === 'grid' ? 'white' : 'var(--text-normal)',
            '--sc-dyn-border-radius': '4px',
            '--sc-dyn-cursor': 'pointer',
            '--sc-dyn-font-size': '0.8rem'
        });
        gridBtn.onclick = () => { this.stylesViewMode = 'grid'; this.display(); };

        const listBtn = viewToggle.createEl('button', { text: 'List' });
        listBtn.addClasses(['sc-var-padding', 'sc-var-border', 'sc-var-background', 'sc-var-color', 'sc-var-border-radius', 'sc-var-cursor', 'sc-var-font-size']);
        listBtn.setCssProps({
            '--sc-dyn-padding': '5px 12px',
            '--sc-dyn-border': '1px solid var(--background-modifier-border)',
            '--sc-dyn-background': this.stylesViewMode === 'list' ? 'var(--interactive-accent)' : 'var(--background-primary)',
            '--sc-dyn-color': this.stylesViewMode === 'list' ? 'white' : 'var(--text-normal)',
            '--sc-dyn-border-radius': '4px',
            '--sc-dyn-cursor': 'pointer',
            '--sc-dyn-font-size': '0.8rem'
        });
        listBtn.onclick = () => { this.stylesViewMode = 'list'; this.display(); };

        const stylesContainer = section.createDiv();
        stylesContainer.style.cssText = this.stylesViewMode === 'grid'
            ? 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;'
            : 'display: flex; flex-direction: column; gap: 10px;';

        this.plugin.settings.customStyles.forEach((s, i) => {
            this.renderStyleCard(stylesContainer, s, i, container);
        });
    }

    private renderStyleCard(stylesContainer: HTMLElement, s: CalloutStyle, i: number, container: HTMLElement): void {
        const card = stylesContainer.createDiv();
        card.addClass('sc-style-3b7a3f0f');

        const header = card.createDiv();
        header.addClass('sc-style-f2099010');

        const title = new Setting(header).setName(s.name ).setHeading();
        title.settingEl.addClass('sc-style-7f76fe22');

        const actions = header.createDiv();
        actions.addClass('sc-style-91550526');

        const editBtn = actions.createEl('button');
        editBtn.addClass('sc-style-657651d1');
        setIcon(editBtn, 'pencil');
        editBtn.onclick = () => {
            this.editingIndex = i;
            this.tempName = s.name;
            this.tempIcon = s.icon;
            this.tempBg = s.bg;
            this.tempBorder = s.border;
            this.tempText = s.text;
            this.tempLink = s.link;
            this.tempTitleColor = s.titleColor || s.bg;
            this.tempBoldBorder = s.boldBorder || false;
            this.tempFont = s.font || '';
            this.tempFontSize = s.fontSize || 3;
            this.tempCenter = s.center || false;
            this.tempTitleCenter = s.titleCenter || false;
            this.display();
            container.scrollIntoView({ behavior: 'smooth' });
        };

        const deleteBtn = actions.createEl('button');
        deleteBtn.addClass('sc-style-657651d1');
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.onclick = async () => {
            this.plugin.settings.customStyles.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
        };

        if (this.stylesViewMode === 'grid') {
            const preview = card.createDiv();
            const borderWidth = s.boldBorder ? '5px' : '2px';
            preview.addClasses(['sc-var-background', 'sc-var-border', 'sc-var-border-left', 'sc-var-border-radius', 'sc-var-padding', 'sc-var-margin-bottom']); preview.setCssProps({ '--sc-dyn-background': `linear-gradient(135deg, ${s.bg}15 0%, ${s.border}25 100%)`, '--sc-dyn-border': `1px solid ${s.border}30`, '--sc-dyn-border-left': `${borderWidth} solid ${s.bg}`, '--sc-dyn-border-radius': `6px`, '--sc-dyn-padding': `10px`, '--sc-dyn-margin-bottom': `8px` });

            const previewTitle = preview.createDiv();
            previewTitle.addClasses(['sc-var-display', 'sc-var-align-items', 'sc-var-gap', 'sc-var-font-weight', 'sc-var-font-size', 'sc-var-color']); previewTitle.setCssProps({ '--sc-dyn-display': `flex`, '--sc-dyn-align-items': `center`, '--sc-dyn-gap': `6px`, '--sc-dyn-font-weight': `600`, '--sc-dyn-font-size': `0.9rem`, '--sc-dyn-color': `${s.titleColor || s.bg}` });

            const icon = previewTitle.createSpan();
            icon.addClasses(['sc-var-display', 'sc-var-color']); icon.setCssProps({ '--sc-dyn-display': `inline-flex`, '--sc-dyn-color': `${s.titleColor || s.bg}` });
            setIcon(icon, s.icon || 'box');

            previewTitle.createSpan({ text: 'Sample Callout' });

            const previewContent = preview.createDiv();
            previewContent.addClasses(['sc-var-color', 'sc-var-font-size', 'sc-var-margin-top', 'sc-var-line-height']); previewContent.setCssProps({ '--sc-dyn-color': `${s.text}`, '--sc-dyn-font-size': `0.85rem`, '--sc-dyn-margin-top': `6px`, '--sc-dyn-line-height': `1.4` });

            // Apply font to preview card
            if (s.font && FONT_FAMILIES[s.font]) {
                preview.addClass('sc-var-font-family'); preview.setCssProps({ '--sc-dyn-font-family': FONT_FAMILIES[s.font]  });
            }

            previewContent.textContent = 'This is how your callout will look with ';

            const link = previewContent.createEl('a', { text: 'a link', href: '#' });
            link.addClasses(['sc-var-color', 'sc-var-text-decoration']); link.setCssProps({ '--sc-dyn-color': `${s.link}`, '--sc-dyn-text-decoration': `underline` });
            link.onclick = (e: Event) => e.preventDefault();

            previewContent.appendText(' inside.');
        }

        const details = card.createDiv();
        details.addClass('sc-style-1c86c501');

        const iconBadge = details.createEl('span', { text: `Icon: ${s.icon}` });
        iconBadge.addClass('sc-style-1fc12529');

        if (s.boldBorder) {
            const boldBadge = details.createEl('span', { text: 'Bold Border' });
            boldBadge.addClass('sc-style-1fc12529');
        }

        if (s.titleColor && s.titleColor !== s.bg) {
            const titleBadge = details.createEl('span', { text: `Title: ${s.titleColor}` });
            titleBadge.addClass('sc-style-1fc12529');
        }
    }

    createStandardColorsSection(container: HTMLElement): void {
        const section = container.createEl('details');
        section.open = false;
        const summary = section.createEl('summary');
        summary.addClass('sc-style-4a36afb4');
        summary.textContent = 'Standard Colors';

        Object.keys(this.plugin.settings.standardColors).forEach(colorName => {
            if (colorName === 'gray') return;

            const setting = new Setting(section)
                .setName(colorName.charAt(0).toUpperCase() + colorName.slice(1));

            setting.controlEl.addClass('sc-style-cf62ce6f');

            setting.addText(t => {
                t.inputEl.addClass('sc-style-1f4df890');
                t.setValue(this.plugin.settings.standardColors[colorName])
                    .setPlaceholder('#FFFFFF')
                    .onChange(async (v) => {
                        if (isValidHex(v)) {
                            this.plugin.settings.standardColors[colorName] = normalizeHex(v);
                            if (colorName === 'grey') this.plugin.settings.standardColors['gray'] = normalizeHex(v);
                            await this.plugin.saveSettings();
                        }
                    });
            }).then((setting) => {
                // Native color picker — replaces deprecated addColorPicker()
                const colorInput = setting.controlEl.createEl('input', { type: 'color' });
                colorInput.value = this.plugin.settings.standardColors[colorName];
                colorInput.addEventListener('change', async () => {
                    const v = colorInput.value.toUpperCase();
                    this.plugin.settings.standardColors[colorName] = v;
                    if (colorName === 'grey') this.plugin.settings.standardColors['gray'] = v;
                    await this.plugin.saveSettings();
                    this.display();
                });
            });
        });
    }

    createCustomColorsSection(container: HTMLElement): void {
        const section = container.createEl('details');
        section.open = false;
        const summary = section.createEl('summary');
        summary.addClass('sc-style-e26ab750');
        summary.textContent = 'Custom Colors';

        const addColorRow = section.createDiv();
        addColorRow.addClass('sc-style-866166c3');

        const nameInput = addColorRow.createEl('input', { type: 'text', placeholder: 'Color name' });
        nameInput.addClass('sc-style-fff60487');

        const colorPicker = addColorRow.createEl('input', { type: 'color' });
        colorPicker.addClass('sc-style-1c8a9c7b');
        colorPicker.value = this.newCustomColorHex;

        const hexInput = addColorRow.createEl('input', { type: 'text', placeholder: '#FFFFFF' });
        hexInput.addClass('sc-style-8176cb6c');
        hexInput.value = this.newCustomColorHex;

        nameInput.addEventListener('input', (e) => this.newCustomColorName = (e.target as HTMLInputElement).value);

        hexInput.addEventListener('input', (e) => {
            let v = (e.target as HTMLInputElement).value;
            if (!v.startsWith('#')) v = '#' + v;
            if (isValidHex(v)) {
                this.newCustomColorHex = normalizeHex(v);
                colorPicker.value = this.newCustomColorHex;
            }
        });

        colorPicker.addEventListener('input', (e) => {
            this.newCustomColorHex = (e.target as HTMLInputElement).value;
            hexInput.value = this.newCustomColorHex.toUpperCase();
        });

        const addBtn = addColorRow.createEl('button', { text: 'Add' });
        addBtn.addClass('sc-style-915f964b');
        addBtn.onclick = async () => {
            if (this.newCustomColorName.trim() && isValidHex(this.newCustomColorHex)) {
                this.plugin.settings.customColors.push({
                    name: this.newCustomColorName.trim(),
                    hex: this.newCustomColorHex
                });
                await this.plugin.saveSettings();
                nameInput.value = '';
                hexInput.value = '#FFFFFF';
                this.newCustomColorName = '';
                this.newCustomColorHex = '#FFFFFF';
                colorPicker.value = '#FFFFFF';
                this.display();
            }
        };

        this.plugin.settings.customColors.forEach((c, i) => {
            const colorRow = section.createDiv();
            colorRow.addClass('sc-style-9e7437b2');

            const leftSide = colorRow.createDiv();
            leftSide.addClass('sc-style-93c113a2');

            const colorCircle = leftSide.createDiv();
            colorCircle.addClasses(['sc-var-width', 'sc-var-height', 'sc-var-border-radius', 'sc-var-background', 'sc-var-border', 'sc-var-flex-shrink']); colorCircle.setCssProps({ '--sc-dyn-width': `32px`, '--sc-dyn-height': `32px`, '--sc-dyn-border-radius': `50%`, '--sc-dyn-background': `${c.hex}`, '--sc-dyn-border': `2px solid var(--background-modifier-border)`, '--sc-dyn-flex-shrink': `0` });

            const textInfo = leftSide.createDiv();
            const nameEl = textInfo.createDiv({ text: c.name });
            nameEl.addClass('sc-style-b69eadcf');

            const hexEl = textInfo.createDiv({ text: c.hex });
            hexEl.addClass('sc-style-b76710d9');

            const deleteBtn = colorRow.createEl('button');
            deleteBtn.addClass('sc-style-98da0ee1');
            setIcon(deleteBtn, 'trash-2');
            deleteBtn.onclick = async () => {
                this.plugin.settings.customColors.splice(i, 1);
                await this.plugin.saveSettings();
                this.display();
            };
        });
    }

    resetForm(): void {
        this.tempName = '';
        this.tempIcon = '';
        this.tempBg = '#3498db';
        this.tempBorder = '#3498db';
        this.tempText = '#ffffff';
        this.tempLink = '#dfe4ea';
        this.tempTitleColor = '#3498db';
        this.tempBoldBorder = false;
        this.tempFont = '';
        this.tempFontSize = 3;
        this.tempBorderWidth = '';
        this.tempBorderStyle = 'solid';
        this.tempBorderRadius = '';
        this.tempNeon = '';
        this.tempNoIcon = false;
        this.tempCompact = false;
        this.tempCenter = false;
        this.tempTitleCenter = false;
    }

    private createPanelHeader(parent: HTMLElement, text: string) {
        const h = parent.createDiv();
        h.addClass('sc-style-2974682a');
        if (parent.children.length === 1) h.addClass('sc-style-480cc9a4'); // First item no border
        h.textContent = text;
    }

    private getStyleFromForm(): CalloutStyle {
        return {
            name: this.tempName,
            bg: this.tempBg,
            border: this.tempBorder,
            text: this.tempText,
            link: this.tempLink,
            icon: this.tempIcon,
            titleColor: this.tempTitleColor,
            boldBorder: this.tempBoldBorder,
            font: this.tempFont,
            fontSize: this.tempFontSize,
            borderWidth: this.tempBorderWidth,
            borderStyle: this.tempBorderStyle,
            borderRadius: this.tempBorderRadius,
            neon: this.tempNeon,
            noIcon: this.tempNoIcon,
            compact: this.tempCompact
        };
    }

    private loadStyleToForm(s: CalloutStyle) {
        this.tempName = s.name || '';
        this.tempBg = s.bg || '#ffffff';
        this.tempBorder = s.border || '#dedede';
        this.tempText = s.text || '#333333';
        this.tempLink = s.link || '#dfe4ea';
        this.tempIcon = s.icon || '';
        this.tempTitleColor = s.titleColor || s.bg;
        this.tempBoldBorder = s.boldBorder || false;
        this.tempFont = s.font || '';
        this.tempFontSize = s.fontSize || 3;
        this.tempBorderWidth = s.borderWidth || '';
        this.tempBorderStyle = s.borderStyle || 'solid';
        this.tempBorderRadius = s.borderRadius || '';
        this.tempNeon = s.neon || '';
        this.tempNoIcon = s.noIcon || false;
        this.tempCompact = s.compact || false;
    }

    private async saveCurrentStyle() {
        if (!this.tempName.trim()) {
            new Notice('Please enter a name');
            return;
        }

        const newStyle = this.getStyleFromForm();

        if (this.editingIndex !== null) {
            this.plugin.settings.customStyles[this.editingIndex] = newStyle;
            this.editingIndex = null;
        } else {
            if (this.plugin.settings.customStyles.some(s => s.name === newStyle.name)) {
                new Notice('Name already exists!');
                return;
            }
            this.plugin.settings.customStyles.push(newStyle);
        }

        await this.plugin.saveSettings();
        new Notice('Style saved!');
    }

    updatePreview(el: HTMLElement): void {
        el.empty();

        // --- CONTAINER STYLES ---
        el.addClass('sc-style-3e0512b1'); // reset default

        if (this.tempBg && (this.tempBg.includes('gradient') || this.tempBg.startsWith('url'))) {
            el.addClass('sc-var-background'); el.setCssProps({ '--sc-dyn-background': this.tempBg  });
        } else {
            el.addClass('sc-var-background'); el.setCssProps({ '--sc-dyn-background': `color-mix(in srgb, ${this.tempBg} 15%, transparent)` });
        }

        // Borders
        let borderWidth = this.tempBoldBorder ? '5px' : '2px';
        if (this.tempBorderWidth) borderWidth = this.tempBorderWidth;
        // ensure unit
        if (!isNaN(Number(borderWidth))) borderWidth += 'px';

        const borderStyle = this.tempBorderStyle || 'solid';
        const borderColor = this.tempBorder || 'var(--text-accent)'; // fallback

        // Apply to all sides as per user preference
        el.addClasses(['sc-var-border', 'sc-var-border-left']);
        el.setCssProps({ '--sc-dyn-border': `${borderWidth} ${borderStyle} ${borderColor}`, '--sc-dyn-border-left': `${borderWidth} ${borderStyle} ${borderColor}` });

        // Radius
        if (this.tempBorderRadius) {
            el.addClass('sc-var-border-radius'); el.setCssProps({ '--sc-dyn-border-radius': this.tempBorderRadius + (isNaN(Number(this.tempBorderRadius)) ? '' : 'px')  });
        } else {
            el.addClass('sc-style-602659fe');
        }

        // Neon Glow
        if (this.tempNeon) {
            el.addClass('sc-var-box-shadow'); el.setCssProps({ '--sc-dyn-box-shadow': `0 0 10px ${this.tempNeon}, inset 0 0 5px ${this.tempNeon}20` });
            el.addClass('sc-var-border-color'); el.setCssProps({ '--sc-dyn-border-color': this.tempNeon  });
        } else {
            el.addClass('sc-style-fbf1b2fc');
        }

        // Typography - Font Family
        if (this.tempFont && FONT_FAMILIES[this.tempFont]) {
            el.addClass('sc-var-font-family'); el.setCssProps({ '--sc-dyn-font-family': FONT_FAMILIES[this.tempFont]  });
        } else {
            el.addClass('sc-style-b384338c');
        }

        // Typography - Font Size
        if (this.tempFontSize && FONT_SIZES[this.tempFontSize]) {
            el.addClass('sc-var-font-size'); el.setCssProps({ '--sc-dyn-font-size': FONT_SIZES[this.tempFontSize]  });
        } else {
            el.addClass('sc-style-1adfbb28');
        }

        // --- LAYOUT ---
        const isCompact = this.tempCompact;
        const isCenter = this.tempCenter;
        const isTitleCenter = this.tempTitleCenter;
        const noIcon = this.tempNoIcon;

        if (isCenter) {
            el.addClass('sc-style-cdd8ca06');
            el.addClass('sc-style-d0da858a'); // if flex not strictly needed for block preview but good for future props
        }

        if (isCompact) {
            el.addClass('sc-style-25e52174');
            el.addClass('sc-style-ed3c7314');
            el.addClass('sc-style-8d76abfb'); // Callout normally has padding
            el.addClass('sc-style-71296b1d');
        } else {
            el.addClass('sc-style-d8d6f7a6');
        }

        // --- TITLE ---
        const t = el.createDiv({ cls: 'callout-title' });
        t.addClass('sc-var-color'); t.setCssProps({ '--sc-dyn-color': this.tempTitleColor  });
        t.addClass('sc-style-a3ef34e1');
        t.addClass('sc-style-e9ebe922');
        t.addClass('sc-style-d0da858a');
        t.addClass('sc-style-cd31ce4d');
        t.addClass('sc-style-db117290');

        if (isCenter || isTitleCenter) {
            t.addClass('sc-style-95f7f0d8');
            t.addClass('sc-style-cdd8ca06');
        }

        if (isCompact) t.addClass('sc-style-bcb36ba8');

        // Icon
        if (!noIcon) {
            const i = t.createDiv({ cls: 'callout-icon' });
            i.addClass('sc-var-color'); i.setCssProps({ '--sc-dyn-color': this.tempTitleColor  });
            i.addClass('sc-style-e9ebe922');
            setIcon(i, this.tempIcon || 'pencil');
        }

        // Title Text
        const titleInner = t.createDiv({ cls: 'callout-title-inner', text: this.tempName || 'Callout Preview' });
        if (this.tempFontSize) {
            // Title usually stays 1em relative to container font size
            titleInner.addClass('sc-style-1adfbb28');
        }

        // --- CONTENT ---
        const c = el.createDiv({ cls: 'callout-content' });
        c.addClass('sc-var-color'); c.setCssProps({ '--sc-dyn-color': this.tempText  });
        c.addClass('sc-style-374aad47');

        if (isCenter) {
            c.addClass('sc-style-cdd8ca06');
            c.addClass('sc-style-e9ebe922');
            c.addClass('sc-style-cb2b281a');
            c.addClass('sc-style-d0da858a');
        }

        if (isCompact) {
            c.addClass('sc-style-ce875d4e');
        } else {
            c.addClass('sc-style-68a09f73');
        }

        c.createDiv({ text: 'This is how your callout will appear with customizable styles. ' });
        const l = c.createEl('a', { text: 'Links look like this', href: '#' });
        l.addClass('sc-var-color'); l.setCssProps({ '--sc-dyn-color': this.tempLink  });
        l.addClass('sc-style-f6bf23d8');
        l.onclick = (e) => e.preventDefault();
        c.createSpan({ text: '.' });
    }

    private applyRandomStyle(): void {
        const hue = Math.floor(Math.random() * 360);
        const sat = 50 + Math.floor(Math.random() * 30); // 50-80%
        const light = 20 + Math.floor(Math.random() * 30); // 20-50%

        const secHue = (hue + 180) % 360; // Complementary

        this.tempBg = this.hslToHex(hue, sat, Math.max(10, light - 10));
        this.tempBorder = this.hslToHex(hue, sat + 10, light + 20);
        this.tempTitleColor = this.hslToHex(hue, sat + 20, Math.min(90, light + 40));

        this.tempText = '#eeeeee';
        this.tempLink = this.hslToHex(secHue, 70, 70);

        const icons = ['zap', 'star', 'heart', 'anchor', 'book', 'box', 'flame', 'droplet', 'feather', 'sun', 'moon', 'award'];
        this.tempIcon = icons[Math.floor(Math.random() * icons.length)];

        this.tempName = `random-${Math.floor(Math.random() * 999)}`;
        this.tempNeon = Math.random() > 0.6 ? this.tempBorder : '';
        this.tempCompact = Math.random() > 0.8;
        this.tempBoldBorder = Math.random() > 0.7;
    }

    private hslToHex(h: number, s: number, l: number): string {
        l /= 100;
        const a = s * Math.min(l, 1 - l) / 100;
        const f = (n: number) => {
            const k = (n + h / 30) % 12;
            const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
            const hex = Math.round(255 * color).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${f(0)}${f(8)}${f(4)}`;
    }
}

/** Modal for importing style */
class ImportStyleModal extends Modal {
    onSubmit: (style: any) => void;
    settings: SpecialCalloutsSettings;
    jsonText: string = '';

    constructor(app: App, settings: SpecialCalloutsSettings, onSubmit: (style: any) => void) {
        super(app);
        this.settings = settings;
        this.onSubmit = onSubmit;
    }

    ensureHex(color: string): string {
        if (!color) return color;
        if (color.startsWith('#')) return color;

        // Basic web colors to hex for UI compatibility
        const basicColors: Record<string, string> = {
            'white': '#ffffff',
            'black': '#000000',
            'transparent': '#00000000', // approximate or keep transparent if UI handles it? keep transparent.
            // UI Color picker hates 'transparent', but standard hex is needed.
            // Let's use clean hexes.
            'red': '#ff0000',
            'green': '#008000',
            'blue': '#0000ff',
            'yellow': '#ffff00',
            'cyan': '#00ffff',
            'magenta': '#ff00ff',
            'gray': '#808080',
            'grey': '#808080',
            'silver': '#c0c0c0',
            'maroon': '#800000',
            'olive': '#808000',
            'purple': '#800080',
            'teal': '#008080',
            'navy': '#000080',
            'orange': '#ffa500',
            'brown': '#a52a2a',
            'pink': '#ffc0cb',
            'lime': '#00ff00',
            'indigo': '#4b0082',
            'violet': '#ee82ee',
            'gold': '#ffd700',
            'coral': '#ff7f50',
            'crimson': '#dc143c',
            'darkblue': '#00008b',
            'darkcyan': '#008b8b',
            'darkgray': '#a9a9a9',
            'darkgreen': '#006400',
            'darkorange': '#ff8c00',
            'darkred': '#8b0000',
            'deeppink': '#ff1493',
            'deepskyblue': '#00bfff',
            'dimgray': '#696969',
            'dodgerblue': '#1e90ff',
            'forestgreen': '#228b22',
            'hotpink': '#ff69b4',
            'lightblue': '#add8e6',
            'lightgreen': '#90ee90',
            'lightgrey': '#d3d3d3',
            'lightpink': '#ffb6c1',
            'lightsalmon': '#ffa07a',
            'lightseagreen': '#20b2aa',
            'lightskyblue': '#87cefa',
            'limegreen': '#32cd32',
            'midnightblue': '#191970',
            'orangered': '#ff4500',
            'royalblue': '#4169e1',
            'salmon': '#fa8072',
            'seagreen': '#2e8b57',
            'skyblue': '#87ceeb',
            'slateblue': '#6a5acd',
            'slategray': '#708090',
            'springgreen': '#00ff7f',
            'steelblue': '#4682b4',
            'tomato': '#ff6347',
            'turquoise': '#40e0d0'
        };

        return basicColors[color.toLowerCase()] || color;
    }

    onOpen() {
        const { contentEl } = this;
        new Setting(contentEl).setName('Import Style' ).setHeading();

        const helpText = contentEl.createEl('p', { text: 'Paste a JSON style object OR a callout with metadata (e.g., > [!callout] (col:2, neon:red)).' });
        helpText.addClass('sc-style-7abb3a4e');
        helpText.addClass('sc-style-33dd45cd');

        const textArea = new TextAreaComponent(contentEl);
        textArea.inputEl.addClass('sc-style-199b6f0e');
        textArea.inputEl.addClass('sc-style-5e7790db');
        textArea.inputEl.addClass('sc-style-3bd72200');
        textArea.inputEl.addClass('sc-style-fb2a7115');
        textArea.setPlaceholder('JSON or > [!type] (metadata)...');
        textArea.onChange((value) => {
            this.jsonText = value;
        });

        const buttonDiv = contentEl.createDiv();
        buttonDiv.addClass('sc-style-7ff7833b');

        new ButtonComponent(buttonDiv)
            .setButtonText('Import')
            .setCta()
            .onClick(() => {
                const text = this.jsonText.trim();
                if (!text) return;

                try {
                    const parsed = JSON.parse(text);
                    if (parsed && typeof parsed === 'object') {
                        this.onSubmit(parsed);
                        this.close();
                        new Notice(`Imported style: ${parsed.name || 'custom-style'}`);
                        return;
                    }
                } catch (e) { /* Not JSON */ }

                let detectedType = '';
                let detectedMetadata = '';

                const ALIAS_MAP: Record<string, string> = {
                    'summary': 'abstract', 'tldr': 'abstract',
                    'hint': 'tip', 'important': 'tip',
                    'check': 'success', 'done': 'success',
                    'help': 'question', 'faq': 'question',
                    'caution': 'warning', 'attention': 'warning',
                    'fail': 'failure', 'missing': 'failure',
                    'error': 'danger',
                    'cite': 'quote'
                };

                const lines = text.split('\n');
                const calloutLine = lines.find(l => l.match(/^\s*>?\s*\[!.*?\]/)) || text;

                const typeMatch = calloutLine.match(/\[!(.*?)\]/);
                if (typeMatch) {
                    detectedType = typeMatch[1].trim().toLowerCase();
                }

                let metadataStr = '';
                const parenMatch = calloutLine.match(/\((.*?)\)/);

                if (parenMatch) {
                    metadataStr = parenMatch[1];
                } else if (calloutLine.includes('|')) {
                    const parts = calloutLine.split('|');
                    if (parts.length > 1) metadataStr = parts.slice(1).join('|').trim();
                } else if (!detectedType && calloutLine.includes(':')) {
                    metadataStr = calloutLine;
                }

                if (metadataStr && !metadataStr.includes(',')) {
                    metadataStr = metadataStr.replace(/\s+([a-zA-Z0-9-]+:)/g, ', $1');
                }

                detectedMetadata = metadataStr;

                let baseStyle: CalloutStyle = {
                    name: detectedType || 'imported-style',
                    bg: '#ffffff',
                    border: '#dddddd',
                    text: '', // Empty by default for theme inheritance
                    link: '#dddddd',
                    icon: 'pencil'
                };

                let inherited = false;
                if (detectedType) {
                    let lookupType = detectedType;
                    if (ALIAS_MAP[detectedType]) {
                        lookupType = ALIAS_MAP[detectedType];
                    }

                    const existingCustom = this.settings.customStyles.find(
                        s => s.name.toLowerCase() === detectedType
                    );
                    if (existingCustom) {
                        baseStyle = { ...existingCustom, name: `${existingCustom.name}-copy` };
                        inherited = true;
                    }
                    else if (this.settings.standardStyles && this.settings.standardStyles[lookupType]) {
                        const stdStyle = this.settings.standardStyles[lookupType];
                        baseStyle = {
                            ...baseStyle,
                            ...stdStyle,
                            name: `${detectedType}-custom`
                        };
                        if (!baseStyle.link) baseStyle.link = baseStyle.border;
                        inherited = true;
                    }
                }

                if (detectedMetadata) {
                    try {
                        const { config } = parseMetadata(
                            detectedMetadata,
                            this.settings.standardColors,
                            this.settings.customColors
                        );

                        if (config.bg) baseStyle.bg = this.ensureHex(config.bg);
                        if (config.text) baseStyle.text = this.ensureHex(config.text);
                        if (config.border) baseStyle.border = this.ensureHex(config.border);
                        if (config.link) baseStyle.link = this.ensureHex(config.link);
                        if (config.titleColor) baseStyle.titleColor = this.ensureHex(config.titleColor);
                        if (config.borderWidth) baseStyle.borderWidth = config.borderWidth;
                        if (config.borderStyle) baseStyle.borderStyle = config.borderStyle;
                        if (config.radius) baseStyle.borderRadius = config.radius;
                        if (config.neon) baseStyle.neon = this.ensureHex(config.neon);

                        if (config.gradient) {
                            const parts = config.gradient.split('-');
                            if (parts.length >= 2) {
                                const resolve = (c: string) => {
                                    c = c.trim();
                                    const custom = this.settings.customColors.find(col => col.name.toLowerCase() === c.toLowerCase());
                                    if (custom) return custom.hex;
                                    const std = this.settings.standardColors[c.toLowerCase()];
                                    if (std) return std;
                                    return this.ensureHex(c); // Ensure hex for gradient parts too if simple
                                };

                                const c1 = resolve(parts[0]);
                                const c2 = resolve(parts[1]);
                                baseStyle.bg = `linear-gradient(90deg, ${c1}, ${c2})`;
                            } else {
                                baseStyle.bg = config.gradient;
                            }
                        }

                        if (config.noIcon) baseStyle.noIcon = true;
                        if (config.compact) baseStyle.compact = true;
                        if (config.font) baseStyle.font = config.font;
                        if (config.fontSize) baseStyle.fontSize = config.fontSize;

                        this.onSubmit(baseStyle);
                        this.close();
                        new Notice(`Imported style: ${baseStyle.name} ` + (inherited ? '(Inherited)' : ''));
                        return;
                    } catch (err) {
                        console.error('Metadata parsing failed', err);
                    }
                } else if (detectedType && baseStyle.name.endsWith('-copy')) {
                    this.onSubmit(baseStyle);
                    this.close();
                    new Notice(`Imported style base: ${baseStyle.name}`);
                    return;
                } else if (inherited) {
                    this.onSubmit(baseStyle);
                    this.close();
                    new Notice(`Imported standard style: ${baseStyle.name}`);
                    return;
                }

                new Notice('Could not extract valid style. Use JSON or Callout syntax (e.g. > [!type] (metadata)).');
            });
    }

    onClose() {
        this.contentEl.empty();
    }
}
