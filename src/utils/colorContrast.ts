/**
 * Color Contrast Utilities
 *
 * Utilities for ensuring WCAG 2.1 AA color contrast compliance.
 *
 * WCAG 2.1 Requirements:
 * - Normal text: 4.5:1 minimum contrast ratio
 * - Large text (18pt+/14pt+ bold): 3:1 minimum contrast ratio
 * - UI Components: 3:1 minimum contrast ratio
 */

/**
 * Convert hex color to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Calculate relative luminance of a color
 * Based on WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-relative-luminance
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  // Normalize RGB values to 0-1 range
  const [rs, gs, bs] = [r, g, b].map((val) => {
    const normalized = val / 255
    return normalized <= 0.03928
      ? normalized / 12.92
      : Math.pow((normalized + 0.055) / 1.055, 2.4)
  })

  // Calculate luminance
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
}

/**
 * Calculate contrast ratio between two colors
 * Based on WCAG formula: https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1)
  const rgb2 = hexToRgb(color2)

  if (!rgb1 || !rgb2) {
    throw new Error('Invalid hex color format')
  }

  const lum1 = getRelativeLuminance(rgb1.r, rgb1.g, rgb1.b)
  const lum2 = getRelativeLuminance(rgb2.r, rgb2.g, rgb2.b)

  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)

  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Check if a color combination meets WCAG AA standards
 */
export function meetsWCAG_AA(
  foreground: string,
  background: string,
  options: {
    level?: 'AA' | 'AAA'
    size?: 'normal' | 'large'
    component?: boolean
  } = {}
): boolean {
  const { level = 'AA', size = 'normal', component = false } = options
  const ratio = getContrastRatio(foreground, background)

  // UI Components requirement
  if (component) {
    return ratio >= 3.0
  }

  // Text requirements
  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7.0
  }

  // AA level (default)
  return size === 'large' ? ratio >= 3.0 : ratio >= 4.5
}

/**
 * Get a WCAG-compliant text color (black or white) for a given background
 */
export function getAccessibleTextColor(backgroundColor: string): string {
  const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor)
  const blackContrast = getContrastRatio('#000000', backgroundColor)

  // Return the color with better contrast
  return whiteContrast > blackContrast ? '#FFFFFF' : '#000000'
}

/**
 * Validate and report contrast issues in a color palette
 */
export function validateColorPalette(palette: {
  [key: string]: { bg: string; text: string; description?: string }
}): Array<{
  key: string
  ratio: number
  passes: boolean
  description?: string
}> {
  return Object.entries(palette).map(([key, { bg, text, description }]) => {
    const ratio = getContrastRatio(text, bg)
    const passes = ratio >= 4.5

    return {
      key,
      ratio: Math.round(ratio * 100) / 100,
      passes,
      description,
    }
  })
}

/**
 * Common WCAG-compliant color combinations
 */
export const WCAG_COLORS = {
  // Primary colors with guaranteed AA compliance
  primary: {
    light: {
      bg: '#FFFFFF',
      text: '#1E40AF', // blue-800 - 8.59:1 ratio
    },
    dark: {
      bg: '#1F2937', // gray-800
      text: '#93C5FD', // blue-300 - 7.12:1 ratio
    },
  },

  // Success colors
  success: {
    light: {
      bg: '#FFFFFF',
      text: '#065F46', // green-800 - 8.27:1 ratio
    },
    dark: {
      bg: '#1F2937',
      text: '#6EE7B7', // green-300 - 8.44:1 ratio
    },
  },

  // Warning colors
  warning: {
    light: {
      bg: '#FFFFFF',
      text: '#92400E', // amber-800 - 7.48:1 ratio
    },
    dark: {
      bg: '#1F2937',
      text: '#FCD34D', // amber-300 - 10.35:1 ratio
    },
  },

  // Error colors
  error: {
    light: {
      bg: '#FFFFFF',
      text: '#991B1B', // red-800 - 7.71:1 ratio
    },
    dark: {
      bg: '#1F2937',
      text: '#FCA5A5', // red-300 - 7.37:1 ratio
    },
  },

  // Info colors
  info: {
    light: {
      bg: '#FFFFFF',
      text: '#1E40AF', // blue-800 - 8.59:1 ratio
    },
    dark: {
      bg: '#1F2937',
      text: '#93C5FD', // blue-300 - 7.12:1 ratio
    },
  },
} as const

/**
 * Format contrast ratio for display
 */
export function formatContrastRatio(ratio: number): string {
  return `${ratio.toFixed(2)}:1`
}

/**
 * Get WCAG level based on contrast ratio and text size
 */
export function getWCAGLevel(
  ratio: number,
  size: 'normal' | 'large' = 'normal'
): 'AAA' | 'AA' | 'Fail' {
  if (size === 'large') {
    if (ratio >= 4.5) return 'AAA'
    if (ratio >= 3.0) return 'AA'
    return 'Fail'
  }

  if (ratio >= 7.0) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  return 'Fail'
}
