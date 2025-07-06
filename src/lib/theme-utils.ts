import type { CSSProperties } from "react"

import type { Theme } from "./types"

export function getThemeCssProperties(theme: Theme): CSSProperties {
  const { primary, background, accent, radius } = theme
  const isDark = background.l < 50

  const primaryForegroundLightness = primary.l > 50 ? 10 : 98
  const accentForegroundLightness = accent.l > 50 ? 10 : 98

  return {
    "--radius": `${radius}rem`,

    // Base Colors
    "--background": `${background.h} ${background.s}% ${background.l}%`,
    "--foreground": `${background.h} 10% ${isDark ? 98 : 10}%`,

    "--primary": `${primary.h} ${primary.s}% ${primary.l}%`,
    "--primary-foreground": `${primary.h} 10% ${primaryForegroundLightness}%`,

    "--accent": `${accent.h} ${accent.s}% ${accent.l}%`,
    "--accent-foreground": `${accent.h} 10% ${accentForegroundLightness}%`,

    // Derived Colors
    "--card": `${background.h} ${background.s}% ${
      isDark ? background.l + 4 : 100
    }%`,
    "--card-foreground": `hsl(var(--foreground))`,
    "--popover": `${background.h} ${background.s}% ${
      isDark ? background.l + 4 : 98
    }%`,
    "--popover-foreground": `${background.h} 10% ${isDark ? 98 : 10}%`,

    "--secondary": `${background.h} ${background.s * 0.8}% ${
      isDark ? background.l + 8 : 96
    }%`,
    "--secondary-foreground": `hsl(var(--foreground))`,

    "--muted": `${background.h} ${background.s * 0.8}% ${
      isDark ? background.l + 8 : 96
    }%`,
    "--muted-foreground": `${background.h} 10% ${isDark ? 65 : 45}%`,

    "--border": `${background.h} ${background.s}% ${
      isDark ? background.l + 12 : 91
    }%`,
    "--input": `hsl(var(--border))`,
    "--ring": `hsl(var(--primary))`,

    // Static Colors
    "--destructive": "0 84.2% 60.2%",
    "--destructive-foreground": "0 0% 100%",

    // Sidebar Theme (contrasting)
    "--sidebar-background": `${primary.h} ${primary.s * 0.4}% ${
      isDark ? 98 : 10
    }%`,
    "--sidebar-foreground": `${primary.h} 15% ${isDark ? 10 : 98}%`,

    "--sidebar-primary": `hsl(var(--primary))`,
    "--sidebar-primary-foreground": `hsl(var(--primary-foreground))`,

    "--sidebar-accent": `${primary.h} ${primary.s * 0.5}% ${
      isDark ? 95 : 17
    }%`,
    "--sidebar-accent-foreground": `hsl(var(--sidebar-foreground))`,

    "--sidebar-border": `${primary.h} ${primary.s * 0.4}% ${
      isDark ? 90 : 15
    }%`,
    "--sidebar-ring": `hsl(var(--ring))`,
  } as CSSProperties
}
