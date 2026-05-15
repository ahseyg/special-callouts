/**
 * Special Callouts - Metadata Parser
 * Parses callout title metadata into configuration objects
 * 
 * IMPORTANT: Before modifying this file, read RULES.md for mandatory protocols.
 */

import { CalloutConfig, GridConfig } from './types';
import { DEFAULT_CALLOUT_CONFIG } from './constants';
import { resolveColor, smartSplit } from './utils';

/**
 * Parses the metadata content from callout title
 * @param content - Content inside the parentheses
 * @param standardColors - Standard color palette
 * @param customColors - Custom user colors
 * @returns Parsed configuration object
 */
// Module-level constants for performance
const LAYOUT_REGEX = /(?:^|[\s,])(\d+(?:[:,\/]\d+){1,2})(?:$|[\s,])/;
const GROUP_REGEX = /^\(([^)]+)\)$/;

export function parseMetadata(
    content: string,
    standardColors: Record<string, string>,
    customColors: Array<{ name: string; hex: string }>,
    customLayoutNames: string[] = []
): { config: CalloutConfig; layoutParam: string | null; styleParam: string | null } {
    const config: CalloutConfig = { ...DEFAULT_CALLOUT_CONFIG };
    let layoutParam: string | null = null;
    let styleParam: string | null = null;

    // Check for layout parameter (e.g., 1:3 or 1:3:2)
    const layoutMatch = content.match(LAYOUT_REGEX);
    let remainingContent = content;

    if (layoutMatch) {
        layoutParam = layoutMatch[1];
        remainingContent = remainingContent.replace(layoutParam, '').replace(/,,/g, ',');
    }

    const params = smartSplit(remainingContent);
    if (layoutParam) params.push(layoutParam.trim());

    // Check for style parameter
    const styleParamValue = params.find(p => p.toLowerCase().startsWith('style:'));
    if (styleParamValue) {
        styleParam = styleParamValue.split(':')[1].trim().toLowerCase();
    }

    // Color resolver helper
    const resolve = (val: string) => resolveColor(val, standardColors, customColors);

    params.forEach(pair => {
        let key = '', rawValue = '';

        // Handle standalone flags (no colon)
        const loweredPair = pair.trim().toLowerCase();
        
        // Check for custom layout names
        if (customLayoutNames.includes(loweredPair)) {
            config.customLayout = loweredPair;
            return;
        }

        if (loweredPair === 'no-icon' || loweredPair === 'noicon') {
            config.noIcon = true;
            return;
        }
        if (loweredPair === 'center') {
            config.center = true;
            return;
        }

        if (pair.includes(':')) {
            const parts = pair.split(':');
            key = parts[0].trim().toLowerCase();
            rawValue = parts.slice(1).join(':').trim();
        } else {
            return;
        }

        // Check for grouped syntax: key:(value1, value2)
        const groupMatch = rawValue.match(GROUP_REGEX);
        if (groupMatch && ['text', 'title', 'link'].includes(key)) {
            const groupValues = groupMatch[1].split(',').map(v => v.trim().toLowerCase());
            groupValues.forEach(val => {
                if (['dark-border', 'light-border'].includes(val)) {
                    if (key === 'text') config.textBorder = val;
                    else if (key === 'title') config.titleBorder = val;
                    else if (key === 'link') config.linkBorder = val;
                } else if (val === 'center' && key === 'title') {
                    config.titleCenter = true;
                } else {
                    const color = resolve(val);
                    if (key === 'text') config.text = color;
                    else if (key === 'title') config.titleColor = color;
                    else if (key === 'link') config.link = color;
                }
            });
            return;
        }

        // Check for special border values
        const isBorderValue = ['dark-border', 'light-border'].includes(rawValue.toLowerCase());

        // Parse by key type
        // AI_CONTEXT: Removed undocumented flex and advanced grid parameters (w:X, h:X, grid-cols:X) 
        // to simplify inline usage and encourage the Visual Layout Builder.
        switch (key) {
            case 'col':
            case 'column':
                const col = parseInt(rawValue);
                if (!isNaN(col)) config.col = col;
                break;
            case 'bg':
            case 'background':
                config.bg = resolve(rawValue);
                break;
            case 'text':
                if (isBorderValue) {
                    config.textBorder = rawValue.toLowerCase();
                } else {
                    config.text = resolve(rawValue);
                }
                break;
            case 'link':
                if (isBorderValue) {
                    config.linkBorder = rawValue.toLowerCase();
                } else {
                    config.link = resolve(rawValue);
                }
                break;
            case 'title':
                if (isBorderValue) {
                    config.titleBorder = rawValue.toLowerCase();
                } else if (rawValue.toLowerCase() === 'center') {
                    config.titleCenter = true;
                } else {
                    config.titleColor = resolve(rawValue);
                }
                break;
            case 'border':
                config.border = resolve(rawValue);
                break;
            case 'border-width':
                config.borderWidth = rawValue;
                break;
            case 'border-style':
                config.borderStyle = rawValue;
                break;
            case 'neon':
                config.neon = resolve(rawValue);
                break;
            case 'radius':
                config.radius = rawValue;
                break;
            case 'gradient':
                config.gradient = rawValue;
                break;
            case 'font':
                config.font = rawValue.toLowerCase();
                break;
            case 'font-size':
                const size = parseInt(rawValue);
                if (!isNaN(size) && size >= 1 && size <= 5) {
                    config.fontSize = size;
                }
                break;
            case 'compact':
            case 'dense':
                config.compact = true;
                break;
            case 'padding':
                if (rawValue === '0') config.compact = true;
                break;
            case 'no-icon':
            case 'noicon':
                config.noIcon = true;
                break;
            case 'center':
                config.center = true;
                break;
        }
    });

    return { config, layoutParam, styleParam };
}

/**
 * Parses grid layout parameter (e.g., "1:3" or "1:3:2")
 * @param param - Layout parameter string
 * @returns Grid configuration or null
 */
export function parseGridLayout(param: string): GridConfig | null {
    const match = param.match(/^(\d+)[:,\/](\d+)(?:[:,\/](\d+))?$/);
    if (!match) return null;

    return {
        position: parseInt(match[1]),
        columns: parseInt(match[2]),
        row: match[3] ? parseInt(match[3]) : 1
    };
}

/**
 * Extracts metadata content from callout title
 * @param fullText - Full title text
 * @returns Object with metadata content and remaining title
 */
export function extractMetadata(fullText: string): { content: string; title: string } | null {
    const trimmedText = fullText.replace(/^\s+/, '');
    if (!trimmedText.startsWith('(')) return null;

    // Find matching closing parenthesis
    let depth = 0;
    let endIndex = -1;
    for (let i = 0; i < trimmedText.length; i++) {
        if (trimmedText[i] === '(') depth++;
        else if (trimmedText[i] === ')') {
            depth--;
            if (depth === 0) {
                endIndex = i;
                break;
            }
        }
    }

    if (endIndex === -1) return null;

    return {
        content: trimmedText.substring(1, endIndex),
        title: trimmedText.substring(endIndex + 1).trim()
    };
}
