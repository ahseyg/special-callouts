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
const LAYOUT_REGEX = /(?:^|[\s,])(\d+(?:[:,/]\d+){1,2})(?:$|[\s,])/;
const GROUP_REGEX = /^\(([^)]+)\)$/;

// Neither whitespace, separator nor digit, so a masked character can be neither part
// of a layout token nor the boundary the pattern looks for.
const MASK_CHAR = '\u0000';

/**
 * Blanks the contents of every parenthesised group, keeping the string the same length.
 *
 * The layout token is looked for across the whole metadata string, before it is split into
 * parameters, because it is the one entry written without a key. Digits and separators
 * inside a value look exactly like that token: in `bg:rgba(0,0,0,0.5)` the scan matched
 * `0,0` and cut it out, leaving `rgba(0,,0.5)`. Masking the groups first confines the scan
 * to the top level, and preserving the length means a match still maps onto the original.
 */
function maskGroups(content: string): string {
    let depth = 0;
    let masked = '';

    for (const char of content) {
        if (char === '(') {
            depth++;
            masked += char;
        } else if (char === ')') {
            depth = Math.max(0, depth - 1);
            masked += char;
        } else {
            masked += depth > 0 ? MASK_CHAR : char;
        }
    }

    return masked;
}

/**
 * Expands the grouped form `key:(v1, v2)` into one `key:v1` pair per value.
 *
 * A group is only ever shorthand for writing the same key twice — `text:(white,
 * dark-border)` means `text:white, text:dark-border`. Expanding it before the switch runs
 * means every parameter supports the form for free, and one place decides what a value
 * means instead of two. The branch this replaced knew only text/title/link, and handed the
 * literal string '(red)' to every other key as though it were a colour.
 *
 * Values carrying their own parentheses, such as bg:rgba(0,0,0,.5), are untouched: the
 * group form has to wrap the whole value, and rgba(...) does not start with '('.
 */
function expandGroups(params: string[]): string[] {
    const expanded: string[] = [];

    params.forEach(pair => {
        const colon = pair.indexOf(':');
        if (colon === -1) {
            expanded.push(pair);
            return;
        }

        const key = pair.slice(0, colon).trim();
        const groupMatch = pair.slice(colon + 1).trim().match(GROUP_REGEX);
        if (!key || !groupMatch) {
            expanded.push(pair);
            return;
        }

        groupMatch[1]
            .split(',')
            .map(value => value.trim())
            .filter(value => value)
            .forEach(value => expanded.push(`${key}:${value}`));
    });

    return expanded;
}

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
    const layoutMatch = maskGroups(content).match(LAYOUT_REGEX);
    let remainingContent = content;

    if (layoutMatch && layoutMatch.index !== undefined) {
        layoutParam = layoutMatch[1];
        // Cut the span the regex actually matched. A plain replace(layoutParam, '') removes
        // the first substring that happens to look the same, which need not be this token,
        // and the ,, cleanup that followed only tidied one shape of the leftovers.
        const tokenStart = layoutMatch.index + layoutMatch[0].indexOf(layoutParam);
        remainingContent =
            remainingContent.slice(0, tokenStart) +
            remainingContent.slice(tokenStart + layoutParam.length);
    }

    const params = expandGroups(smartSplit(remainingContent));
    if (layoutParam) params.push(layoutParam.trim());

    // Check for style parameter
    const styleParamValue = params.find(p => p.toLowerCase().startsWith('style:'));
    if (styleParamValue) {
        // Everything after the first colon: a style may be named "Note: Important".
        styleParam = styleParamValue.slice('style:'.length).trim().toLowerCase();
        if (!styleParam) styleParam = null;
    }

    // Color resolver helper
    const resolve = (val: string) => resolveColor(val, standardColors, customColors);

    params.forEach(pair => {
        let key = '', rawValue = '';

        // Handle standalone flags (no colon)
        const loweredPair = pair.trim().toLowerCase();
        if (!loweredPair) return;

        // Built-in flags are checked before saved layout names. A layout shares the bare-word
        // form with a flag, so a layout named `compact` used to shadow the flag everywhere in
        // the vault — every (compact) silently applied a grid instead of reducing padding.
        // Settings now refuses to create such a name; this ordering also repairs any vault
        // that already has one.
        if (loweredPair === 'no-icon' || loweredPair === 'noicon') {
            config.noIcon = true;
            return;
        }
        if (loweredPair === 'center') {
            config.center = true;
            return;
        }
        if (loweredPair === 'compact' || loweredPair === 'dense') {
            // dense is compact plus a tighter line-height, so it implies compact
            config.compact = true;
            if (loweredPair === 'dense') config.dense = true;
            return;
        }

        // Check for custom layout names
        if (customLayoutNames.includes(loweredPair)) {
            config.customLayout = loweredPair;
            return;
        }

        if (pair.includes(':')) {
            const parts = pair.split(':');
            key = parts[0].trim().toLowerCase();
            rawValue = parts.slice(1).join(':').trim();
        } else {
            return;
        }

        // A key with nothing after the colon, or a stray colon with no key, carries no
        // instruction. Falling through would hand '' to branches that assume a value.
        if (!key || !rawValue) return;

        // Check for special border values
        const isBorderValue = ['dark-border', 'light-border'].includes(rawValue.toLowerCase());

        // Parse by key type
        // AI_CONTEXT: Removed undocumented flex and advanced grid parameters (w:X, h:X, grid-cols:X) 
        // to simplify inline usage and encourage the Visual Layout Builder.
        switch (key) {
            case 'col':
            case 'column': {
                const col = parseInt(rawValue);
                if (!isNaN(col)) config.col = col;
                break;
            }
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
            case 'bw':
            case 'border-width':
                config.borderWidth = rawValue;
                break;
            case 'bs':
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
            case 'font-size': {
                const size = parseInt(rawValue);
                if (!isNaN(size) && size >= 1 && size <= 5) {
                    config.fontSize = size;
                }
                break;
            }
            case 'compact':
                config.compact = true;
                break;
            case 'dense':
                config.compact = true;
                config.dense = true;
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
            case 'icon':
                config.icon = rawValue.toLowerCase();
                break;
            case 'icon-color':
            case 'iconcolor':
                config.iconColor = resolve(rawValue);
                break;
            case 'span': {
                const span = parseInt(rawValue);
                if (!isNaN(span) && span >= 1) {
                    config.span = span;
                }
                break;
            }
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
    const match = param.match(/^(\d+)[:,/](\d+)(?:[:,/](\d+))?$/);
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
    const span = findMetadataSpan(trimmedText, 0);
    if (!span) return null;

    return {
        content: span.content,
        title: trimmedText.substring(span.end + 1).trim()
    };
}

/**
 * Locates the metadata block at or after `from`, counting parenthesis depth.
 *
 * This is the single definition of "where does the metadata start and stop". Three places
 * need it — the renderer, the icon command that rewrites a line in the editor, and the
 * settings importer that reads a pasted callout — and each used to carry its own scan. The
 * shortcut versions matched with `/\(([^)]+)\)/` or `/\((.*?)\)/`, which stop at the first
 * closing parenthesis and so cut a grouped value like `text:(white, dark-border)` in half.
 *
 * Leading spaces before the block are skipped. Returns null when the next non-space
 * character is not `(`, or when the block never closes — an unbalanced block is dropped
 * whole rather than guessed at.
 *
 * @param line - the text to scan
 * @param from - index to start at, typically just past the `]` of `[!type]`
 * @returns indices of the opening and closing parenthesis, and the text between them
 */
export function findMetadataSpan(
    line: string,
    from = 0
): { start: number; end: number; content: string } | null {
    let i = from;
    while (i < line.length && line[i] === ' ') i++;
    if (line[i] !== '(') return null;

    let depth = 0;
    for (let j = i; j < line.length; j++) {
        if (line[j] === '(') depth++;
        else if (line[j] === ')') {
            depth--;
            if (depth === 0) {
                return { start: i, end: j, content: line.slice(i + 1, j) };
            }
        }
    }

    return null;
}
