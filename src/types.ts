/**
 * Special Callouts - Type Definitions
 * All TypeScript interfaces and types
 */

/**
 * Custom callout style definition
 */
export interface CalloutStyle {
    name: string;
    bg: string;
    border: string;
    text: string;
    link: string;
    icon: string;
    titleColor?: string;
    boldBorder?: boolean;
    font?: string;
    fontSize?: number;
    borderWidth?: string;
    borderStyle?: string;
    borderRadius?: string;
    neon?: string;
    noIcon?: boolean;
    compact?: boolean;
    center?: boolean;
    titleCenter?: boolean;
}

/**
 * Custom Layout configuration (Grid Areas)
 */
export interface CustomLayout {
    name: string;
    cols: number;
    rows: number;
    gridAreas: string; // CSS grid-template-areas format: '"area1 area2" "area1 area3"'
}

/**
 * Plugin settings structure
 */
export interface SpecialCalloutsSettings {
    customColors: Array<{ name: string; hex: string }>;
    standardColors: Record<string, string>;
    customStyles: Array<CalloutStyle>;
    standardStyles: Record<string, CalloutStyle>;
    customLayouts: Array<CustomLayout>;
}

/**
 * Parsed configuration from callout metadata
 */
export interface CalloutConfig {
    bg: string;
    text: string;
    textBorder: string;
    link: string;
    linkBorder: string;
    titleColor: string;
    titleBorder: string;
    border: string;
    borderWidth: string;
    borderStyle: string;
    neon: string;
    radius: string;
    gradient: string;
    font: string;
    fontSize: number | null;
    col: number | null;
    customLayout: string | null;
    compact: boolean;
    noIcon: boolean;
    center: boolean;
    titleCenter: boolean;
}

/**
 * Grid layout configuration
 */
export interface GridConfig {
    position: number;
    columns: number;
    row: number;
}
