/**
 * Special Callouts - Utility Functions
 * Reusable helper functions
 */

/**
 * Debounce: Controls frequently called functions
 * Waits until the specified time has passed since the last call
 */
export function debounce<T extends (...args: unknown[]) => void>(
    func: T,
    wait: number
): T {
    let timeout: ReturnType<typeof setTimeout> | null = null;
    return ((...args: Parameters<T>) => {
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    }) as T;
}

/**
 * Throttle: Ensures function runs at most once per interval
 */
export function throttle<T extends (...args: unknown[]) => void>(
    func: T,
    limit: number
): T {
    let inThrottle = false;
    return ((...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    }) as T;
}

/**
 * Validates hex color code
 * @param hex - Color code to validate
 * @returns true if valid hex code
 */
export function isValidHex(hex: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
}

/**
 * Normalizes hex code - converts 3-char to 6-char format
 * @param hex - Color code to normalize
 * @returns 6-character uppercase hex code
 */
export function normalizeHex(hex: string): string {
    if (!hex.startsWith('#')) hex = '#' + hex;
    if (hex.length === 4) {
        hex = '#' + hex[1] + hex[1] + hex[2] + hex[2] + hex[3] + hex[3];
    }
    return hex.toUpperCase();
}

/**
 * Resolves color value from name or hex
 * @param value - Color name or hex value
 * @param standardColors - Standard color palette
 * @param customColors - Custom user colors
 * @returns Resolved hex color
 */
export function resolveColor(
    value: string,
    standardColors: Record<string, string>,
    customColors: Array<{ name: string; hex: string }>
): string {
    // Check standard color name
    const std = standardColors[value.toLowerCase()];
    if (std) return std;

    // Check custom color name
    const custom = customColors.find(c => c.name.toLowerCase() === value.toLowerCase());
    if (custom) return custom.hex;

    // Return as-is (assume hex code)
    return value;
}

/**
 * Creates transparent background using CSS color-mix
 * @param color - Base color
 * @param opacity - Opacity percentage (default 10)
 */
export function createTransparentBg(color: string, opacity: number = 10): string {
    return `color-mix(in srgb, ${color} ${opacity}%, transparent)`;
}

/**
 * Smart split: splits by comma but not inside parentheses
 * @param str - String to split
 * @returns Array of split parts
 */
export function smartSplit(str: string): string[] {
    const result: string[] = [];
    let current = '';
    let depth = 0;
    for (const char of str) {
        if (char === '(') depth++;
        else if (char === ')') depth--;
        else if (char === ',' && depth === 0) {
            if (current.trim()) result.push(current.trim());
            current = '';
            continue;
        }
        current += char;
    }
    if (current.trim()) result.push(current.trim());
    return result;
}

/**
 * Applies text stroke border for readability
 * @param element - Target HTML element
 * @param borderType - 'dark-border' or 'light-border'
 */
export function applyTextBorder(element: HTMLElement, borderType: string): void {
    const strokeColor = borderType === 'dark-border'
        ? 'rgba(0,0,0,0.8)'
        : 'rgba(255,255,255,0.8)';
    element.style.setProperty('-webkit-text-stroke', `0.5px ${strokeColor}`);
    element.style.textShadow = borderType === 'dark-border'
        ? '0 0 2px rgba(0,0,0,0.5)'
        : '0 0 2px rgba(255,255,255,0.5)';
}
