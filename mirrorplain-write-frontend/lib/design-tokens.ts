/**
 * Deterministic Design Tokens
 * Generated from: sha256(project + network + YYYYMM + contract)
 */

// Simple hash function (for demonstration; in production use crypto.subtle.digest)
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

const SEED_STRING = "MirrorPlainWrite" + "Sepolia" + "202511" + "MirrorPlainWrite";
const SEED = simpleHash(SEED_STRING);

// Deterministically select design system
const DESIGN_SYSTEMS = [
  "material",
  "fluent",
  "nord",
  "glassmorphism",
  "neumorphism",
  "brutalism",
  "minimalist",
  "neon"
];
const selectedSystem = DESIGN_SYSTEMS[SEED % DESIGN_SYSTEMS.length];

// Deterministically select color scheme
const COLOR_SCHEMES = [
  { primary: "#7C3AED", secondary: "#06B6D4", name: "Deep Purple & Cyan" }, // Violet + Cyan
  { primary: "#DC2626", secondary: "#F59E0B", name: "Red & Amber" },
  { primary: "#059669", secondary: "#3B82F6", name: "Emerald & Blue" },
  { primary: "#DB2777", secondary: "#8B5CF6", name: "Pink & Purple" },
  { primary: "#EA580C", secondary: "#14B8A6", name: "Orange & Teal" },
  { primary: "#0891B2", secondary: "#EAB308", name: "Cyan & Yellow" },
  { primary: "#4F46E5", secondary: "#10B981", name: "Indigo & Green" },
  { primary: "#BE123C", secondary: "#7C3AED", name: "Rose & Violet" }
];
const selectedColorScheme = COLOR_SCHEMES[(SEED >> 3) % COLOR_SCHEMES.length];

// Typography selection
const TYPOGRAPHY = [
  { heading: "serif", body: "sans-serif", mono: "monospace", name: "Serif/Sans" },
  { heading: "sans-serif", body: "sans-serif", mono: "monospace", name: "Sans/Sans" },
  { heading: "sans-serif", body: "serif", mono: "monospace", name: "Sans/Serif" }
];
const selectedTypography = TYPOGRAPHY[(SEED >> 6) % TYPOGRAPHY.length];

// Animation selection
const ANIMATIONS = ["fade", "slide", "spring", "elastic"];
const selectedAnimation = ANIMATIONS[(SEED >> 9) % ANIMATIONS.length];

/**
 * Design Tokens Export
 */
/**
 * Design tokens for MirrorPlain Write
 * Generated from deterministic seed based on project name and network
 */
export const designTokens = {
  // Metadata
  seed: SEED,
  system: selectedSystem,
  colorSchemeName: selectedColorScheme.name,
  
  // Colors - Light Mode
  colors: {
    light: {
      primary: selectedColorScheme.primary,
      primaryHover: adjustBrightness(selectedColorScheme.primary, -10),
      secondary: selectedColorScheme.secondary,
      secondaryHover: adjustBrightness(selectedColorScheme.secondary, -10),
      background: "#FFFFFF",
      surface: "#F9FAFB",
      surfaceHover: "#F3F4F6",
      text: "#111827",
      textSecondary: "#6B7280",
      border: "#E5E7EB",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    },
    dark: {
      primary: selectedColorScheme.primary,
      primaryHover: adjustBrightness(selectedColorScheme.primary, 10),
      secondary: selectedColorScheme.secondary,
      secondaryHover: adjustBrightness(selectedColorScheme.secondary, 10),
      background: "#0F172A",
      surface: "#1E293B",
      surfaceHover: "#334155",
      text: "#F1F5F9",
      textSecondary: "#94A3B8",
      border: "#334155",
      success: "#10B981",
      warning: "#F59E0B",
      error: "#EF4444",
      info: "#3B82F6",
    }
  },

  // Typography
  typography: {
    fontFamily: {
      heading: selectedTypography.heading === "serif" 
        ? "'Georgia', 'Times New Roman', serif" 
        : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      body: selectedTypography.body === "serif"
        ? "'Georgia', 'Times New Roman', serif"
        : "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      mono: "'Fira Code', 'Courier New', monospace"
    },
    fontSize: {
      xs: "0.75rem",    // 12px
      sm: "0.875rem",   // 14px
      base: "1rem",     // 16px
      lg: "1.125rem",   // 18px
      xl: "1.25rem",    // 20px
      "2xl": "1.5rem",  // 24px
      "3xl": "2rem",    // 32px
      "4xl": "2.5rem",  // 40px
      "5xl": "3rem"     // 48px
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75
    }
  },

  // Spacing (density)
  spacing: {
    comfortable: {
      xs: "0.5rem",   // 8px
      sm: "0.75rem",  // 12px
      md: "1rem",     // 16px
      lg: "1.5rem",   // 24px
      xl: "2rem",     // 32px
      "2xl": "3rem"   // 48px
    },
    compact: {
      xs: "0.25rem",  // 4px
      sm: "0.5rem",   // 8px
      md: "0.75rem",  // 12px
      lg: "1rem",     // 16px
      xl: "1.5rem",   // 24px
      "2xl": "2rem"   // 32px
    }
  },

  // Border Radius
  borderRadius: {
    none: "0",
    sm: "0.25rem",   // 4px
    md: "0.5rem",    // 8px
    lg: "0.75rem",   // 12px
    xl: "1rem",      // 16px
    full: "9999px"
  },

  // Shadows
  shadows: {
    sm: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
    md: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    lg: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
    xl: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
  },

  // Animations
  animation: {
    type: selectedAnimation,
    duration: {
      fast: "150ms",
      normal: "300ms",
      slow: "500ms"
    },
    easing: {
      ease: "ease",
      easeIn: "ease-in",
      easeOut: "ease-out",
      easeInOut: "ease-in-out",
      spring: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
    }
  },

  // Breakpoints
  breakpoints: {
    mobile: "768px",
    tablet: "1024px",
    desktop: "1280px"
  }
};

/**
 * Helper: Adjust color brightness
 */
function adjustBrightness(hex: string, percent: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = Math.min(255, Math.max(0, (num >> 16) + amt));
  const G = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amt));
  const B = Math.min(255, Math.max(0, (num & 0x0000FF) + amt));
  return "#" + (0x1000000 + (R * 0x10000) + (G * 0x100) + B).toString(16).slice(1).toUpperCase();
}

/**
 * CSS Variables Generator (for use in globals.css)
 */
export function generateCSSVariables(theme: 'light' | 'dark' = 'light'): string {
  const colors = designTokens.colors[theme];
  return `
    --color-primary: ${colors.primary};
    --color-primary-hover: ${colors.primaryHover};
    --color-secondary: ${colors.secondary};
    --color-secondary-hover: ${colors.secondaryHover};
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    --color-surface-hover: ${colors.surfaceHover};
    --color-text: ${colors.text};
    --color-text-secondary: ${colors.textSecondary};
    --color-border: ${colors.border};
    --color-success: ${colors.success};
    --color-warning: ${colors.warning};
    --color-error: ${colors.error};
    --color-info: ${colors.info};
  `;
}

// Log theme selection for development
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  console.log("🎨 Design System:", selectedSystem);
  console.log("🎨 Color Scheme:", selectedColorScheme.name);
  console.log("🎨 Typography:", selectedTypography.name);
  console.log("🎨 Animation:", selectedAnimation);
}

