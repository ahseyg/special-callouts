/**
 * Special Callouts - Constants
 * All constant values and default configurations
 */

import { SpecialCalloutsSettings, CalloutStyle, CalloutConfig } from './types';

/**
 * Default standard color palette
 */
export const DEFAULT_STANDARD_COLORS: Record<string, string> = {
    red: '#e74c3c',
    blue: '#3498db',
    green: '#2ecc71',
    yellow: '#f1c40f',
    orange: '#e67e22',
    purple: '#9b59b6',
    pink: '#e84393',
    teal: '#1abc9c',
    grey: '#95a5a6',
    gray: '#95a5a6'
};

/**
 * Obsidian's default callout types with their default colors
 */
export const DEFAULT_STANDARD_STYLES: Record<string, CalloutStyle> = {
    note: { name: 'note', bg: '#448aff', border: '#448aff', text: '', link: '', icon: 'pencil', titleColor: '' },
    abstract: { name: 'abstract', bg: '#00b8d4', border: '#00b8d4', text: '', link: '', icon: 'clipboard-list', titleColor: '' },
    info: { name: 'info', bg: '#00b8d4', border: '#00b8d4', text: '', link: '', icon: 'info', titleColor: '' },
    todo: { name: 'todo', bg: '#448aff', border: '#448aff', text: '', link: '', icon: 'check-circle-2', titleColor: '' },
    tip: { name: 'tip', bg: '#00bfa5', border: '#00bfa5', text: '', link: '', icon: 'flame', titleColor: '' },
    success: { name: 'success', bg: '#00c853', border: '#00c853', text: '', link: '', icon: 'check', titleColor: '' },
    question: { name: 'question', bg: '#64dd17', border: '#64dd17', text: '', link: '', icon: 'help-circle', titleColor: '' },
    warning: { name: 'warning', bg: '#ff9100', border: '#ff9100', text: '', link: '', icon: 'alert-triangle', titleColor: '' },
    failure: { name: 'failure', bg: '#ff5252', border: '#ff5252', text: '', link: '', icon: 'x', titleColor: '' },
    danger: { name: 'danger', bg: '#ff1744', border: '#ff1744', text: '', link: '', icon: 'zap', titleColor: '' },
    bug: { name: 'bug', bg: '#ff1744', border: '#ff1744', text: '', link: '', icon: 'bug', titleColor: '' },
    example: { name: 'example', bg: '#7c4dff', border: '#7c4dff', text: '', link: '', icon: 'list', titleColor: '' },
    quote: { name: 'quote', bg: '#9e9e9e', border: '#9e9e9e', text: '', link: '', icon: 'quote', titleColor: '' }
};

/**
 * Default plugin settings
 */
export const DEFAULT_SETTINGS: SpecialCalloutsSettings = {
    customColors: [],
    standardColors: { ...DEFAULT_STANDARD_COLORS },
    customStyles: [],
    standardStyles: { ...DEFAULT_STANDARD_STYLES },
    customLayouts: []
};

/**
 * Default callout configuration (for parsing)
 */
export const DEFAULT_CALLOUT_CONFIG: CalloutConfig = {
    bg: '',
    text: '',
    textBorder: '',
    link: '',
    linkBorder: '',
    titleColor: '',
    titleBorder: '',
    border: '',
    borderWidth: '',
    borderStyle: '',
    neon: '',
    radius: '',
    gradient: '',
    font: '',
    fontSize: null,
    col: null,
    customLayout: null,
    compact: false,
    noIcon: false,
    center: false,
    titleCenter: false
};

/**
 * Predefined font families
 */
export const FONT_FAMILIES: Record<string, string> = {
    'mono': 'var(--font-monospace)',
    'serif': 'var(--font-interface-theme), ui-serif, serif',
    'sans': 'var(--font-interface), ui-sans-serif, sans-serif',
    'hand': '"Comic Sans MS", "Chalkboard SE", "Comic Neue", cursive',
    'marker': '"Permanent Marker", "Segoe Print", "Chalkboard", cursive'
};

/**
 * Font size multipliers (1-5 scale, 3 is default/1rem)
 */
export const FONT_SIZES: Record<number, string> = {
    1: '0.85em',
    2: '0.92em',
    3: '1em',
    4: '1.2em',
    5: '1.5em'
};

/**
 * Quick start presets for the settings UI
 */
export const QUICK_START_PRESETS = [
    { name: 'Ocean Deep', bg: '#0a192f', border: '#64ffda', title: '#64ffda', text: '#8892b0', icon: 'waves' },
    { name: 'Neon Glow', bg: '#0f0e17', border: '#ff6bcb', title: '#ff6bcb', text: '#f9f4da', icon: 'zap' },
    { name: 'Forest', bg: '#1b2420', border: '#95d5b2', title: '#95d5b2', text: '#d8f3dc', icon: 'leaf' },
    { name: 'Sunset', bg: '#2d1b3d', border: '#ff7b54', title: '#ffcc70', text: '#ffeadb', icon: 'sunset' }
];

/**
 * Performance tuning constants
 */
export const DEBOUNCE_DELAY = 50;
export const THROTTLE_DELAY = 100;
