/**
 * Special Callouts - Settings Tab
 * Plugin settings UI
 */

import { App, PluginSettingTab, Setting, setIcon, Notice, Modal, TextAreaComponent, ButtonComponent, DropdownComponent, SliderComponent, ToggleComponent } from 'obsidian';
import { CalloutStyle, SpecialCalloutsSettings } from '../types';
import { DEFAULT_STANDARD_STYLES, QUICK_START_PRESETS, FONT_FAMILIES, FONT_SIZES } from '../constants';
import { isValidHex, normalizeHex } from '../utils';
import { parseMetadata, extractMetadata } from '../parser';
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
        this.createLayoutBuilderSection(containerEl);
        this.createCalloutsSection(containerEl);
        this.createColorsSection(containerEl);
    }

    private createHeader(container: HTMLElement): void {
        const header = container.createDiv();
        header.style.cssText = 'margin-bottom: 2rem;';

        const title = header.createEl('h1', { text: 'Special Callouts' });
        title.style.cssText = `
            font-size: 2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            margin-bottom: 0.5rem;
        `;

        const subtitle = header.createEl('p', { text: 'Customize your callout styles with precision' });
        subtitle.style.cssText = `
            color: var(--text-muted);
            font-size: 0.95rem;
            margin: 0 0 1.5rem 0;
        `;
    }

    private createQuickActions(container: HTMLElement): void {
        const quickRefDiv = container.createDiv();
        quickRefDiv.style.cssText = 'display: flex; gap: 10px; margin-bottom: 2rem;';

        const howToBtn = quickRefDiv.createEl('button');
        howToBtn.style.cssText = 'padding: 10px 20px; background: var(--interactive-accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: opacity 0.15s;';
        howToBtn.onmouseover = () => howToBtn.style.opacity = '0.85';
        howToBtn.onmouseout = () => howToBtn.style.opacity = '1';
        setIcon(howToBtn.createSpan(), 'help-circle');
        howToBtn.createSpan({ text: 'How to Use' });
        howToBtn.onclick = () => showHowToUse();

        const metadataBtn = quickRefDiv.createEl('button');
        metadataBtn.style.cssText = 'padding: 10px 20px; background: var(--interactive-accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; display: flex; align-items: center; gap: 6px; transition: opacity 0.15s;';
        metadataBtn.onmouseover = () => metadataBtn.style.opacity = '0.85';
        metadataBtn.onmouseout = () => metadataBtn.style.opacity = '1';
        setIcon(metadataBtn.createSpan(), 'list');
        metadataBtn.createSpan({ text: 'Metadata Reference' });
        metadataBtn.onclick = () => showMetadataReference();
    }

    private createCalloutsSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.style.cssText = 'margin-bottom: 2.5rem;';

        const h1 = section.createEl('h1', { text: 'Callouts' });
        h1.style.cssText = `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `;

        this.createCustomStylesSection(section);
        this.createStandardStylesSection(section);
    }

    private createColorsSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.style.cssText = 'margin-bottom: 2.5rem;';

        const h1 = section.createEl('h1', { text: 'Colors' });
        h1.style.cssText = `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `;

        this.createStandardColorsSection(section);
        this.createCustomColorsSection(section);
    }

    createLayoutBuilderSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.style.cssText = 'margin-bottom: 2.5rem;';

        const h1 = section.createEl('h1', { text: 'Visual Layout Builder (Interactive)' });
        h1.style.cssText = `
            font-size: 1.5rem;
            font-weight: 700;
            color: var(--text-accent);
            margin: 0 0 1.5rem 0;
            padding-bottom: 0.5rem;
            border-bottom: 2px solid var(--background-modifier-border);
        `;

        const desc = section.createEl('p', { text: 'Drag to select cells, then click Merge or Split. Use layouts by typing their name in the callout metadata. e.g. > [!multi-callout] (my_dashboard).' });
        desc.style.cssText = 'color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1rem;';

        const builderCard = section.createDiv();
        builderCard.style.cssText = `
            padding: 20px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-secondary);
            margin-bottom: 20px;
        `;

        let cols = 3;
        let rows = 2;
        let layoutName = '';
        let gridMatrix: number[][] = [];
        let selectedCells: {r: number, c: number}[] = [];
        let isDragging = false;
        let dragStart: {r: number, c: number} | null = null;
        
        const initMatrix = () => {
            gridMatrix = [];
            let nextId = 1;
            for(let r=0; r<rows; r++) {
                let row = [];
                for(let c=0; c<cols; c++) {
                    row.push(nextId++);
                }
                gridMatrix.push(row);
            }
        };
        initMatrix();

        const normalizeMatrix = () => {
            let currentId = 1;
            let oldToNew = new Map<number, number>();
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    const oldId = gridMatrix[r][c];
                    if(!oldToNew.has(oldId)) {
                        oldToNew.set(oldId, currentId++);
                    }
                    gridMatrix[r][c] = oldToNew.get(oldId)!;
                }
            }
        };

        // Settings Row
        const controlsRow = builderCard.createDiv();
        controlsRow.style.cssText = 'display: flex; gap: 15px; margin-bottom: 20px; align-items: flex-end; flex-wrap: wrap;';
        
        const nameGroup = controlsRow.createDiv();
        nameGroup.createEl('label', { text: 'Layout Name' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 5px;';
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my_dashboard' });
        nameInput.style.cssText = 'padding: 6px 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); width: 150px;';
        nameInput.oninput = (e) => layoutName = (e.target as HTMLInputElement).value;

        const colsGroup = controlsRow.createDiv();
        colsGroup.createEl('label', { text: 'Columns' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 5px;';
        const colsSelect = new DropdownComponent(colsGroup);
        [1,2,3,4,5,6,7,8].forEach(n => colsSelect.addOption(n.toString(), n.toString()));
        colsSelect.setValue('3');

        const rowsGroup = controlsRow.createDiv();
        rowsGroup.createEl('label', { text: 'Rows' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 600; margin-bottom: 5px;';
        const rowsSelect = new DropdownComponent(rowsGroup);
        [1,2,3,4,5,6,7,8].forEach(n => rowsSelect.addOption(n.toString(), n.toString()));
        rowsSelect.setValue('2');

        const actionGroup = controlsRow.createDiv();
        actionGroup.style.cssText = 'display: flex; gap: 10px; margin-left: auto;';
        
        const mergeBtn = actionGroup.createEl('button');
        mergeBtn.style.cssText = 'padding: 6px 12px; background: var(--interactive-accent); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600;';
        setIcon(mergeBtn.createSpan(), 'combine');
        mergeBtn.createSpan({ text: 'Merge' });
        mergeBtn.onclick = () => {
            if(selectedCells.length < 2) return;
            const minR = Math.min(...selectedCells.map(s=>s.r));
            const maxR = Math.max(...selectedCells.map(s=>s.r));
            const minC = Math.min(...selectedCells.map(s=>s.c));
            const maxC = Math.max(...selectedCells.map(s=>s.c));
            
            // Check if selected forms a perfect rectangle
            let isRect = true;
            let expectedCount = (maxR - minR + 1) * (maxC - minC + 1);
            if (selectedCells.length !== expectedCount) {
                // Not a perfect rectangle (e.g. L-shape selection due to partial block overlap)
                // We'll just force the bounding box to merge
            }
            
            const targetId = gridMatrix[minR][minC];
            for(let r=minR; r<=maxR; r++) {
                for(let c=minC; c<=maxC; c++) {
                    gridMatrix[r][c] = targetId;
                }
            }
            normalizeMatrix();
            selectedCells = [];
            drawGrid();
        };
        
        const splitBtn = actionGroup.createEl('button');
        splitBtn.style.cssText = 'padding: 6px 12px; background: var(--background-modifier-error); color: white; border: none; border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 5px; font-weight: 600;';
        setIcon(splitBtn.createSpan(), 'scissors');
        splitBtn.createSpan({ text: 'Split' });
        splitBtn.onclick = () => {
            if(selectedCells.length === 0) return;
            let maxExisting = 0;
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    if(gridMatrix[r][c] > maxExisting) maxExisting = gridMatrix[r][c];
                }
            }
            
            selectedCells.forEach(s => {
                const currentId = gridMatrix[s.r][s.c];
                for(let r=0; r<rows; r++) {
                    for(let c=0; c<cols; c++) {
                        if(gridMatrix[r][c] === currentId) {
                            gridMatrix[r][c] = ++maxExisting;
                        }
                    }
                }
            });
            normalizeMatrix();
            selectedCells = [];
            drawGrid();
        };

        const gridContainer = builderCard.createDiv();
        
        const updateSelectionVisuals = () => {
            const children = Array.from(gridContainer.children) as HTMLElement[];
            children.forEach(cell => {
                const id = parseInt(cell.getAttribute('data-id') || '0');
                const isSelected = selectedCells.some(s => gridMatrix[s.r]?.[s.c] === id);
                if(isSelected) {
                    cell.style.background = 'var(--interactive-accent)';
                    cell.style.borderColor = 'var(--text-accent)';
                    cell.style.color = 'white';
                    cell.style.transform = 'scale(0.98)';
                } else {
                    cell.style.background = 'var(--background-secondary)';
                    cell.style.borderColor = 'var(--background-modifier-border)';
                    cell.style.color = 'var(--text-normal)';
                    cell.style.transform = 'scale(1)';
                }
            });
        };

        const drawGrid = () => {
            gridContainer.empty();
            gridContainer.style.cssText = `
                display: grid;
                grid-template-columns: repeat(${cols}, 1fr);
                grid-template-rows: repeat(${rows}, 80px);
                gap: 8px;
                background: var(--background-primary);
                padding: 15px;
                border-radius: 8px;
                border: 1px dashed var(--background-modifier-border);
                user-select: none;
            `;
            
            const processed = new Set<number>();
            
            for(let r=0; r<rows; r++) {
                for(let c=0; c<cols; c++) {
                    const id = gridMatrix[r]?.[c];
                    if(id === undefined || processed.has(id)) continue;
                    processed.add(id);
                    
                    let maxR = r, maxC = c;
                    for(let tr=r; tr<rows; tr++) {
                        if(gridMatrix[tr][c] === id) maxR = tr;
                        else break;
                    }
                    for(let tc=c; tc<cols; tc++) {
                        if(gridMatrix[r][tc] === id) maxC = tc;
                        else break;
                    }
                    
                    const cell = gridContainer.createDiv();
                    cell.setAttribute('data-id', id.toString());
                    cell.style.cssText = `
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
                    `;
                    
                    cell.createSpan({ text: `${id}` });
                    const subtitle = cell.createSpan({ text: `Callout ${id}` });
                    subtitle.style.cssText = 'font-size: 0.7rem; opacity: 0.7; font-weight: normal; margin-top: 4px; pointer-events: none;';
                    
                    cell.onmousedown = (e) => {
                        isDragging = true;
                        dragStart = {r, c};
                        selectedCells = [];
                        for(let br=r; br<=maxR; br++) {
                            for(let bc=c; bc<=maxC; bc++) {
                                selectedCells.push({r: br, c: bc});
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
                            
                            selectedCells = [];
                            for(let tr=minRow; tr<=maxRow; tr++) {
                                for(let tc=minCol; tc<=maxCol; tc++) {
                                    selectedCells.push({r: tr, c: tc});
                                }
                            }
                            updateSelectionVisuals();
                        }
                    };
                }
            }
            updateSelectionVisuals();
        };

        const documentMouseUpListener = () => { isDragging = false; };
        document.addEventListener('mouseup', documentMouseUpListener);
        // We handle event cleanup generally by Obsidian's lifecycle, but for safety in settings tab it's usually fine
        
        colsSelect.onChange(v => { cols = parseInt(v); initMatrix(); drawGrid(); });
        rowsSelect.onChange(v => { rows = parseInt(v); initMatrix(); drawGrid(); });
        drawGrid();

        const saveBtnRow = builderCard.createDiv();
        saveBtnRow.style.cssText = 'margin-top: 20px; display: flex; justify-content: flex-end;';
        const saveBtn = saveBtnRow.createEl('button', { text: 'Save Layout' });
        saveBtn.style.cssText = 'padding: 8px 16px; background: var(--interactive-accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 600;';
        saveBtn.onclick = async () => {
            if (!layoutName) {
                new Notice('Please enter a layout name');
                return;
            }
            if (!this.plugin.settings.customLayouts) {
                this.plugin.settings.customLayouts = [];
            }
            
            const existingIdx = this.plugin.settings.customLayouts.findIndex(l => l.name === layoutName.toLowerCase().replace(/\s+/g, '_'));
            
            // Read matrix
            let gridAreasStr = '';
            for(let r=0; r<rows; r++) {
                let rowStr = '';
                for(let c=0; c<cols; c++) {
                    rowStr += `area${gridMatrix[r][c]} `;
                }
                gridAreasStr += `"${rowStr.trim()}" `;
            }
            
            const newLayout = {
                name: layoutName.toLowerCase().replace(/\s+/g, '_'),
                cols,
                rows,
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
            listDiv.createEl('h3', { text: 'Saved Layouts' }).style.cssText = 'font-size: 1.1rem; margin-bottom: 10px;';
            
            const grid = listDiv.createDiv();
            grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 10px;';
            
            this.plugin.settings.customLayouts.forEach((layout, idx) => {
                const card = grid.createDiv();
                card.style.cssText = 'padding: 12px; background: var(--background-secondary); border: 1px solid var(--background-modifier-border); border-radius: 6px; display: flex; justify-content: space-between; align-items: center;';
                
                const info = card.createDiv();
                info.createDiv({ text: layout.name }).style.fontWeight = 'bold';
                info.createDiv({ text: `${layout.cols}x${layout.rows} Grid` }).style.cssText = 'font-size: 0.8rem; color: var(--text-muted);';
                
                const actionBtns = card.createDiv();
                actionBtns.style.cssText = 'display: flex; gap: 5px;';

                const editBtn = actionBtns.createEl('button');
                setIcon(editBtn, 'pencil');
                editBtn.style.cssText = 'background: transparent; border: none; cursor: pointer; color: var(--text-accent); padding: 4px;';
                editBtn.title = 'Edit Layout';
                editBtn.onclick = () => {
                    // Hydrate UI State
                    cols = layout.cols;
                    rows = layout.rows;
                    layoutName = layout.name;
                    
                    colsSelect.setValue(cols.toString());
                    rowsSelect.setValue(rows.toString());
                    nameInput.value = layoutName;
                    
                    // Parse gridAreas string back to matrix
                    const rowsArr = layout.gridAreas.match(/"([^"]+)"/g)?.map(r => r.replace(/"/g, '').trim().split(/\s+/)) || [];
                    if (rowsArr.length === rows) {
                        gridMatrix = rowsArr.map(row => row.map(area => parseInt(area.replace('area', ''))));
                    } else {
                        initMatrix(); // Fallback if corrupted
                    }
                    
                    drawGrid();
                    new Notice(`Editing layout: ${layoutName}`);
                    
                    // Scroll to top of builder
                    builderCard.scrollIntoView({ behavior: 'smooth' });
                };

                const delBtn = actionBtns.createEl('button');
                setIcon(delBtn, 'trash');
                delBtn.style.cssText = 'background: transparent; border: none; cursor: pointer; color: var(--text-error); padding: 4px;';
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
        section.style.cssText = 'margin-bottom: 1.5rem;';

        const sectionHeader = section.createDiv();
        sectionHeader.style.cssText = 'margin-bottom: 0.75rem; display: flex; justify-content: space-between; align-items: center;';

        sectionHeader.createEl('h2', { text: 'Standard Callouts' }).style.cssText = `
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-muted);
        `;

        // Grid/List toggle
        const toggleDiv = sectionHeader.createDiv();
        toggleDiv.style.cssText = 'display: flex; border: 1px solid var(--background-modifier-border); border-radius: 6px; overflow: hidden;';

        const gridBtn = toggleDiv.createEl('button', { text: 'Grid' });
        gridBtn.style.cssText = `padding: 4px 10px; border: none; cursor: pointer; font-size: 0.8rem; ${this.standardStylesViewMode === 'grid' ? 'background: var(--interactive-accent); color: white;' : 'background: var(--background-secondary); color: var(--text-muted);'}`;
        gridBtn.onclick = () => { this.standardStylesViewMode = 'grid'; this.display(); };

        const listBtn = toggleDiv.createEl('button', { text: 'List' });
        listBtn.style.cssText = `padding: 4px 10px; border: none; cursor: pointer; font-size: 0.8rem; ${this.standardStylesViewMode === 'list' ? 'background: var(--interactive-accent); color: white;' : 'background: var(--background-secondary); color: var(--text-muted);'}`;
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
        list.style.cssText = 'display: flex; flex-direction: column; gap: 4px;';

        styleNames.forEach(styleName => {
            const style = this.plugin.settings.standardStyles[styleName];
            const defaultStyle = DEFAULT_STANDARD_STYLES[styleName];
            const isModified = style.bg !== defaultStyle.bg ||
                style.text !== defaultStyle.text ||
                style.titleColor !== defaultStyle.titleColor;

            const row = list.createDiv();
            row.style.cssText = `
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 10px 14px;
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                transition: all 0.15s ease;
            `;
            row.onmouseover = () => row.style.borderColor = 'var(--interactive-accent)';
            row.onmouseout = () => row.style.borderColor = 'var(--background-modifier-border)';

            // Color bar
            const colorBar = row.createDiv();
            colorBar.style.cssText = `width: 4px; height: 24px; border-radius: 2px; background: ${style.bg};`;

            // Icon
            const iconSpan = row.createSpan();
            iconSpan.style.cssText = `color: ${style.bg}; display: flex; align-items: center;`;
            setIcon(iconSpan, style.icon || 'file');

            // Name
            const nameSpan = row.createSpan({ text: styleName.charAt(0).toUpperCase() + styleName.slice(1) });
            nameSpan.style.cssText = `flex: 1; font-weight: 500; color: ${style.bg}; font-size: 0.95rem;`;

            // Modified indicator
            if (isModified) {
                const modBadge = row.createSpan({ text: 'â—' });
                modBadge.style.cssText = 'color: var(--text-accent); font-size: 0.6rem;';
                modBadge.title = 'Modified';
            }

            // Edit button
            const editBtn = row.createEl('button');
            editBtn.style.cssText = 'padding: 6px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex;';
            setIcon(editBtn, 'pencil');
            editBtn.title = 'Edit';
            editBtn.onclick = (e) => { e.stopPropagation(); this.openStandardStyleEditor(styleName); };

            // Reset button
            if (isModified) {
                const resetBtn = row.createEl('button');
                resetBtn.style.cssText = 'padding: 6px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex;';
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
        grid.style.cssText = 'display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px;';

        styleNames.forEach(styleName => {
            const style = this.plugin.settings.standardStyles[styleName];
            const defaultStyle = DEFAULT_STANDARD_STYLES[styleName];
            const isModified = style.bg !== defaultStyle.bg ||
                style.text !== defaultStyle.text ||
                style.titleColor !== defaultStyle.titleColor;

            const card = grid.createDiv();
            card.style.cssText = `
                background: var(--background-secondary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 8px;
                padding: 12px;
                cursor: pointer;
                transition: all 0.15s ease;
                text-align: center;
            `;
            card.onmouseover = () => { card.style.borderColor = 'var(--interactive-accent)'; card.style.transform = 'translateY(-2px)'; };
            card.onmouseout = () => { card.style.borderColor = 'var(--background-modifier-border)'; card.style.transform = 'translateY(0)'; };
            card.onclick = () => this.openStandardStyleEditor(styleName);

            // Icon
            const iconDiv = card.createDiv();
            iconDiv.style.cssText = `color: ${style.bg}; margin-bottom: 8px; display: flex; justify-content: center;`;
            setIcon(iconDiv, style.icon || 'file');

            // Name
            const nameDiv = card.createDiv({ text: styleName.charAt(0).toUpperCase() + styleName.slice(1) });
            nameDiv.style.cssText = `font-weight: 500; color: ${style.bg}; font-size: 0.85rem;`;

            // Modified dot
            if (isModified) {
                const modDot = card.createDiv({ text: 'â—' });
                modDot.style.cssText = 'color: var(--text-accent); font-size: 0.5rem; margin-top: 4px;';
            }
        });
    }

    openStandardStyleEditor(styleName: string): void {
        const style = this.plugin.settings.standardStyles[styleName];
        if (!style) return;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: var(--background-primary);
            border: 1px solid var(--background-modifier-border);
            border-radius: 12px;
            padding: 2rem;
            max-width: 450px;
            width: 90%;
            z-index: 10000;
            box-shadow: 0 20px 60px -20px rgba(0,0,0,0.5);
        `;

        modal.createEl('h3', { text: `Edit "${styleName}" Style` }).style.cssText = 'margin: 0 0 1.5rem 0;';

        // Preview
        const previewDiv = modal.createDiv();
        previewDiv.style.cssText = `
            background: color-mix(in srgb, ${style.bg} 15%, transparent);
            border-left: 4px solid ${style.bg};
            border-radius: 6px;
            padding: 12px;
            margin-bottom: 1.5rem;
        `;
        previewDiv.innerHTML = `<strong style="color: ${style.titleColor || style.bg}">${style.name}</strong><br><span style="color: ${style.text || 'var(--text-normal)'}">Preview text content</span>`;

        const updatePreview = () => {
            previewDiv.style.background = `color-mix(in srgb, ${style.bg} 15%, transparent)`;
            previewDiv.style.borderLeftColor = style.bg;
            previewDiv.innerHTML = `<strong style="color: ${style.titleColor || style.bg}">${style.name}</strong><br><span style="color: ${style.text || 'var(--text-normal)'}">Preview text content</span>`;
        };

        // Background color
        const bgRow = modal.createDiv();
        bgRow.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 12px;';
        bgRow.createEl('label', { text: 'Background:' }).style.cssText = 'width: 100px; font-size: 0.9rem;';
        const bgInput = bgRow.createEl('input', { type: 'color', value: style.bg });
        bgInput.style.cssText = 'width: 40px; height: 30px; border: none; cursor: pointer;';
        bgInput.oninput = () => {
            style.bg = bgInput.value;
            style.border = bgInput.value;
            updatePreview();
        };

        // Title color
        const titleRow = modal.createDiv();
        titleRow.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 12px;';
        titleRow.createEl('label', { text: 'Title Color:' }).style.cssText = 'width: 100px; font-size: 0.9rem;';
        const titleInput = titleRow.createEl('input', { type: 'color', value: style.titleColor || style.bg });
        titleInput.style.cssText = 'width: 40px; height: 30px; border: none; cursor: pointer;';
        titleInput.oninput = () => {
            style.titleColor = titleInput.value;
            updatePreview();
        };

        // Text color
        const textRow = modal.createDiv();
        textRow.style.cssText = 'display: flex; align-items: center; gap: 10px; margin-bottom: 1.5rem;';
        textRow.createEl('label', { text: 'Text Color:' }).style.cssText = 'width: 100px; font-size: 0.9rem;';
        const textInput = textRow.createEl('input', { type: 'color', value: style.text || '#ffffff' });
        textInput.style.cssText = 'width: 40px; height: 30px; border: none; cursor: pointer;';
        textInput.oninput = () => {
            style.text = textInput.value;
            updatePreview();
        };

        // Buttons
        const buttons = modal.createDiv();
        buttons.style.cssText = 'display: flex; gap: 10px;';

        const saveBtn = buttons.createEl('button', { text: 'Save' });
        saveBtn.style.cssText = 'flex: 1; padding: 10px; background: var(--interactive-accent); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;';
        saveBtn.onclick = async () => {
            this.plugin.settings.standardStyles[styleName] = style;
            await this.plugin.saveSettings();
            modal.remove();
            overlay.remove();
            this.display();
        };

        const resetBtn = buttons.createEl('button', { text: 'Reset' });
        resetBtn.style.cssText = 'padding: 10px 20px; background: var(--background-modifier-error); color: white; border: none; border-radius: 6px; cursor: pointer; font-weight: 500;';
        resetBtn.onclick = async () => {
            this.plugin.settings.standardStyles[styleName] = { ...DEFAULT_STANDARD_STYLES[styleName] };
            await this.plugin.saveSettings();
            modal.remove();
            overlay.remove();
            this.display();
        };

        const cancelBtn = buttons.createEl('button', { text: 'Cancel' });
        cancelBtn.style.cssText = 'padding: 10px 20px; background: var(--background-secondary); color: var(--text-normal); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer;';
        cancelBtn.onclick = () => {
            modal.remove();
            overlay.remove();
        };

        const overlay = document.createElement('div');
        overlay.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); z-index: 9999;';
        overlay.onclick = () => {
            modal.remove();
            overlay.remove();
        };

        document.body.appendChild(overlay);
        document.body.appendChild(modal);
    }

    createCustomStylesSection(container: HTMLElement): void {
        const section = container.createDiv();
        section.style.cssText = 'margin-bottom: 1.5rem;';

        const sectionHeader = section.createDiv();
        sectionHeader.style.cssText = 'margin-bottom: 1rem; display: flex; justify-content: space-between; align-items: center;';

        sectionHeader.createEl('h2', { text: 'Custom Callouts' }).style.cssText = `
            font-size: 1.1rem;
            font-weight: 600;
            margin: 0;
            color: var(--text-muted);
        `;

        if (this.editingIndex !== null) {
            const banner = section.createDiv();
            banner.style.cssText = 'background: var(--interactive-accent); color: white; padding: 10px 16px; border-radius: 6px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center;';
            banner.createSpan({ text: `Editing: ${this.tempName || 'Untitled'}` }).style.fontWeight = '500';
            const cancelBtn = banner.createEl('button', { text: 'Cancel' });
            cancelBtn.style.cssText = 'background: rgba(255,255,255,0.2); border: none; color: white; padding: 6px 12px; border-radius: 4px; cursor: pointer;';
            cancelBtn.onclick = () => {
                this.editingIndex = null;
                this.resetForm();
                this.display();
            };
        }

        // Creator card
        const creatorCard = section.createDiv();
        creatorCard.style.cssText = `
            padding: 20px;
            border: 1px solid var(--background-modifier-border);
            border-radius: 8px;
            background: var(--background-secondary);
        `;

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
        presetsDiv.style.cssText = 'margin-bottom: 20px;';

        const presetsLabel = presetsDiv.createDiv();
        presetsLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 10px;';
        presetsLabel.createEl('span', { text: 'Quick Start' }).style.cssText = 'font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;';
        presetsLabel.createDiv().style.cssText = 'flex: 1; height: 1px; background: var(--background-modifier-border);';

        const presetsGrid = presetsDiv.createDiv();
        presetsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px;';

        QUICK_START_PRESETS.forEach(preset => {
            const presetBtn = presetsGrid.createEl('button', { text: preset.name });
            presetBtn.style.cssText = `
                padding: 8px 12px;
                background: var(--background-primary);
                border: 1px solid var(--background-modifier-border);
                border-radius: 6px;
                cursor: pointer;
                font-size: 0.85rem;
                color: var(--text-normal);
                transition: all 0.15s;
            `;
            presetBtn.onmouseover = () => { presetBtn.style.borderColor = preset.border; presetBtn.style.color = preset.border; };
            presetBtn.onmouseout = () => { presetBtn.style.borderColor = 'var(--background-modifier-border)'; presetBtn.style.color = 'var(--text-normal)'; };
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
        randomBtn.style.cssText = `
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
        `;
        setIcon(randomBtn.createSpan(), 'dice');
        randomBtn.createSpan({ text: 'Random' }); // Just 'Random' to fit grid
        randomBtn.onmouseover = () => { randomBtn.style.background = 'var(--interactive-accent)'; randomBtn.style.color = 'white'; };
        randomBtn.onmouseout = () => { randomBtn.style.background = 'var(--background-primary)'; randomBtn.style.color = 'var(--text-normal)'; };
        randomBtn.onclick = () => {
            this.applyRandomStyle();
            this.display();
        };
    }

    private createFormSection(creatorCard: HTMLElement): HTMLElement {
        // --- 1. PREVIEW (Top, full width) ---
        const previewLabel = creatorCard.createDiv();
        previewLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';
        previewLabel.createEl('span', { text: 'Live Preview' }).style.cssText = 'font-size: 0.75rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;';
        previewLabel.createDiv().style.cssText = 'flex: 1; height: 1px; background: var(--background-modifier-border);';

        const previewBox = creatorCard.createDiv({ cls: 'callout' });
        previewBox.style.cssText = 'margin-bottom: 24px; min-height: 100px; transition: all 0.2s ease;';

        // --- 2. CONTROLS GRID ---
        const gridContainer = creatorCard.createDiv();
        gridContainer.style.cssText = 'display: grid; grid-template-columns: 1fr 1fr; gap: 24px;';

        const leftCol = gridContainer.createDiv();
        leftCol.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

        const rightCol = gridContainer.createDiv();
        rightCol.style.cssText = 'display: flex; flex-direction: column; gap: 20px;';

        // === LEFT COLUMN (Visuals) ===

        // PANEL: IDENTITY
        const identityPanel = leftCol.createDiv();
        this.createPanelHeader(identityPanel, 'Identity');

        const identityGrid = identityPanel.createDiv();
        identityGrid.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px;';

        // Name
        const nameGroup = identityGrid.createDiv();
        nameGroup.createEl('label', { text: 'Style Name' }).style.cssText = 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;';
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my-style' });
        nameInput.style.cssText = 'width: 100%; padding: 6px 10px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);';
        nameInput.value = this.tempName;
        nameInput.oninput = () => { this.tempName = nameInput.value; this.updatePreview(previewBox); };

        // Icon
        const iconGroup = identityGrid.createDiv();
        iconGroup.createEl('label', { text: 'Icon' }).style.cssText = 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;';

        const iconWrapper = iconGroup.createDiv();
        iconWrapper.style.cssText = 'display: flex; gap: 6px;';
        const iconInput = iconWrapper.createEl('input', { type: 'text' });
        iconInput.style.cssText = 'flex: 1; min-width: 0; padding: 6px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);';
        iconInput.value = this.tempIcon;
        iconInput.oninput = () => { this.tempIcon = iconInput.value; this.updatePreview(previewBox); };

        const iconSearchBtn = iconWrapper.createEl('button');
        iconSearchBtn.style.cssText = 'padding: 0 8px; cursor: pointer; border-radius: 4px; border: 1px solid var(--background-modifier-border); background: var(--interactive-normal);';
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
        colorsGrid.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';

        const colorConfigs = [
            { label: 'Background', val: () => this.tempBg, set: (v: string) => this.tempBg = v },
            { label: 'Border', val: () => this.tempBorder, set: (v: string) => this.tempBorder = v },
            { label: 'Title', val: () => this.tempTitleColor, set: (v: string) => this.tempTitleColor = v },
            { label: 'Text', val: () => this.tempText, set: (v: string) => this.tempText = v },
            { label: 'Link', val: () => this.tempLink, set: (v: string) => this.tempLink = v }
        ];

        colorConfigs.forEach(c => {
            const row = colorsGrid.createDiv();
            row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; gap: 10px;';

            row.createEl('label', { text: c.label }).style.cssText = 'font-size: 0.8rem; color: var(--text-normal); flex: 1;';

            const hexInput = row.createEl('input', { type: 'text' });
            hexInput.style.cssText = 'width: 70px; padding: 2px 4px; border: none; background: transparent; font-family: monospace; font-size: 0.8rem; text-align: right; color: var(--text-muted);';
            hexInput.value = c.val().toUpperCase();

            const wrapper = row.createDiv();
            wrapper.style.cssText = 'position: relative; width: 24px; height: 24px; border-radius: 50%; overflow: hidden; border: 1px solid var(--background-modifier-border);';
            const picker = wrapper.createEl('input', { type: 'color' });
            picker.style.cssText = 'opacity: 0; width: 100%; height: 100%; cursor: pointer; position: absolute; top:0; left:0;';
            picker.value = c.val();

            const display = wrapper.createDiv();
            display.style.cssText = `width: 100%; height: 100%; background: ${c.val()}; pointer-events: none;`;

            picker.oninput = (e: any) => {
                c.set(e.target.value);
                display.style.background = e.target.value;
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
                    display.style.background = v;
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
        neonRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;';

        const neonLabel = neonRow.createDiv();
        neonLabel.createDiv({ text: 'Neon Glow' }).style.cssText = 'font-size: 0.8rem; font-weight: 500;';

        const neonControls = neonRow.createDiv();
        neonControls.style.cssText = 'display: flex; align-items: center; gap: 8px;';

        const neonPicker = neonControls.createEl('input', { type: 'color' });
        neonPicker.style.cssText = 'width: 20px; height: 20px; border: none; padding: 0; background: transparent; cursor: pointer;';
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
        typoGrid.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px;';

        const fontGroup = typoGrid.createDiv();
        fontGroup.createEl('label', { text: 'Font Family' }).style.cssText = 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;';
        const fontSelect = new DropdownComponent(fontGroup);
        fontSelect.selectEl.style.width = '100%';
        fontSelect.addOption('', 'Default');
        Object.keys(FONT_FAMILIES).forEach(f => fontSelect.addOption(f, f.charAt(0).toUpperCase() + f.slice(1)));
        fontSelect.setValue(this.tempFont);
        fontSelect.onChange(val => { this.tempFont = val; this.updatePreview(previewBox); });

        const sizeGroup = typoGrid.createDiv();
        sizeGroup.createEl('label', { text: 'Size' }).style.cssText = 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;';
        const sizeSelect = new DropdownComponent(sizeGroup);
        sizeSelect.selectEl.style.width = '100%';
        Object.keys(FONT_SIZES).forEach(s => sizeSelect.addOption(s, s));
        sizeSelect.setValue(this.tempFontSize.toString());
        sizeSelect.onChange(val => { this.tempFontSize = parseInt(val); this.updatePreview(previewBox); });


        // PANEL: STRUCTURE
        const structPanel = rightCol.createDiv();
        this.createPanelHeader(structPanel, 'Structure');

        // Border Style
        const bsRow = structPanel.createDiv();
        bsRow.style.cssText = 'margin-bottom: 12px;';
        bsRow.createEl('label', { text: 'Border Style' }).style.cssText = 'display: block; font-size: 0.75rem; font-weight: 600; color: var(--text-muted); margin-bottom: 4px;';
        const bsSelect = new DropdownComponent(bsRow);
        bsSelect.selectEl.style.width = '100%';
        ['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset', 'none'].forEach(s => bsSelect.addOption(s, s));
        bsSelect.setValue(this.tempBorderStyle || 'solid');
        bsSelect.onChange(val => { this.tempBorderStyle = val; this.updatePreview(previewBox); });

        // Sliders
        const createSliderRow = (label: string, value: string, setter: (v: string) => void, min: number, max: number, step: number) => {
            const row = structPanel.createDiv();
            row.style.cssText = 'margin-bottom: 12px;';
            const header = row.createDiv();
            header.style.cssText = 'display: flex; justify-content: space-between; margin-bottom: 4px;';
            header.createEl('label', { text: label }).style.cssText = 'font-size: 0.75rem; font-weight: 600; color: var(--text-muted);';
            const valLabel = header.createSpan({ text: value || 'Default' });
            valLabel.style.fontSize = '0.75rem';

            const slider = new SliderComponent(row);
            slider.sliderEl.style.width = '100%';
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
        layoutPanel.createDiv().style.marginTop = '20px';
        this.createPanelHeader(layoutPanel, 'Layout Modes');

        const createToggleRow = (label: string, value: boolean, setter: (v: boolean) => void) => {
            const row = layoutPanel.createDiv();
            row.style.cssText = 'display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;';
            row.createSpan({ text: label }).style.fontWeight = '500';
            const t = new ToggleComponent(row);
            t.setValue(value);
            t.onChange(v => { setter(v); this.updatePreview(previewBox); });
        };

        createToggleRow('Compact Mode', this.tempCompact, (v) => this.tempCompact = v);
        createToggleRow('Hide Icon', this.tempNoIcon, (v) => this.tempNoIcon = v);


        // --- ACTION BUTTONS ---
        const actionsContainer = creatorCard.createDiv();
        actionsContainer.style.cssText = 'margin-top: 24px; padding-top: 16px; border-top: 1px solid var(--background-modifier-border);';

        this.renderActionButtons(actionsContainer, previewBox); // Call new helper

        this.updatePreview(previewBox);
        return previewBox;
    }

    private renderActionButtons(container: HTMLElement, previewBox: HTMLElement): void {
        const row = container.createDiv();
        row.style.cssText = 'display: flex; gap: 12px; align-items: center; justify-content: flex-end;';

        const leftGroup = row.createDiv();
        leftGroup.style.cssText = 'margin-right: auto; display: flex; gap: 8px;';

        const exportBtn = leftGroup.createEl('button');
        exportBtn.style.cssText = 'font-size: 0.8rem; padding: 6px 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;';
        setIcon(exportBtn, 'upload');
        exportBtn.createSpan({ text: 'Export' });
        exportBtn.onclick = () => {
            const styleData = this.getStyleFromForm();
            navigator.clipboard.writeText(JSON.stringify(styleData, null, 2)).then(() => {
                new Notice('Style JSON copied to clipboard!');
            });
        };

        const importBtn = leftGroup.createEl('button');
        importBtn.style.cssText = 'font-size: 0.8rem; padding: 6px 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; display: flex; align-items: center; gap: 6px;';
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
        saveBtn.style.cssText = 'background: var(--interactive-accent); color: white; border: none; padding: 8px 24px; border-radius: 4px; font-weight: 600; cursor: pointer;';
        saveBtn.onclick = async () => {
            await this.saveCurrentStyle();
            this.resetForm();
            this.display();
        };
    }

    private OLD_createFormSection(creatorCard: HTMLElement): HTMLElement {
        // Name & Icon row
        const topRow = creatorCard.createDiv();
        topRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 16px;';

        // Name input
        const nameGroup = topRow.createDiv();
        nameGroup.createEl('label', { text: 'Name' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;';
        const nameInput = nameGroup.createEl('input', { type: 'text', placeholder: 'my-callout' });
        nameInput.style.cssText = 'width: 100%; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); color: var(--text-normal); font-size: 0.9rem;';
        nameInput.value = this.tempName;

        // Icon input
        const iconGroup = topRow.createDiv();
        iconGroup.createEl('label', { text: 'Icon' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;';

        const iconWrapper = iconGroup.createDiv();
        iconWrapper.style.cssText = 'display: flex; gap: 6px;';

        const iconInput = iconWrapper.createEl('input', { type: 'text', placeholder: 'star' });
        iconInput.style.cssText = 'flex: 1; min-width: 0; padding: 8px 12px; border: 1px solid var(--background-modifier-border); border-radius: 6px; background: var(--background-primary); color: var(--text-normal); font-size: 0.9rem;';
        iconInput.value = this.tempIcon;

        const iconBtn = iconWrapper.createEl('button');
        iconBtn.style.cssText = 'padding: 0 10px; background: var(--background-primary); border: 1px solid var(--background-modifier-border); border-radius: 6px; cursor: pointer; color: var(--text-muted); display: flex; align-items: center; justify-content: center;';
        setIcon(iconBtn, 'search');
        iconBtn.title = 'Browse Icons';

        iconBtn.onmouseover = () => { iconBtn.style.borderColor = 'var(--interactive-accent)'; iconBtn.style.color = 'var(--text-normal)'; };
        iconBtn.onmouseout = () => { iconBtn.style.borderColor = 'var(--background-modifier-border)'; iconBtn.style.color = 'var(--text-muted)'; };

        iconBtn.onclick = () => {
            new IconPickerModal(this.app, (selectedIcon) => {
                this.tempIcon = selectedIcon;
                iconInput.value = selectedIcon;
                this.updatePreview(previewBox);
            }).open();
        };

        // Typography Row
        const typoRow = creatorCard.createDiv();
        typoRow.style.cssText = 'display: grid; grid-template-columns: 2fr 1fr; gap: 12px; margin-bottom: 16px;';

        // Font Family
        const fontGroup = typoRow.createDiv();
        fontGroup.createEl('label', { text: 'Font Family' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;';

        const fontSelect = new DropdownComponent(fontGroup);
        fontSelect.selectEl.style.width = '100%';
        fontSelect.selectEl.style.background = 'var(--background-primary)';

        fontSelect.addOption('', 'Default');
        Object.keys(FONT_FAMILIES).forEach(f => fontSelect.addOption(f, f.charAt(0).toUpperCase() + f.slice(1)));

        fontSelect.setValue(this.tempFont);
        fontSelect.onChange((val) => {
            this.tempFont = val;
            this.updatePreview(previewBox);
        });

        // Font Size
        const sizeGroup = typoRow.createDiv();
        sizeGroup.createEl('label', { text: 'Size' }).style.cssText = 'display: block; font-size: 0.8rem; font-weight: 500; color: var(--text-muted); margin-bottom: 4px;';

        const sizeSelect = new DropdownComponent(sizeGroup);
        sizeSelect.selectEl.style.width = '100%';
        sizeSelect.selectEl.style.background = 'var(--background-primary)';

        Object.keys(FONT_SIZES).forEach(s => sizeSelect.addOption(s, s === '3' ? '3 (Normal)' : s));

        sizeSelect.setValue(this.tempFontSize.toString());
        sizeSelect.onChange((val) => {
            this.tempFontSize = parseInt(val);
            this.updatePreview(previewBox);
        });

        // Colors label
        const colorsLabel = creatorCard.createDiv();
        colorsLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 10px;';
        colorsLabel.createEl('span', { text: 'Colors' }).style.cssText = 'font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;';
        colorsLabel.createDiv().style.cssText = 'flex: 1; height: 1px; background: var(--background-modifier-border);';

        // Colors grid
        const colorsGrid = creatorCard.createDiv();
        colorsGrid.style.cssText = 'display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 16px;';

        const colorConfigs = [
            { label: 'BG', value: () => this.tempBg, setter: (v: string) => this.tempBg = v },
            { label: 'Border', value: () => this.tempBorder, setter: (v: string) => this.tempBorder = v },
            { label: 'Title', value: () => this.tempTitleColor, setter: (v: string) => this.tempTitleColor = v },
            { label: 'Text', value: () => this.tempText, setter: (v: string) => this.tempText = v },
            { label: 'Link', value: () => this.tempLink, setter: (v: string) => this.tempLink = v }
        ];

        // Preview
        const previewLabel = creatorCard.createDiv();
        previewLabel.style.cssText = 'display: flex; align-items: center; gap: 8px; margin-bottom: 8px;';
        previewLabel.createEl('span', { text: 'Preview' }).style.cssText = 'font-size: 0.8rem; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;';
        previewLabel.createDiv().style.cssText = 'flex: 1; height: 1px; background: var(--background-modifier-border);';

        const previewBox = creatorCard.createDiv({ cls: 'callout' });
        previewBox.style.cssText = 'margin-bottom: 16px;';

        colorConfigs.forEach(config => {
            const colorItem = colorsGrid.createDiv();
            colorItem.style.cssText = 'display: flex; flex-direction: column; align-items: center; gap: 6px;';

            const colorLabel = colorItem.createEl('label', { text: config.label });
            colorLabel.style.cssText = 'font-size: 0.7rem; color: var(--text-muted); font-weight: 500;';

            const colorPicker = colorItem.createEl('input', { type: 'color' });
            colorPicker.style.cssText = 'width: 36px; height: 36px; border: 2px solid var(--background-modifier-border); border-radius: 50%; cursor: pointer; padding: 0; background: transparent; -webkit-appearance: none; appearance: none; overflow: hidden;';
            colorPicker.value = config.value();

            const hexInput = colorItem.createEl('input', { type: 'text' });
            hexInput.style.cssText = 'width: 70px; padding: 4px 6px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary); color: var(--text-normal); font-size: 0.7rem; font-family: monospace; text-align: center; text-transform: uppercase;';
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
        bottomRow.style.cssText = 'display: flex; justify-content: space-between; align-items: center; gap: 16px; margin-top: 20px;';

        const leftGroup = bottomRow.createDiv();
        leftGroup.style.cssText = 'display: flex; align-items: center; gap: 16px;';

        const toggleRow = leftGroup.createDiv();
        toggleRow.style.cssText = 'display: flex; align-items: center; gap: 8px;';
        const toggle = toggleRow.createEl('input', { type: 'checkbox' });
        toggle.checked = this.tempBoldBorder;
        toggle.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';
        toggle.onchange = () => { this.tempBoldBorder = toggle.checked; this.updatePreview(previewBox); };
        toggleRow.createEl('span', { text: 'Bold border' }).style.cssText = 'font-size: 0.85rem; color: var(--text-muted); margin-right: 12px;';

        const centerToggle = toggleRow.createEl('input', { type: 'checkbox' });
        centerToggle.checked = this.tempCenter;
        centerToggle.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';
        centerToggle.onchange = () => { this.tempCenter = centerToggle.checked; this.updatePreview(previewBox); };
        toggleRow.createEl('span', { text: 'Center' }).style.cssText = 'font-size: 0.85rem; color: var(--text-muted); margin-right: 12px;';

        const titleCenterToggle = toggleRow.createEl('input', { type: 'checkbox' });
        titleCenterToggle.checked = this.tempTitleCenter;
        titleCenterToggle.style.cssText = 'width: 16px; height: 16px; cursor: pointer;';
        titleCenterToggle.onchange = () => { this.tempTitleCenter = titleCenterToggle.checked; this.updatePreview(previewBox); };
        toggleRow.createEl('span', { text: 'Title Center' }).style.cssText = 'font-size: 0.85rem; color: var(--text-muted);';

        // ------------------------------------------------------------
        // IMPORT / EXPORT BUTTONS
        // ------------------------------------------------------------
        const ioGroup = leftGroup.createDiv();
        ioGroup.style.cssText = 'display: flex; gap: 8px; border-left: 1px solid var(--background-modifier-border); padding-left: 16px;';

        // EXPORT BUTTON
        const exportBtn = ioGroup.createEl('button');
        exportBtn.style.cssText = `
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
        `;
        setIcon(exportBtn, 'upload'); // Changed from 'download'
        const expLabel = exportBtn.createSpan({ text: 'Export' });
        exportBtn.title = 'Copy current style to clipboard as JSON';

        exportBtn.onmouseover = () => { exportBtn.style.color = 'var(--text-normal)'; exportBtn.style.borderColor = 'var(--interactive-accent)'; };
        exportBtn.onmouseout = () => { exportBtn.style.color = 'var(--text-muted)'; exportBtn.style.borderColor = 'var(--background-modifier-border)'; };

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
                exportBtn.style.backgroundColor = 'var(--interactive-success)';
                exportBtn.style.color = 'white';
                setTimeout(() => {
                    exportBtn.style.background = 'var(--background-primary)';
                    exportBtn.style.color = 'var(--text-muted)';
                }, 1000);
            }).catch(err => {
                new Notice('Failed to copy to clipboard.');
                console.error(err);
            });
        };

        // IMPORT BUTTON
        const importBtn = ioGroup.createEl('button');
        importBtn.style.cssText = `
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
        `;
        setIcon(importBtn, 'download'); // Changed from 'upload'
        importBtn.createSpan({ text: 'Import' });
        importBtn.title = 'Paste JSON style';

        importBtn.onmouseover = () => { importBtn.style.color = 'var(--text-normal)'; importBtn.style.borderColor = 'var(--interactive-accent)'; };
        importBtn.onmouseout = () => { importBtn.style.color = 'var(--text-muted)'; importBtn.style.borderColor = 'var(--background-modifier-border)'; };

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
        buttonsRow.style.cssText = 'display: flex; gap: 10px;';

        // Cancel button
        const cancelBtn = buttonsRow.createEl('button', { text: 'Cancel' });
        cancelBtn.style.cssText = `
            padding: 10px 20px;
            background: var(--background-modifier-border);
            color: var(--text-normal);
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
            transition: opacity 0.15s;
        `;
        cancelBtn.onmouseover = () => cancelBtn.style.opacity = '0.85';
        cancelBtn.onmouseout = () => cancelBtn.style.opacity = '1';
        cancelBtn.onclick = () => {
            this.editingIndex = null;
            this.resetForm();
            this.display();
        };

        // Save button
        const saveBtn = buttonsRow.createEl('button', { text: this.editingIndex !== null ? 'Update Style' : 'Save Style' });
        saveBtn.style.cssText = `
            padding: 10px 24px;
            background: var(--interactive-accent);
            color: white;
            border: none;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 500;
            font-size: 0.9rem;
            transition: opacity 0.15s;
        `;
        saveBtn.onmouseover = () => saveBtn.style.opacity = '0.85';
        saveBtn.onmouseout = () => saveBtn.style.opacity = '1';
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
                    error.style.cssText = 'padding: 10px; background: #ff5252; color: white; border-radius: 6px; margin-top: 10px; font-size: 0.9rem;';
                    error.textContent = `A style named "${this.tempName}" already exists. Please use a different name.`;

                    setTimeout(() => error.remove(), 3000);
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
        savedHeader.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 20px; margin-bottom: 10px;';

        const headerTitle = savedHeader.createEl('h4', { text: 'Saved Styles' });
        headerTitle.style.margin = '0';

        const viewToggle = savedHeader.createDiv();
        viewToggle.style.cssText = 'display: flex; gap: 5px;';

        const gridBtn = viewToggle.createEl('button', { text: 'Grid' });
        gridBtn.style.cssText = `padding: 5px 12px; border: 1px solid var(--background-modifier-border); background: ${this.stylesViewMode === 'grid' ? 'var(--interactive-accent)' : 'var(--background-primary)'}; color: ${this.stylesViewMode === 'grid' ? 'white' : 'var(--text-normal)'}; border-radius: 4px; cursor: pointer; font-size: 0.8rem;`;
        gridBtn.onclick = () => { this.stylesViewMode = 'grid'; this.display(); };

        const listBtn = viewToggle.createEl('button', { text: 'List' });
        listBtn.style.cssText = `padding: 5px 12px; border: 1px solid var(--background-modifier-border); background: ${this.stylesViewMode === 'list' ? 'var(--interactive-accent)' : 'var(--background-primary)'}; color: ${this.stylesViewMode === 'list' ? 'white' : 'var(--text-normal)'}; border-radius: 4px; cursor: pointer; font-size: 0.8rem;`;
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
        card.style.cssText = 'border: 1px solid var(--background-modifier-border); border-radius: 6px; padding: 10px; background: var(--background-secondary);';

        const header = card.createDiv();
        header.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;';

        const title = header.createEl('h4', { text: s.name });
        title.style.cssText = 'margin: 0; font-size: 0.95rem; font-weight: 600;';

        const actions = header.createDiv();
        actions.style.cssText = 'display: flex; gap: 4px;';

        const editBtn = actions.createEl('button');
        editBtn.style.cssText = 'padding: 4px 8px; background: transparent; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-muted);';
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
        deleteBtn.style.cssText = 'padding: 4px 8px; background: transparent; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-muted);';
        setIcon(deleteBtn, 'trash-2');
        deleteBtn.onclick = async () => {
            this.plugin.settings.customStyles.splice(i, 1);
            await this.plugin.saveSettings();
            this.display();
        };

        if (this.stylesViewMode === 'grid') {
            const preview = card.createDiv();
            const borderWidth = s.boldBorder ? '5px' : '2px';
            preview.style.cssText = `
                background: linear-gradient(135deg, ${s.bg}15 0%, ${s.border}25 100%);
                border: 1px solid ${s.border}30;
                border-left: ${borderWidth} solid ${s.bg};
                border-radius: 6px;
                padding: 10px;
                margin-bottom: 8px;
            `;

            const previewTitle = preview.createDiv();
            previewTitle.style.cssText = `display: flex; align-items: center; gap: 6px; font-weight: 600; font-size: 0.9rem; color: ${s.titleColor || s.bg};`;

            const icon = previewTitle.createSpan();
            icon.style.cssText = `display: inline-flex; color: ${s.titleColor || s.bg};`;
            setIcon(icon, s.icon || 'box');

            previewTitle.createSpan({ text: 'Sample Callout' });

            const previewContent = preview.createDiv();
            previewContent.style.cssText = `color: ${s.text}; font-size: 0.85rem; margin-top: 6px; line-height: 1.4;`;

            // Apply font to preview card
            if (s.font && FONT_FAMILIES[s.font]) {
                preview.style.fontFamily = FONT_FAMILIES[s.font];
            }

            previewContent.textContent = 'This is how your callout will look with ';

            const link = previewContent.createEl('a', { text: 'a link', href: '#' });
            link.style.cssText = `color: ${s.link}; text-decoration: underline;`;
            link.onclick = (e: Event) => e.preventDefault();

            previewContent.appendText(' inside.');
        }

        const details = card.createDiv();
        details.style.cssText = 'display: flex; gap: 6px; flex-wrap: wrap; font-size: 0.75rem;';

        const iconBadge = details.createEl('span', { text: `Icon: ${s.icon}` });
        iconBadge.style.cssText = 'padding: 3px 8px; background: var(--background-primary); border-radius: 3px; color: var(--text-muted);';

        if (s.boldBorder) {
            const boldBadge = details.createEl('span', { text: 'Bold Border' });
            boldBadge.style.cssText = 'padding: 3px 8px; background: var(--background-primary); border-radius: 3px; color: var(--text-muted);';
        }

        if (s.titleColor && s.titleColor !== s.bg) {
            const titleBadge = details.createEl('span', { text: `Title: ${s.titleColor}` });
            titleBadge.style.cssText = 'padding: 3px 8px; background: var(--background-primary); border-radius: 3px; color: var(--text-muted);';
        }
    }

    createStandardColorsSection(container: HTMLElement): void {
        const section = container.createEl('details');
        section.open = false;
        const summary = section.createEl('summary');
        summary.style.cssText = 'font-weight: 600; font-size: 1.1rem; margin: 0 0 0.75rem 0; cursor: pointer; color: var(--text-muted);';
        summary.textContent = 'Standard Colors';

        Object.keys(this.plugin.settings.standardColors).forEach(colorName => {
            if (colorName === 'gray') return;

            const setting = new Setting(section)
                .setName(colorName.charAt(0).toUpperCase() + colorName.slice(1));

            setting.controlEl.style.cssText = 'display: flex; gap: 5px; flex-wrap: wrap;';

            setting.addText(t => {
                t.inputEl.style.cssText = 'width: 90px; font-family: monospace;';
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
        summary.style.cssText = 'font-weight: 600; font-size: 1.1rem; margin: 1rem 0 0.75rem 0; cursor: pointer; color: var(--text-muted);';
        summary.textContent = 'Custom Colors';

        const addColorRow = section.createDiv();
        addColorRow.style.cssText = 'display: flex; gap: 10px; align-items: center; margin: 10px 0 15px 0; flex-wrap: wrap;';

        const nameInput = addColorRow.createEl('input', { type: 'text', placeholder: 'Color name' });
        nameInput.style.cssText = 'flex: 1; min-width: 120px; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);';

        const colorPicker = addColorRow.createEl('input', { type: 'color' });
        colorPicker.style.cssText = 'width: 50px; height: 38px; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer;';
        colorPicker.value = this.newCustomColorHex;

        const hexInput = addColorRow.createEl('input', { type: 'text', placeholder: '#FFFFFF' });
        hexInput.style.cssText = 'width: 100px; font-family: monospace; padding: 8px; border: 1px solid var(--background-modifier-border); border-radius: 4px; background: var(--background-primary);';
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
        addBtn.style.cssText = 'padding: 8px 20px; background: var(--interactive-accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: 500;';
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
            colorRow.style.cssText = 'display: flex; align-items: center; justify-content: space-between; padding: 10px; border: 1px solid var(--background-modifier-border); border-radius: 6px; margin: 8px 0; background: var(--background-secondary);';

            const leftSide = colorRow.createDiv();
            leftSide.style.cssText = 'display: flex; align-items: center; gap: 12px; flex: 1;';

            const colorCircle = leftSide.createDiv();
            colorCircle.style.cssText = `width: 32px; height: 32px; border-radius: 50%; background: ${c.hex}; border: 2px solid var(--background-modifier-border); flex-shrink: 0;`;

            const textInfo = leftSide.createDiv();
            const nameEl = textInfo.createDiv({ text: c.name });
            nameEl.style.cssText = 'font-weight: 500; color: var(--text-normal); margin-bottom: 2px;';

            const hexEl = textInfo.createDiv({ text: c.hex });
            hexEl.style.cssText = 'font-family: monospace; font-size: 0.85rem; color: var(--text-muted);';

            const deleteBtn = colorRow.createEl('button');
            deleteBtn.style.cssText = 'padding: 6px 10px; background: transparent; border: 1px solid var(--background-modifier-border); border-radius: 4px; cursor: pointer; color: var(--text-muted);';
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
        h.style.cssText = 'font-size: 0.7rem; font-weight: 700; color: var(--text-accent); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 12px; opacity: 0.8; padding-top: 4px; border-top: 1px solid var(--background-modifier-border); margin-top: 4px;';
        if (parent.children.length === 1) h.style.borderTop = 'none'; // First item no border
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
        el.style.border = 'none'; // reset default

        if (this.tempBg && (this.tempBg.includes('gradient') || this.tempBg.startsWith('url'))) {
            el.style.background = this.tempBg;
        } else {
            el.style.background = `color-mix(in srgb, ${this.tempBg} 15%, transparent)`;
        }

        // Borders
        let borderWidth = this.tempBoldBorder ? '5px' : '2px';
        if (this.tempBorderWidth) borderWidth = this.tempBorderWidth;
        // ensure unit
        if (!isNaN(Number(borderWidth))) borderWidth += 'px';

        const borderStyle = this.tempBorderStyle || 'solid';
        const borderColor = this.tempBorder || 'var(--text-accent)'; // fallback

        // Apply to all sides as per user preference
        el.style.border = `${borderWidth} ${borderStyle} ${borderColor}`;
        el.style.borderLeft = `${borderWidth} ${borderStyle} ${borderColor}`;

        // Radius
        if (this.tempBorderRadius) {
            el.style.borderRadius = this.tempBorderRadius + (isNaN(Number(this.tempBorderRadius)) ? '' : 'px');
        } else {
            el.style.borderRadius = '6px';
        }

        // Neon Glow
        if (this.tempNeon) {
            el.style.boxShadow = `0 0 10px ${this.tempNeon}, inset 0 0 5px ${this.tempNeon}20`;
            el.style.borderColor = this.tempNeon;
        } else {
            el.style.boxShadow = 'none';
        }

        // Typography - Font Family
        if (this.tempFont && FONT_FAMILIES[this.tempFont]) {
            el.style.fontFamily = FONT_FAMILIES[this.tempFont];
        } else {
            el.style.fontFamily = 'inherit';
        }

        // Typography - Font Size
        if (this.tempFontSize && FONT_SIZES[this.tempFontSize]) {
            el.style.fontSize = FONT_SIZES[this.tempFontSize];
        } else {
            el.style.fontSize = '1em';
        }

        // --- LAYOUT ---
        const isCompact = this.tempCompact;
        const isCenter = this.tempCenter;
        const isTitleCenter = this.tempTitleCenter;
        const noIcon = this.tempNoIcon;

        if (isCenter) {
            el.style.textAlign = 'center';
            el.style.alignItems = 'center'; // if flex not strictly needed for block preview but good for future props
        }

        if (isCompact) {
            el.style.paddingTop = '0';
            el.style.paddingBottom = '0';
            el.style.paddingLeft = '0'; // Callout normally has padding
            el.style.paddingRight = '0';
        } else {
            el.style.padding = '1rem';
        }

        // --- TITLE ---
        const t = el.createDiv({ cls: 'callout-title' });
        t.style.color = this.tempTitleColor;
        t.style.backgroundColor = 'transparent';
        t.style.display = 'flex';
        t.style.alignItems = 'center';
        t.style.gap = '0.5em';
        t.style.fontWeight = '600';

        if (isCenter || isTitleCenter) {
            t.style.justifyContent = 'center';
            t.style.textAlign = 'center';
        }

        if (isCompact) t.style.padding = '0.5em 0.8em';

        // Icon
        if (!noIcon) {
            const i = t.createDiv({ cls: 'callout-icon' });
            i.style.color = this.tempTitleColor;
            i.style.display = 'flex';
            setIcon(i, this.tempIcon || 'pencil');
        }

        // Title Text
        const titleInner = t.createDiv({ cls: 'callout-title-inner', text: this.tempName || 'Callout Preview' });
        if (this.tempFontSize) {
            // Title usually stays 1em relative to container font size
            titleInner.style.fontSize = '1em';
        }

        // --- CONTENT ---
        const c = el.createDiv({ cls: 'callout-content' });
        c.style.color = this.tempText;
        c.style.lineHeight = '1.6';

        if (isCenter) {
            c.style.textAlign = 'center';
            c.style.display = 'flex';
            c.style.flexDirection = 'column';
            c.style.alignItems = 'center';
        }

        if (isCompact) {
            c.style.padding = '0 0.8em 0.5em 0.8em';
        } else {
            c.style.marginTop = '8px';
        }

        c.createDiv({ text: 'This is how your callout will appear with customizable styles. ' });
        const l = c.createEl('a', { text: 'Links look like this', href: '#' });
        l.style.color = this.tempLink;
        l.style.textDecoration = 'underline';
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
        contentEl.createEl('h3', { text: 'Import Style' });

        const helpText = contentEl.createEl('p', { text: 'Paste a JSON style object OR a callout with metadata (e.g., > [!callout] (col:2, neon:red)).' });
        helpText.style.color = 'var(--text-muted)';
        helpText.style.fontSize = '0.9rem';

        const textArea = new TextAreaComponent(contentEl);
        textArea.inputEl.style.width = '100%';
        textArea.inputEl.style.height = '150px';
        textArea.inputEl.style.fontFamily = 'monospace';
        textArea.inputEl.style.fontSize = '0.8rem';
        textArea.setPlaceholder('JSON or > [!type] (metadata)...');
        textArea.onChange((value) => {
            this.jsonText = value;
        });

        const buttonDiv = contentEl.createDiv();
        buttonDiv.style.cssText = 'display: flex; justify-content: flex-end; gap: 10px; margin-top: 15px;';

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
