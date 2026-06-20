import { applyCssText } from '../utils';
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
        applyCssText(header, 'margin-bottom: 2rem;');

        const title = new Setting(header).setName('Special Callouts' ).setHeading();
        applyCssText(title.settingEl, `
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        `);

        const subtitle = header.createEl('p', { text: 'Customize your callout styles with precision' });
        applyCssText(subtitle, `
            color: var(--text-muted);
            font-size: 0.95rem;
            margin: 0 0 1.5rem 0;
        `);
    }

    private createQuickActions(container: HTMLElement): void {
        const quickRefDiv = container.createDiv();
        applyCssText(quickRefDiv, 'display: flex; gap: 10px; margin-bottom: 2rem;');

        const howToBtn = quickRefDiv.createEl('button');
        // AI_CONTEXT: Sekonder eylem butonlari icin var(--interactive-normal) kullaniliyor
        // Accent rengi acik/beyaz oldugunda 'color: white' okunaksiz hale geliyordu
        applyCssText(howToBtn, 'padding: 8px 16px; background: var(--interactive-normal); color: var(--text-normal); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: background 0.15s;');
        howToBtn.onmouseover = () => howToBtn.setCssStyles({ 'background': 'var(--interactive-hover)' });
        howToBtn.onmouseout = () => howToBtn.setCssStyles({ 'background': 'var(--interactive-normal)' });
        setIcon(howToBtn.createSpan(), 'help-circle');
        howToBtn.createSpan({ text: 'How to Use' });
        howToBtn.onclick = () => showHowToUse(this.app);

        const metadataBtn = quickRefDiv.createEl('button');
        applyCssText(metadataBtn, 'padding: 8px 16px; background: var(--interactive-normal); color: var(--text-normal); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: background 0.15s;');
        metadataBtn.onmouseover = () => metadataBtn.setCssStyles({ 'background': 'var(--interactive-hover)' });
        metadataBtn.onmouseout = () => metadataBtn.setCssStyles({ 'background': 'var(--interactive-normal)' });
        setIcon(metadataBtn.createSpan(), 'list');
        metadataBtn.createSpan({ text: 'Metadata Reference' });
        metadataBtn.onclick = () => showMetadataReference(this.app);
    }

    private createGeneralSettings(container: HTMLElement): void {
        const section = container.createDiv();
        applyCssText(section, 'margin-bottom: 2.5rem;');

        const h1 = new Setting(section).setName('General Settings' ).setHeading();
        applyCssText(h1.settingEl, `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `);

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
        applyCssText(section, 'margin-bottom: 2.5rem;');

        const h1 = new Setting(section).setName('Callouts' ).setHeading();
        applyCssText(h1.settingEl, `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `);

        this.createCustomStylesSection(section);
        this.createStandardStylesSection(section);
    }

    private createColorsSection(container: HTMLElement): void {
        const section = container.createDiv();
        applyCssText(section, 'margin-bottom: 2.5rem;');

        const h1 = new Setting(section).setName('Colors' ).setHeading();
        applyCssText(h1.settingEl, `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `);

        this.createStandardColorsSection(section);
        this.createCustomColorsSection(section);
    }

    createLayoutBuilderSection(container: HTMLElement): void {
        const section = container.createDiv();
        applyCssText(section, 'margin-bottom: 2.5rem;');

        const h1 = new Setting(section).setName('Visual Layout Builder (Interactive)' ).setHeading();
        applyCssText(h1.settingEl, `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `);

        const desc = section.createEl('p', { text: 'Drag to select cells, then click Merge or Split. Use layouts by typing their name in the callout metadata. e.g. > [!multi-callout] (my_dashboard).' });
        applyCssText(desc, 'color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;');

        const builderCard = section.createDiv();
        applyCssText(builderCard, `
            padding: 20px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-secondary);
            margin-bottom: 20px;
        `);

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
        applyCssText(controlsRow, 'display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end; flex-wrap: wrap;');
        
        const nameGroup = controlsRow.createDiv();
        applyCssText(nameGroup.createEl('label', { text: 'Layout Name' }), 'display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 5px;');
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my_dashboard' });
        applyCssText(nameInput, 'padding: 6px 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); width: 150px;');
        nameInput.value = this.builderLayoutName;
        nameInput.oninput = (e) => this.builderLayoutName = (e.target as HTMLInputElement).value;

        const colsGroup = controlsRow.createDiv();
        applyCssText(colsGroup.createEl('label', { text: 'Columns' }), 'display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 5px;');
        const colsSelect = new DropdownComponent(colsGroup);
        [1,2,3,4,5,6,7,8].forEach(n => colsSelect.addOption(n.toString(), n.toString()));
        colsSelect.setValue(this.builderCols.toString());

        const rowsGroup = controlsRow.createDiv();
        applyCssText(rowsGroup.createEl('label', { text: 'Rows' }), 'display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 5px;');
        const rowsSelect = new DropdownComponent(rowsGroup);
        [1,2,3,4,5,6,7,8].forEach(n => rowsSelect.addOption(n.toString(), n.toString()));
        rowsSelect.setValue(this.builderRows.toString());

        const actionGroup = controlsRow.createDiv();
        applyCssText(actionGroup, 'display: flex; gap: 10px; margin-left: auto;');
        
        const mergeBtn = actionGroup.createEl('button');
        applyCssText(mergeBtn, 'padding: 6px 12px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600;');
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
        applyCssText(splitBtn, 'padding: 6px 12px; background: var(--background-modifier-error); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600;');
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
                    cell.setCssStyles({ 'background': 'var(--interactive-accent)' });
                    cell.setCssStyles({ 'borderColor': 'var(--text-accent)' });
                    cell.setCssStyles({ 'color': 'var(--text-on-accent)' });
                    cell.setCssStyles({ 'transform': 'scale(0.98)' });
                } else {
                    cell.setCssStyles({ 'background': 'var(--background-secondary)' });
                    cell.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' });
                    cell.setCssStyles({ 'color': 'var(--text-normal)' });
                    cell.setCssStyles({ 'transform': 'scale(1)' });
                }
            });
        };

        const onMouseUp = () => {
            isDragging = false;
            activeDocument.removeEventListener('mouseup', onMouseUp);
        };

        const drawGrid = () => {
            gridContainer.empty();
            applyCssText(gridContainer, `
                display: grid;
                grid-template-columns: repeat(${this.builderCols}, 1fr);
                grid-template-rows: repeat(${this.builderRows}, 80px);
                gap: 8px;
                background: var(--background-primary);
                padding: 15px;
                border-radius: 8px;
                border: 1px dashed var(--background-modifier-border);
                user-select: none;
            `);
            
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
                    applyCssText(cell, `
                        grid-row-start: ${r + 1};
                        grid-row-end: ${maxR + 2};
                        grid-column-start: ${c + 1};
                        grid-column-end: ${maxC + 2};
                        border: 2px solid var(--background-modifier-border);
                        border-radius: 6px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        cursor: pointer;
                        transition: all 0.15s ease;
                        font-weight: bold;
                        font-size: 1.5rem;
                        box-shadow: inset 0 0 10px rgba(0,0,0,0.05);
                    `);
                    
                    cell.createSpan({ text: `${id}` });
                    const subtitle = cell.createSpan({ text: `Callout ${id}` });
                    applyCssText(subtitle, 'font-size: 0.7rem; opacity: 0.7; font-weight: normal; margin-top: 4px; pointer-events: none;');
                    
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
        applyCssText(saveBtnRow, 'margin-top: 20px; display: flex; justify-content: space-between; align-items: center;');
        
        const ioGroup = saveBtnRow.createDiv();
        applyCssText(ioGroup, 'display: flex; gap: 8px;');

        const exportBtn = ioGroup.createEl('button');
        applyCssText(exportBtn, 'padding: 6px 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-size: 0.8rem;');
        setIcon(exportBtn, 'upload');
        exportBtn.createSpan({ text: 'Export All' });
        exportBtn.onclick = () => {
            const data = this.plugin.settings.customLayouts || [];
            navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
                new Notice('All layouts copied to clipboard!');
            });
        };

        const importBtn = ioGroup.createEl('button');
        applyCssText(importBtn, 'padding: 6px 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; gap: 6px; font-size: 0.8rem;');
        setIcon(importBtn, 'download');
        importBtn.createSpan({ text: 'Import' });
        importBtn.onclick = () => {
            const modal = new Modal(this.app);
            modal.titleEl.setText('Import Layouts (JSON)');
            const area = new TextAreaComponent(modal.contentEl);
            area.placeholder = 'Paste JSON here...';
            area.inputEl.setCssStyles({ 'width': '100%' });
            area.inputEl.setCssStyles({ 'height': '200px' });
            
            const btn = modal.contentEl.createEl('button', { text: 'Import' });
            applyCssText(btn, 'margin-top: 10px; width: 100%; padding: 10px; background: var(--interactive-accent); color: white; border: none; border-radius: 6px;');
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
        applyCssText(saveBtn, 'padding: 8px 16px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 6px; cursor: pointer; font-weight: 600;');
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
            applyCssText(grid, 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;');
            
            this.plugin.settings.customLayouts.forEach((layout, idx) => {
                const card = grid.createDiv();
                applyCssText(card, 'padding: 12px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;');
                
                const info = card.createDiv();
                info.createDiv({ text: layout.name }).setCssStyles({ 'fontWeight': 'bold' });
                applyCssText(info.createDiv({ text: `${layout.cols}x${layout.rows} Grid` }), 'font-size: 0.8rem; color: var(--text-muted);');
                
                const actionBtns = card.createDiv();
                applyCssText(actionBtns, 'display: flex; gap: 5px;');

                const editBtn = actionBtns.createEl('button');
                setIcon(editBtn, 'pencil');
                applyCssText(editBtn, 'background: transparent; border: none; cursor: pointer; color: var(--text-accent); padding: 4px;');
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
                applyCssText(delBtn, 'background: transparent; border: none; cursor: pointer; color: var(--text-error); padding: 4px;');
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
        applyCssText(section, 'margin-bottom: 1.5rem;');

        const sectionHeader = section.createDiv();
        applyCssText(sectionHeader, 'margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;');

        applyCssText(new Setting(sectionHeader).setName('Standard Callouts').setHeading().settingEl, `
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-muted);
        `);

        // Grid/List toggle
        const toggleDiv = sectionHeader.createDiv();
        applyCssText(toggleDiv, 'display: flex; border: 1px solid var(--background-modifier-border); border-radius: 6px; overflow: hidden;');

        const gridBtn = toggleDiv.createEl('button', { text: 'Grid' });
        applyCssText(gridBtn, `padding: 4px 10px; border: none; cursor: pointer; font-size: 0.8rem; ${this.standardStylesViewMode === 'grid' ? 'background: var(--interactive-accent); color: var(--text-on-accent);' : 'background: var(--background-secondary); color: var(--text-muted);'}`);
        gridBtn.onclick = () => { this.standardStylesViewMode = 'grid'; this.display(); };

        const listBtn = toggleDiv.createEl('button', { text: 'List' });
        applyCssText(listBtn, `padding: 4px 10px; border: none; cursor: pointer; font-size: 0.8rem; ${this.standardStylesViewMode === 'list' ? 'background: var(--interactive-accent); color: var(--text-on-accent);' : 'background: var(--background-secondary); color: var(--text-muted);'}`);
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
        applyCssText(list, 'display: flex; flex-direction: column; gap: 4px;');

        styleNames.forEach(styleName => {
            const style = this.plugin.settings.standardStyles[styleName];
            const defaultStyle = DEFAULT_STANDARD_STYLES[styleName];
            const isModified = style.bg !== defaultStyle.bg ||
                style.text !== defaultStyle.text ||
                style.titleColor !== defaultStyle.titleColor;

            const row = list.createDiv();
            applyCssText(row, `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                transition: all 0.15s ease;
            `);
            row.onmouseover = () => row.setCssStyles({ 'borderColor': 'var(--interactive-accent)' });
            row.onmouseout = () => row.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' });

            // Color bar
            const colorBar = row.createDiv();
            applyCssText(colorBar, `width: 4px; height: 24px; border-radius: 2px; background: ${style.bg};`);

            // Icon
            const iconSpan = row.createSpan();
            applyCssText(iconSpan, `color: ${style.bg}; display: flex; align-items: center;`);
            setIcon(iconSpan, style.icon || 'file');

            // Name
            const nameSpan = row.createSpan({ text: styleName.charAt(0).toUpperCase() + styleName.slice(1) });
            applyCssText(nameSpan, `flex: 1; font-weight: 500; color: ${style.bg}; font-size: 0.95rem;`);

            // Modified indicator
            if (isModified) {
                const modBadge = row.createSpan({ text: 'â—' });
                applyCssText(modBadge, 'color: var(--text-accent); font-size: 0.6rem;');
                modBadge.title = 'Modified';
            }

            // Edit button
            const editBtn = row.createEl('button');
            applyCssText(editBtn, 'padding: 6px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex;');
            setIcon(editBtn, 'pencil');
            editBtn.title = 'Edit';
            editBtn.onclick = (e) => { e.stopPropagation(); this.openStandardStyleEditor(styleName); };

            // Reset button
            if (isModified) {
                const resetBtn = row.createEl('button');
                applyCssText(resetBtn, 'padding: 6px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex;');
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
        applyCssText(grid, 'display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;');

        styleNames.forEach(styleName => {
            const style = this.plugin.settings.standardStyles[styleName];
            const defaultStyle = DEFAULT_STANDARD_STYLES[styleName];
            const isModified = style.bg !== defaultStyle.bg ||
                style.text !== defaultStyle.text ||
                style.titleColor !== defaultStyle.titleColor;

            const card = grid.createDiv();
            applyCssText(card, `
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: center;
            `);
            card.onmouseover = () => { card.setCssStyles({ 'borderColor': 'var(--interactive-accent)' }); card.setCssStyles({ 'transform': 'translateY(-2px)' }); };
            card.onmouseout = () => { card.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' }); card.setCssStyles({ 'transform': 'translateY(0)' }); };
            card.onclick = () => this.openStandardStyleEditor(styleName);

            // Icon
            const iconDiv = card.createDiv();
            applyCssText(iconDiv, `color: ${style.bg}; margin-bottom: 8px; display: flex; justify-content: center;`);
            setIcon(iconDiv, style.icon || 'file');

            // Name
            const nameDiv = card.createDiv({ text: styleName.charAt(0).toUpperCase() + styleName.slice(1) });
            applyCssText(nameDiv, `font-weight: 500; color: ${style.bg}; font-size: 0.85rem;`);

            // Modified dot
            if (isModified) {
                const modDot = card.createDiv({ text: 'â—' });
                applyCssText(modDot, 'color: var(--text-accent); font-size: 0.5rem; margin-top: 4px;');
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
        previewDiv.setCssStyles({ 'background': `color-mix(in srgb, ${style.bg} 15%, transparent)` });
        previewDiv.setCssStyles({ 'borderLeft': `4px solid ${style.bg}` });
        previewDiv.setCssStyles({ 'borderRadius': '6px' });
        previewDiv.setCssStyles({ 'padding': '12px' });
        previewDiv.setCssStyles({ 'marginBottom': '1.5rem' });

        const previewTitle = previewDiv.createEl('strong', { text: style.name });
        previewTitle.setCssStyles({ 'color': style.titleColor || style.bg });
        previewDiv.createEl('br');
        const previewText = previewDiv.createEl('span', { text: 'Preview text content' });
        previewText.setCssStyles({ 'color': style.text || 'var(--text-normal)' });

        const updatePreview = () => {
            previewDiv.setCssStyles({ 'background': `color-mix(in srgb, ${style.bg} 15%, transparent)` });
            previewDiv.setCssStyles({ 'borderLeft': `4px solid ${style.bg}` });
            previewTitle.textContent = style.name;
            previewTitle.setCssStyles({ 'color': style.titleColor || style.bg });
            previewText.setCssStyles({ 'color': style.text || 'var(--text-normal)' });
        };

        // Background color
        const bgRow = contentEl.createDiv();
        bgRow.setCssStyles({ 'display': 'flex' });
        bgRow.setCssStyles({ 'alignItems': 'center' });
        bgRow.setCssStyles({ 'gap': '10px' });
        bgRow.setCssStyles({ 'marginBottom': '12px' });
        bgRow.createEl('label', { text: 'Background:' }).setCssStyles({ ['width']: '100px' });
        const bgInput = bgRow.createEl('input', { type: 'color', value: style.bg });
        bgInput.oninput = () => { style.bg = bgInput.value; style.border = bgInput.value; updatePreview(); };

        // Title color
        const titleRow = contentEl.createDiv();
        titleRow.setCssStyles({ 'display': 'flex' });
        titleRow.setCssStyles({ 'alignItems': 'center' });
        titleRow.setCssStyles({ 'gap': '10px' });
        titleRow.setCssStyles({ 'marginBottom': '12px' });
        titleRow.createEl('label', { text: 'Title Color:' }).setCssStyles({ ['width']: '100px' });
        const titleInput = titleRow.createEl('input', { type: 'color', value: style.titleColor || style.bg });
        titleInput.oninput = () => { style.titleColor = titleInput.value; updatePreview(); };

        // Text color
        const textRow = contentEl.createDiv();
        textRow.setCssStyles({ 'display': 'flex' });
        textRow.setCssStyles({ 'alignItems': 'center' });
        textRow.setCssStyles({ 'gap': '10px' });
        textRow.setCssStyles({ 'marginBottom': '1.5rem' });
        textRow.createEl('label', { text: 'Text Color:' }).setCssStyles({ ['width']: '100px' });
        const textInput = textRow.createEl('input', { type: 'color', value: style.text || '#ffffff' });
        textInput.oninput = () => { style.text = textInput.value; updatePreview(); };

        // Buttons
        const buttons = contentEl.createDiv();
        buttons.setCssStyles({ 'display': 'flex' });
        buttons.setCssStyles({ 'gap': '10px' });

        const saveBtn = buttons.createEl('button', { text: 'Save' });
        saveBtn.setCssStyles({ 'flex': '1' });
        saveBtn.setCssStyles({ 'padding': '10px' });
        saveBtn.setCssStyles({ 'background': 'var(--interactive-accent)' });
        saveBtn.setCssStyles({ 'color': 'var(--text-on-accent)' });
        saveBtn.setCssStyles({ 'border': 'none' });
        saveBtn.setCssStyles({ 'borderRadius': '6px' });
        saveBtn.setCssStyles({ 'cursor': 'pointer' });
        saveBtn.onclick = () => {
            void (async () => {
                this.plugin.settings.standardStyles[styleName] = style;
                await this.plugin.saveSettings();
                editorModal.close();
                this.display();
            })();
        };

        const resetBtn = buttons.createEl('button', { text: 'Reset' });
        resetBtn.setCssStyles({ 'padding': '10px 20px' });
        resetBtn.setCssStyles({ 'background': 'var(--background-modifier-error)' });
        resetBtn.setCssStyles({ 'color': 'var(--text-on-accent)' });
        resetBtn.setCssStyles({ 'border': 'none' });
        resetBtn.setCssStyles({ 'borderRadius': '6px' });
        resetBtn.setCssStyles({ 'cursor': 'pointer' });
        resetBtn.onclick = () => {
            void (async () => {
                this.plugin.settings.standardStyles[styleName] = { ...DEFAULT_STANDARD_STYLES[styleName] };
                await this.plugin.saveSettings();
                editorModal.close();
                this.display();
            })();
        };

        const cancelBtn = buttons.createEl('button', { text: 'Cancel' });
        cancelBtn.setCssStyles({ 'padding': '10px 20px' });
        cancelBtn.setCssStyles({ 'borderRadius': '6px' });
        cancelBtn.setCssStyles({ 'cursor': 'pointer' });
        cancelBtn.onclick = () => editorModal.close();

        editorModal.open();
    }

    createCustomStylesSection(container: HTMLElement): void {
        const section = container.createDiv();
        applyCssText(section, 'margin-bottom: 1.5rem;');

        const sectionHeader = section.createDiv();
        applyCssText(sectionHeader, 'margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;');

        applyCssText(new Setting(sectionHeader).setName('Custom Callouts').setHeading().settingEl, `
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-muted);
        `);

        if (this.editingIndex !== null) {
            const banner = section.createDiv();
            applyCssText(banner, 'background: var(--interactive-accent); color: var(--text-on-accent); padding: 10px 16px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;');
            banner.createSpan({ text: `Editing: ${this.tempName || 'Untitled'}` }).setCssStyles({ 'fontWeight': '500' });
            const cancelBtn = banner.createEl('button', { text: 'Cancel' });
            applyCssText(cancelBtn, 'background: rgba(128,128,128,0.2); border: none; color: var(--text-on-accent); padding: 6px 12px; border-radius: 4px; cursor: pointer;');
            cancelBtn.onclick = () => {
                this.editingIndex = null;
                this.resetForm();
                this.display();
            };
        }

        // Creator card
        const creatorCard = section.createDiv();
        applyCssText(creatorCard, `
            padding: 20px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-secondary);
        `);

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
        applyCssText(presetsDiv, 'margin-bottom: 20px;');

        const presetsLabel = presetsDiv.createDiv();
        applyCssText(presetsLabel, 'display: flex; align-items: center; gap: 8px; margin-bottom: 10px;');
        applyCssText(presetsLabel.createEl('span', { text: 'Quick Start' }), 'font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;');
        applyCssText(presetsLabel.createDiv(), 'flex: 1; height: 1px; background: var(--background-modifier-border);');

        const presetsGrid = presetsDiv.createDiv();
        applyCssText(presetsGrid, 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;');

        QUICK_START_PRESETS.forEach(preset => {
            const presetBtn = presetsGrid.createEl('button', { text: preset.name });
            applyCssText(presetBtn, `
                padding: 8px 12px;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                color: var(--text-normal);
                transition: all 0.15s;
            `);
            presetBtn.onmouseover = () => { presetBtn.setCssStyles({ 'borderColor': preset.border }); presetBtn.setCssStyles({ 'color': preset.border }); };
            presetBtn.onmouseout = () => { presetBtn.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' }); presetBtn.setCssStyles({ 'color': 'var(--text-normal)' }); };
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
        applyCssText(randomBtn, `
            padding: 8px 12px;
            background: var(--background-primary);
            border: 1px solid var(--interactive-accent);
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            color: var(--text-normal);
            transition: all 0.15s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
        `);
        setIcon(randomBtn.createSpan(), 'dice');
        randomBtn.createSpan({ text: 'Random' }); // Just 'Random' to fit grid
        randomBtn.onmouseover = () => { randomBtn.setCssStyles({ 'background': 'var(--interactive-accent)' }); randomBtn.setCssStyles({ 'color': 'white' }); };
        randomBtn.onmouseout = () => { randomBtn.setCssStyles({ 'background': 'var(--background-primary)' }); randomBtn.setCssStyles({ 'color': 'var(--text-normal)' }); };
        randomBtn.onclick = () => {
            this.applyRandomStyle();
            this.display();
        };
    }

    private createFormSection(creatorCard: HTMLElement): HTMLElement {
        // --- 1. PREVIEW (Top, full width) ---
        const previewLabel = creatorCard.createDiv();
        applyCssText(previewLabel, 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;');
        applyCssText(previewLabel.createEl('span', { text: 'Live Preview' }), 'font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;');
        applyCssText(previewLabel.createDiv(), 'flex: 1; height: 1px; background: var(--background-modifier-border);');

        const previewBox = creatorCard.createDiv({ cls: 'callout' });
        applyCssText(previewBox, 'margin-bottom: 24px; min-height: 100px; transition: all 0.2s ease;');

        // --- 2. CONTROLS GRID ---
        const gridContainer = creatorCard.createDiv();
        applyCssText(gridContainer, 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;');

        const leftCol = gridContainer.createDiv();
        applyCssText(leftCol, 'display: flex; flex-direction: column; gap: 20px;');

        const rightCol = gridContainer.createDiv();
        applyCssText(rightCol, 'display: flex; flex-direction: column; gap: 20px;');

        // === LEFT COLUMN (Visuals) ===

        // PANEL: IDENTITY
        const identityPanel = leftCol.createDiv();
        this.createPanelHeader(identityPanel, 'Identity');

        const identityGrid = identityPanel.createDiv();
        applyCssText(identityGrid, 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px;');

        // Name
        const nameGroup = identityGrid.createDiv();
        applyCssText(nameGroup.createEl('label', { text: 'Style Name' }), 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;');
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my-style' });
        applyCssText(nameInput, 'width: 100%; padding: 6px 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);');
        nameInput.value = this.tempName;
        nameInput.oninput = () => { this.tempName = nameInput.value; this.updatePreview(previewBox); };

        // Icon
        const iconGroup = identityGrid.createDiv();
        applyCssText(iconGroup.createEl('label', { text: 'Icon' }), 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;');

        const iconWrapper = iconGroup.createDiv();
        applyCssText(iconWrapper, 'display: flex; gap: 6px;');
        const iconInput = iconWrapper.createEl('input', { type: 'text' });
        applyCssText(iconInput, 'flex: 1; min-width: 0; padding: 6px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);');
        iconInput.value = this.tempIcon;
        iconInput.oninput = () => { this.tempIcon = iconInput.value; this.updatePreview(previewBox); };

        const iconSearchBtn = iconWrapper.createEl('button');
        applyCssText(iconSearchBtn, 'padding: 0 8px; cursor: pointer; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--interactive-normal);');
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
        applyCssText(colorsGrid, 'display: flex; flex-direction: column; gap: 12px;');

        const colorConfigs = [
            { label: 'Background', val: () => this.tempBg, set: (v: string) => this.tempBg = v },
            { label: 'Border', val: () => this.tempBorder, set: (v: string) => this.tempBorder = v },
            { label: 'Title', val: () => this.tempTitleColor, set: (v: string) => this.tempTitleColor = v },
            { label: 'Text', val: () => this.tempText, set: (v: string) => this.tempText = v },
            { label: 'Link', val: () => this.tempLink, set: (v: string) => this.tempLink = v }
        ];

        colorConfigs.forEach(c => {
            const row = colorsGrid.createDiv();
            applyCssText(row, 'display: flex; align-items: center; justify-content: space-between; gap: 10px;');

            applyCssText(row.createEl('label', { text: c.label }), 'font-size: 0.8rem; color: var(--text-normal); flex: 1;');

            const hexInput = row.createEl('input', { type: 'text' });
            applyCssText(hexInput, 'width: 70px; padding: 2px 4px; border: none; background: transparent; font-family: monospace; font-size: 0.8rem; text-align: right; color: var(--text-muted);');
            hexInput.value = c.val().toUpperCase();

            const wrapper = row.createDiv();
            applyCssText(wrapper, 'position: relative; width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 1px solid var(--background-modifier-border);');
            const picker = wrapper.createEl('input', { type: 'color' });
            applyCssText(picker, 'opacity: 0; width: 100%; height: 100%; cursor: pointer; position: absolute; top:0; left:0;');
            picker.value = c.val();

            const display = wrapper.createDiv();
            applyCssText(display, `width: 100%; height: 100%; background: ${c.val()}; pointer-events: none;`);

            picker.oninput = (e: any) => {
                c.set(e.target.value);
                display.setCssStyles({ 'background': e.target.value });
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
                    display.setCssStyles({ 'background': v });
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
        applyCssText(neonRow, 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;');

        const neonLabel = neonRow.createDiv();
        applyCssText(neonLabel.createDiv({ text: 'Neon Glow' }), 'font-size: 0.8rem; font-weight: 500;');

        const neonControls = neonRow.createDiv();
        applyCssText(neonControls, 'display: flex; align-items: center; gap: 8px;');

        const neonPicker = neonControls.createEl('input', { type: 'color' });
        applyCssText(neonPicker, 'width: 20px; height: 20px; border: none; padding: 0; background: transparent; cursor: pointer;');
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
        applyCssText(typoGrid, 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px;');

        const fontGroup = typoGrid.createDiv();
        applyCssText(fontGroup.createEl('label', { text: 'Font Family' }), 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;');
        const fontSelect = new DropdownComponent(fontGroup);
        fontSelect.selectEl.setCssStyles({ 'width': '100%' });
        fontSelect.addOption('', 'Default');
        Object.keys(FONT_FAMILIES).forEach(f => fontSelect.addOption(f, f.charAt(0).toUpperCase() + f.slice(1)));
        fontSelect.setValue(this.tempFont);
        fontSelect.onChange(val => { this.tempFont = val; this.updatePreview(previewBox); });

        const sizeGroup = typoGrid.createDiv();
        applyCssText(sizeGroup.createEl('label', { text: 'Size' }), 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;');
        const sizeSelect = new DropdownComponent(sizeGroup);
        sizeSelect.selectEl.setCssStyles({ 'width': '100%' });
        Object.keys(FONT_SIZES).forEach(s => sizeSelect.addOption(s, s));
        sizeSelect.setValue(this.tempFontSize.toString());
        sizeSelect.onChange(val => { this.tempFontSize = parseInt(val); this.updatePreview(previewBox); });


        // PANEL: STRUCTURE
        const structPanel = rightCol.createDiv();
        this.createPanelHeader(structPanel, 'Structure');

        // Border Style
        const bsRow = structPanel.createDiv();
        applyCssText(bsRow, 'margin-bottom: 12px;');
        applyCssText(bsRow.createEl('label', { text: 'Border Style' }), 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;');
        const bsSelect = new DropdownComponent(bsRow);
        bsSelect.selectEl.setCssStyles({ 'width': '100%' });
        ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'].forEach(s => bsSelect.addOption(s, s));
        bsSelect.setValue(this.tempBorderStyle || 'solid');
        bsSelect.onChange(val => { this.tempBorderStyle = val; this.updatePreview(previewBox); });

        // Sliders
        const createSliderRow = (label: string, value: string, setter: (v: string) => void, min: number, max: number, step: number) => {
            const row = structPanel.createDiv();
            applyCssText(row, 'margin-bottom: 12px;');
            const header = row.createDiv();
            applyCssText(header, 'display: flex; justify-content: space-between; margin-bottom: 4px;');
            applyCssText(header.createEl('label', { text: label }), 'font-size: 0.75rem; font-weight: 600; color: var(--text-muted);');
            const valLabel = header.createSpan({ text: value || 'Default' });
            valLabel.setCssStyles({ 'fontSize': '0.75rem' });

            const slider = new SliderComponent(row);
            slider.sliderEl.setCssStyles({ 'width': '100%' });
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
        layoutPanel.createDiv().setCssStyles({ 'marginTop': '20px' });
        this.createPanelHeader(layoutPanel, 'Layout Modes');

        const createToggleRow = (label: string, value: boolean, setter: (v: boolean) => void) => {
            const row = layoutPanel.createDiv();
            applyCssText(row, 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;');
            row.createSpan({ text: label }).setCssStyles({ 'fontWeight': '500' });
            const t = new ToggleComponent(row);
            t.setValue(value);
            t.onChange(v => { setter(v); this.updatePreview(previewBox); });
        };

        createToggleRow('Compact Mode', this.tempCompact, (v) => this.tempCompact = v);
        createToggleRow('Hide Icon', this.tempNoIcon, (v) => this.tempNoIcon = v);


        // --- ACTION BUTTONS ---
        const actionsContainer = creatorCard.createDiv();
        applyCssText(actionsContainer, 'margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--background-modifier-border);');

        this.renderActionButtons(actionsContainer, previewBox); // Call new helper

        this.updatePreview(previewBox);
        return previewBox;
    }

    private renderActionButtons(container: HTMLElement, previewBox: HTMLElement): void {
        const row = container.createDiv();
        applyCssText(row, 'display: flex; gap: 12px; align-items: center; justify-content: flex-end;');

        const leftGroup = row.createDiv();
        applyCssText(leftGroup, 'margin-right: auto; display: flex; gap: 8px;');

        const exportBtn = leftGroup.createEl('button');
        applyCssText(exportBtn, 'font-size: 0.8rem; padding: 6px 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;');
        setIcon(exportBtn, 'upload');
        exportBtn.createSpan({ text: 'Export' });
        exportBtn.onclick = () => {
            const styleData = this.getStyleFromForm();
            navigator.clipboard.writeText(JSON.stringify(styleData, null, 2)).then(() => {
                new Notice('Style JSON copied to clipboard!');
            });
        };

        const importBtn = leftGroup.createEl('button');
        applyCssText(importBtn, 'font-size: 0.8rem; padding: 6px 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;');
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
        applyCssText(saveBtn, 'background: var(--interactive-accent); color: var(--text-on-accent); border: none; padding: 8px 24px; border-radius: 4px; font-weight: 600; cursor: pointer;');
        saveBtn.onclick = async () => {
            await this.saveCurrentStyle();
            this.resetForm();
            this.display();
        };
    }

    private OLD_createFormSection(creatorCard: HTMLElement): HTMLElement {
        // Name & Icon row
        const topRow = creatorCard.createDiv();
        applyCssText(topRow, 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 16px;');

        // Name input
        const nameGroup = topRow.createDiv();
        applyCssText(nameGroup.createEl('label', { text: 'Name' }), 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;');
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my-callout' });
        applyCssText(nameInput, 'width: 100%; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); color: var(--text-normal); font-size: 0.9rem;');
        nameInput.value = this.tempName;

        // Icon input
        const iconGroup = topRow.createDiv();
        applyCssText(iconGroup.createEl('label', { text: 'Icon' }), 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;');

        const iconWrapper = iconGroup.createDiv();
        applyCssText(iconWrapper, 'display: flex; gap: 6px;');

        const iconInput = iconWrapper.createEl('input', { type: 'text', placeholder: 'star' });
        applyCssText(iconInput, 'flex: 1; min-width: 0; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); color: var(--text-normal); font-size: 0.9rem;');
        iconInput.value = this.tempIcon;

        const iconBtn = iconWrapper.createEl('button');
        applyCssText(iconBtn, 'padding: 0 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;');
        setIcon(iconBtn, 'search');
        iconBtn.title = 'Browse Icons';

        iconBtn.onmouseover = () => { iconBtn.setCssStyles({ 'borderColor': 'var(--interactive-accent)' }); iconBtn.setCssStyles({ 'color': 'var(--text-normal)' }); };
        iconBtn.onmouseout = () => { iconBtn.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' }); iconBtn.setCssStyles({ 'color': 'var(--text-muted)' }); };

        iconBtn.onclick = () => {
            new IconPickerModal(this.app, (selectedIcon) => {
                this.tempIcon = selectedIcon;
                iconInput.value = selectedIcon;
                this.updatePreview(previewBox);
            }).open();
        };

        // Typography Row
        const typoRow = creatorCard.createDiv();
        applyCssText(typoRow, 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 16px;');

        // Font Family
        const fontGroup = typoRow.createDiv();
        applyCssText(fontGroup.createEl('label', { text: 'Font Family' }), 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;');

        const fontSelect = new DropdownComponent(fontGroup);
        fontSelect.selectEl.setCssStyles({ 'width': '100%' });
        fontSelect.selectEl.setCssStyles({ 'background': 'var(--background-primary)' });

        fontSelect.addOption('', 'Default');
        Object.keys(FONT_FAMILIES).forEach(f => fontSelect.addOption(f, f.charAt(0).toUpperCase() + f.slice(1)));

        fontSelect.setValue(this.tempFont);
        fontSelect.onChange((val) => {
            this.tempFont = val;
            this.updatePreview(previewBox);
        });

        // Font Size
        const sizeGroup = typoRow.createDiv();
        applyCssText(sizeGroup.createEl('label', { text: 'Size' }), 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;');

        const sizeSelect = new DropdownComponent(sizeGroup);
        sizeSelect.selectEl.setCssStyles({ 'width': '100%' });
        sizeSelect.selectEl.setCssStyles({ 'background': 'var(--background-primary)' });

        Object.keys(FONT_SIZES).forEach(s => sizeSelect.addOption(s, s === '3' ? '3 (Normal)' : s));

        sizeSelect.setValue(this.tempFontSize.toString());
        sizeSelect.onChange((val) => {
            this.tempFontSize = parseInt(val);
            this.updatePreview(previewBox);
        });

        // Colors label
        const colorsLabel = creatorCard.createDiv();
        applyCssText(colorsLabel, 'display: flex; align-items: center; gap: 8px; margin-bottom: 10px;');
        applyCssText(colorsLabel.createEl('span', { text: 'Colors' }), 'font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;');
        applyCssText(colorsLabel.createDiv(), 'flex: 1; height: 1px; background: var(--background-modifier-border);');

        // Colors grid
        const colorsGrid = creatorCard.createDiv();
        applyCssText(colorsGrid, 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px;');

        const colorConfigs = [
            { label: 'BG', value: () => this.tempBg, setter: (v: string) => this.tempBg = v },
            { label: 'Border', value: () => this.tempBorder, setter: (v: string) => this.tempBorder = v },
            { label: 'Title', value: () => this.tempTitleColor, setter: (v: string) => this.tempTitleColor = v },
            { label: 'Text', value: () => this.tempText, setter: (v: string) => this.tempText = v },
            { label: 'Link', value: () => this.tempLink, setter: (v: string) => this.tempLink = v }
        ];

        // Preview
        const previewLabel = creatorCard.createDiv();
        applyCssText(previewLabel, 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;');
        applyCssText(previewLabel.createEl('span', { text: 'Preview' }), 'font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;');
        applyCssText(previewLabel.createDiv(), 'flex: 1; height: 1px; background: var(--background-modifier-border);');

        const previewBox = creatorCard.createDiv({ cls: 'callout' });
        applyCssText(previewBox, 'margin-bottom: 16px;');

        colorConfigs.forEach(config => {
            const colorItem = colorsGrid.createDiv();
            applyCssText(colorItem, 'display: flex; flex-direction: column; align-items: center; gap: 6px;');

            const colorLabel = colorItem.createEl('label', { text: config.label });
            applyCssText(colorLabel, 'font-size: 0.7rem; color: var(--text-muted); font-weight: 500;');

            const colorPicker = colorItem.createEl('input', { type: 'color' });
            applyCssText(colorPicker, 'width: 36px; height: 36px; border: 2px solid var(--background-modifier-border); border-radius: 50%; cursor: pointer; padding: 0; background: transparent; -webkit-appearance: none; appearance: none; overflow: hidden;');
            colorPicker.value = config.value();

            const hexInput = colorItem.createEl('input', { type: 'text' });
            applyCssText(hexInput, 'width: 70px; padding: 4px 6px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 0.7rem; font-family: monospace; text-align: center; text-transform: uppercase;');
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
        applyCssText(bottomRow, 'display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 20px;');

        const leftGroup = bottomRow.createDiv();
        applyCssText(leftGroup, 'display: flex; align-items: center; gap: 16px;');

        const toggleRow = leftGroup.createDiv();
        applyCssText(toggleRow, 'display: flex; align-items: center; gap: 8px;');
        const toggle = toggleRow.createEl('input', { type: 'checkbox' });
        toggle.checked = this.tempBoldBorder;
        applyCssText(toggle, 'width: 16px; height: 16px; cursor: pointer;');
        toggle.onchange = () => { this.tempBoldBorder = toggle.checked; this.updatePreview(previewBox); };
        applyCssText(toggleRow.createEl('span', { text: 'Bold border' }), 'font-size: 0.85rem; color: var(--text-muted); margin-right: 12px;');

        const centerToggle = toggleRow.createEl('input', { type: 'checkbox' });
        centerToggle.checked = this.tempCenter;
        applyCssText(centerToggle, 'width: 16px; height: 16px; cursor: pointer;');
        centerToggle.onchange = () => { this.tempCenter = centerToggle.checked; this.updatePreview(previewBox); };
        applyCssText(toggleRow.createEl('span', { text: 'Center' }), 'font-size: 0.85rem; color: var(--text-muted); margin-right: 12px;');

        const titleCenterToggle = toggleRow.createEl('input', { type: 'checkbox' });
        titleCenterToggle.checked = this.tempTitleCenter;
        applyCssText(titleCenterToggle, 'width: 16px; height: 16px; cursor: pointer;');
        titleCenterToggle.onchange = () => { this.tempTitleCenter = titleCenterToggle.checked; this.updatePreview(previewBox); };
        applyCssText(toggleRow.createEl('span', { text: 'Title Center' }), 'font-size: 0.85rem; color: var(--text-muted);');

        // ------------------------------------------------------------
        // IMPORT / EXPORT BUTTONS
        // ------------------------------------------------------------
        const ioGroup = leftGroup.createDiv();
        applyCssText(ioGroup, 'display: flex; gap: 8px; border-left: 1px solid var(--background-modifier-border); padding-left: 16px;');

        // EXPORT BUTTON
        const exportBtn = ioGroup.createEl('button');
        applyCssText(exportBtn, `
            padding: 6px 10px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            transition: all 0.15s;
        `);
        setIcon(exportBtn, 'upload'); // Changed from 'download'
        const expLabel = exportBtn.createSpan({ text: 'Export' });
        exportBtn.title = 'Copy current style to clipboard as JSON';

        exportBtn.onmouseover = () => { exportBtn.setCssStyles({ 'color': 'var(--text-normal)' }); exportBtn.setCssStyles({ 'borderColor': 'var(--interactive-accent)' }); };
        exportBtn.onmouseout = () => { exportBtn.setCssStyles({ 'color': 'var(--text-muted)' }); exportBtn.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' }); };

        exportBtn.onclick = () => {
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

            navigator.clipboard.writeText(JSON.stringify(styleData, null, 2)).then(() => {
                new Notice('Style JSON copied to clipboard!');
                exportBtn.setCssStyles({ 'backgroundColor': 'var(--interactive-success)' });
                exportBtn.setCssStyles({ 'color': 'white' });
                window.setTimeout(() => {
                    exportBtn.setCssStyles({ 'background': 'var(--background-primary)' });
                    exportBtn.setCssStyles({ 'color': 'var(--text-muted)' });
                }, 1000);
            }).catch(err => {
                new Notice('Failed to copy to clipboard.');
                console.error(err);
            });
        };

        // IMPORT BUTTON
        const importBtn = ioGroup.createEl('button');
        applyCssText(importBtn, `
            padding: 6px 10px;
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 6px;
            cursor: pointer;
            color: var(--text-muted);
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 0.8rem;
            transition: all 0.15s;
        `);
        setIcon(importBtn, 'download'); // Changed from 'upload'
        importBtn.createSpan({ text: 'Import' });
        importBtn.title = 'Paste JSON style';

        importBtn.onmouseover = () => { importBtn.setCssStyles({ 'color': 'var(--text-normal)' }); importBtn.setCssStyles({ 'borderColor': 'var(--interactive-accent)' }); };
        importBtn.onmouseout = () => { importBtn.setCssStyles({ 'color': 'var(--text-muted)' }); importBtn.setCssStyles({ 'borderColor': 'var(--background-modifier-border)' }); };

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
        applyCssText(buttonsRow, 'display: flex; gap: 10px;');

        // Cancel button
        const cancelBtn = buttonsRow.createEl('button', { text: 'Cancel' });
        applyCssText(cancelBtn, `
            padding: 10px 20px;
            background: var(--background-modifier-border);
            color: var(--text-normal);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
            transition: opacity 0.15s;
        `);
        cancelBtn.onmouseover = () => cancelBtn.setCssStyles({ 'opacity': '0.85' });
        cancelBtn.onmouseout = () => cancelBtn.setCssStyles({ 'opacity': '1' });
        cancelBtn.onclick = () => {
            this.editingIndex = null;
            this.resetForm();
            this.display();
        };

        // Save button
        const saveBtn = buttonsRow.createEl('button', { text: this.editingIndex !== null ? 'Update Style' : 'Save Style' });
        applyCssText(saveBtn, `
            padding: 10px 24px;
            background: var(--interactive-accent);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
            transition: opacity 0.15s;
        `);
        saveBtn.onmouseover = () => saveBtn.setCssStyles({ 'opacity': '0.85' });
        saveBtn.onmouseout = () => saveBtn.setCssStyles({ 'opacity': '1' });
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
                    applyCssText(error, 'padding: 10px; background: var(--background-modifier-error); color: var(--text-on-accent); border-radius: 6px; margin-top: 10px; font-size: 0.9rem;');
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
        applyCssText(savedHeader, 'display: flex; justify-content: space-between; align-items: center; margin-top: 20px; margin-bottom: 10px;');

        const headerTitle = new Setting(savedHeader).setName('Saved Styles' ).setHeading();
        headerTitle.setCssStyles({ 'margin': '0' });

        const viewToggle = savedHeader.createDiv();
        applyCssText(viewToggle, 'display: flex; gap: 5px;');

        const gridBtn = viewToggle.createEl('button', { text: 'Grid' });
        applyCssText(gridBtn, `padding: 5px 12px; border: 1px solid var(--background-modifier-border); background: ${this.stylesViewMode === 'grid' ? 'var(--interactive-accent)' : 'var(--background-primary)'}; color: ${this.stylesViewMode === 'grid' ? 'white' : 'var(--text-normal)'}; border-radius: 4px; cursor: pointer; font-size: 0.8rem;`);
        gridBtn.onclick = () => { this.stylesViewMode = 'grid'; this.display(); };

        const listBtn = viewToggle.createEl('button', { text: 'List' });
        applyCssText(listBtn, `padding: 5px 12px; border: 1px solid var(--background-modifier-border); background: ${this.stylesViewMode === 'list' ? 'var(--interactive-accent)' : 'var(--background-primary)'}; color: ${this.stylesViewMode === 'list' ? 'white' : 'var(--text-normal)'}; border-radius: 4px; cursor: pointer; font-size: 0.8rem;`);
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
        applyCssText(card, 'border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 10px; background: var(--background-secondary);');

        const header = card.createDiv();
        applyCssText(header, 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;');

        const title = new Setting(header).setName(s.name ).setHeading();
        applyCssText(title.settingEl, 'margin: 0; font-size: 0.95rem; font-weight: 600;');

        const actions = header.createDiv();
        applyCssText(actions, 'display: flex; gap: 4px;');

        const editBtn = actions.createEl('button');
        applyCssText(editBtn, 'padding: 4px 8px; background: transparent; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-muted);');
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
        applyCssText(deleteBtn, 'padding: 4px 8px; background: transparent; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-muted);');
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.onclick = async () => {
            this.plugin.settings.customStyles.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
        };

        if (this.stylesViewMode === 'grid') {
            const preview = card.createDiv();
            const borderWidth = s.boldBorder ? '5px' : '2px';
            applyCssText(preview, `
                background: linear-gradient(135deg, ${s.bg}15 0%, ${s.border}25 100%);
                border: 1px solid ${s.border}30;
                border-left: ${borderWidth} solid ${s.bg};
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
            `);

            const previewTitle = preview.createDiv();
            applyCssText(previewTitle, `display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.9rem; color: ${s.titleColor || s.bg};`);

            const icon = previewTitle.createSpan();
            applyCssText(icon, `display: inline-flex; color: ${s.titleColor || s.bg};`);
            setIcon(icon, s.icon || 'box');

            previewTitle.createSpan({ text: 'Sample Callout' });

            const previewContent = preview.createDiv();
            applyCssText(previewContent, `color: ${s.text}; font-size: 0.85rem; margin-top: 6px; line-height: 1.4;`);

            // Apply font to preview card
            if (s.font && FONT_FAMILIES[s.font]) {
                preview.setCssStyles({ 'fontFamily': FONT_FAMILIES[s.font] });
            }

            previewContent.textContent = 'This is how your callout will look with ';

            const link = previewContent.createEl('a', { text: 'a link', href: '#' });
            applyCssText(link, `color: ${s.link}; text-decoration: underline;`);
            link.onclick = (e: Event) => e.preventDefault();

            previewContent.appendText(' inside.');
        }

        const details = card.createDiv();
        applyCssText(details, 'display: flex; gap: 6px; flex-wrap: wrap; font-size: 0.75rem;');

        const iconBadge = details.createEl('span', { text: `Icon: ${s.icon}` });
        applyCssText(iconBadge, 'padding: 3px 8px; background: var(--background-primary); border-radius: 3px; color: var(--text-muted);');

        if (s.boldBorder) {
            const boldBadge = details.createEl('span', { text: 'Bold Border' });
            applyCssText(boldBadge, 'padding: 3px 8px; background: var(--background-primary); border-radius: 3px; color: var(--text-muted);');
        }

        if (s.titleColor && s.titleColor !== s.bg) {
            const titleBadge = details.createEl('span', { text: `Title: ${s.titleColor}` });
            applyCssText(titleBadge, 'padding: 3px 8px; background: var(--background-primary); border-radius: 3px; color: var(--text-muted);');
        }
    }

    createStandardColorsSection(container: HTMLElement): void {
        const section = container.createEl('details');
        section.open = false;
        const summary = section.createEl('summary');
        applyCssText(summary, 'font-weight: 600; font-size: 1.1rem; margin: 0 0 0.75rem 0; cursor: pointer; color: var(--text-muted);');
        summary.textContent = 'Standard Colors';

        Object.keys(this.plugin.settings.standardColors).forEach(colorName => {
            if (colorName === 'gray') return;

            const setting = new Setting(section)
                .setName(colorName.charAt(0).toUpperCase() + colorName.slice(1));

            applyCssText(setting.controlEl, 'display: flex; gap: 5px; flex-wrap: wrap;');

            setting.addText(t => {
                applyCssText(t.inputEl, 'width: 90px; font-family: monospace;');
                t.setValue(this.plugin.settings.standardColors[colorName])
                    .setPlaceholder('#FFFFFF')
                    .onChange(async (v) => {
                        if (isValidHex(v)) {
                            this.plugin.settings.standardColors[colorName] = normalizeHex(v);
                            if (colorName === 'grey') this.plugin.settings.standardColors['gray'] = normalizeHex(v);
                            await this.plugin.saveSettings();
                        }
                    });
            }).addColorPicker(c => {
                c.setValue(this.plugin.settings.standardColors[colorName])
                    .onChange(async (v) => {
                        this.plugin.settings.standardColors[colorName] = v.toUpperCase();
                        if (colorName === 'grey') this.plugin.settings.standardColors['gray'] = v.toUpperCase();
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
        applyCssText(summary, 'font-weight: 600; font-size: 1.1rem; margin: 1rem 0 0.75rem 0; cursor: pointer; color: var(--text-muted);');
        summary.textContent = 'Custom Colors';

        const addColorRow = section.createDiv();
        applyCssText(addColorRow, 'display: flex; gap: 10px; align-items: center; margin: 10px 0 15px 0; flex-wrap: wrap;');

        const nameInput = addColorRow.createEl('input', { type: 'text', placeholder: 'Color name' });
        applyCssText(nameInput, 'flex: 1; min-width: 120px; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);');

        const colorPicker = addColorRow.createEl('input', { type: 'color' });
        applyCssText(colorPicker, 'width: 50px; height: 38px; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer;');
        colorPicker.value = this.newCustomColorHex;

        const hexInput = addColorRow.createEl('input', { type: 'text', placeholder: '#FFFFFF' });
        applyCssText(hexInput, 'width: 100px; font-family: monospace; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);');
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
        applyCssText(addBtn, 'padding: 8px 20px; background: var(--interactive-accent); color: var(--text-on-accent); border: none; border-radius: 4px; cursor: pointer; font-weight: 500;');
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
            applyCssText(colorRow, 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 6px; margin: 8px 0; background: var(--background-secondary);');

            const leftSide = colorRow.createDiv();
            applyCssText(leftSide, 'display: flex; align-items: center; gap: 12px; flex: 1;');

            const colorCircle = leftSide.createDiv();
            applyCssText(colorCircle, `width: 32px; height: 32px; border-radius: 50%; background: ${c.hex}; border: 2px solid var(--background-modifier-border); flex-shrink: 0;`);

            const textInfo = leftSide.createDiv();
            const nameEl = textInfo.createDiv({ text: c.name });
            applyCssText(nameEl, 'font-weight: 500; color: var(--text-normal); margin-bottom: 2px;');

            const hexEl = textInfo.createDiv({ text: c.hex });
            applyCssText(hexEl, 'font-family: monospace; font-size: 0.85rem; color: var(--text-muted);');

            const deleteBtn = colorRow.createEl('button');
            applyCssText(deleteBtn, 'padding: 6px 10px; background: transparent; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-muted);');
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
        applyCssText(h, 'font-size: 0.7rem; font-weight: 700; color: var(--text-accent); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; opacity: 0.8; padding-top: 4px; border-top: 1px solid var(--background-modifier-border); margin-top: 4px;');
        if (parent.children.length === 1) h.setCssStyles({ 'borderTop': 'none' }); // First item no border
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
        el.setCssStyles({ 'border': 'none' }); // reset default

        if (this.tempBg && (this.tempBg.includes('gradient') || this.tempBg.startsWith('url'))) {
            el.setCssStyles({ 'background': this.tempBg });
        } else {
            el.setCssStyles({ 'background': `color-mix(in srgb, ${this.tempBg} 15%, transparent)` });
        }

        // Borders
        let borderWidth = this.tempBoldBorder ? '5px' : '2px';
        if (this.tempBorderWidth) borderWidth = this.tempBorderWidth;
        // ensure unit
        if (!isNaN(Number(borderWidth))) borderWidth += 'px';

        const borderStyle = this.tempBorderStyle || 'solid';
        const borderColor = this.tempBorder || 'var(--text-accent)'; // fallback

        // Apply to all sides as per user preference
        el.setCssStyles({ 'border': `${borderWidth} ${borderStyle} ${borderColor}` });
        el.setCssStyles({ 'borderLeft': `${borderWidth} ${borderStyle} ${borderColor}` });

        // Radius
        if (this.tempBorderRadius) {
            el.setCssStyles({ 'borderRadius': this.tempBorderRadius + (isNaN(Number(this.tempBorderRadius)) ? '' : 'px') });
        } else {
            el.setCssStyles({ 'borderRadius': '6px' });
        }

        // Neon Glow
        if (this.tempNeon) {
            el.setCssStyles({ 'boxShadow': `0 0 10px ${this.tempNeon}, inset 0 0 5px ${this.tempNeon}20` });
            el.setCssStyles({ 'borderColor': this.tempNeon });
        } else {
            el.setCssStyles({ 'boxShadow': 'none' });
        }

        // Typography - Font Family
        if (this.tempFont && FONT_FAMILIES[this.tempFont]) {
            el.setCssStyles({ 'fontFamily': FONT_FAMILIES[this.tempFont] });
        } else {
            el.setCssStyles({ 'fontFamily': 'inherit' });
        }

        // Typography - Font Size
        if (this.tempFontSize && FONT_SIZES[this.tempFontSize]) {
            el.setCssStyles({ 'fontSize': FONT_SIZES[this.tempFontSize] });
        } else {
            el.setCssStyles({ 'fontSize': '1em' });
        }

        // --- LAYOUT ---
        const isCompact = this.tempCompact;
        const isCenter = this.tempCenter;
        const isTitleCenter = this.tempTitleCenter;
        const noIcon = this.tempNoIcon;

        if (isCenter) {
            el.setCssStyles({ 'textAlign': 'center' });
            el.setCssStyles({ 'alignItems': 'center' }); // if flex not strictly needed for block preview but good for future props
        }

        if (isCompact) {
            el.setCssStyles({ 'paddingTop': '0' });
            el.setCssStyles({ 'paddingBottom': '0' });
            el.setCssStyles({ 'paddingLeft': '0' }); // Callout normally has padding
            el.setCssStyles({ 'paddingRight': '0' });
        } else {
            el.setCssStyles({ 'padding': '1rem' });
        }

        // --- TITLE ---
        const t = el.createDiv({ cls: 'callout-title' });
        t.setCssStyles({ 'color': this.tempTitleColor });
        t.setCssStyles({ 'backgroundColor': 'transparent' });
        t.setCssStyles({ 'display': 'flex' });
        t.setCssStyles({ 'alignItems': 'center' });
        t.setCssStyles({ 'gap': '0.5em' });
        t.setCssStyles({ 'fontWeight': '600' });

        if (isCenter || isTitleCenter) {
            t.setCssStyles({ 'justifyContent': 'center' });
            t.setCssStyles({ 'textAlign': 'center' });
        }

        if (isCompact) t.setCssStyles({ 'padding': '0.5em 0.8em' });

        // Icon
        if (!noIcon) {
            const i = t.createDiv({ cls: 'callout-icon' });
            i.setCssStyles({ 'color': this.tempTitleColor });
            i.setCssStyles({ 'display': 'flex' });
            setIcon(i, this.tempIcon || 'pencil');
        }

        // Title Text
        const titleInner = t.createDiv({ cls: 'callout-title-inner', text: this.tempName || 'Callout Preview' });
        if (this.tempFontSize) {
            // Title usually stays 1em relative to container font size
            titleInner.setCssStyles({ 'fontSize': '1em' });
        }

        // --- CONTENT ---
        const c = el.createDiv({ cls: 'callout-content' });
        c.setCssStyles({ 'color': this.tempText });
        c.setCssStyles({ 'lineHeight': '1.6' });

        if (isCenter) {
            c.setCssStyles({ 'textAlign': 'center' });
            c.setCssStyles({ 'display': 'flex' });
            c.setCssStyles({ 'flexDirection': 'column' });
            c.setCssStyles({ 'alignItems': 'center' });
        }

        if (isCompact) {
            c.setCssStyles({ 'padding': '0 0.8em 0.5em 0.8em' });
        } else {
            c.setCssStyles({ 'marginTop': '8px' });
        }

        c.createDiv({ text: 'This is how your callout will appear with customizable styles. ' });
        const l = c.createEl('a', { text: 'Links look like this', href: '#' });
        l.setCssStyles({ 'color': this.tempLink });
        l.setCssStyles({ 'textDecoration': 'underline' });
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
        helpText.setCssStyles({ 'color': 'var(--text-muted)' });
        helpText.setCssStyles({ 'fontSize': '0.9rem' });

        const textArea = new TextAreaComponent(contentEl);
        textArea.inputEl.setCssStyles({ 'width': '100%' });
        textArea.inputEl.setCssStyles({ 'height': '150px' });
        textArea.inputEl.setCssStyles({ 'fontFamily': 'monospace' });
        textArea.inputEl.setCssStyles({ 'fontSize': '0.8rem' });
        textArea.setPlaceholder('JSON or > [!type] (metadata)...');
        textArea.onChange((value) => {
            this.jsonText = value;
        });

        const buttonDiv = contentEl.createDiv();
        applyCssText(buttonDiv, 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;');

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
