// Design System for Neolectra Solar App
export const designSystem = {
  // Color Palette
  colors: {
    // Primary colors
    primary: {
      emerald: "#10b981",
      emeraldDark: "#064e3b",
      emeraldLight: "#34d399",
    },
    secondary: {
      cyan: "#06b6d4", 
      cyanDark: "#0891b2",
      cyanLight: "#22d3ee",
    },
    accent: {
      yellow: "#fbbf24",
      yellowDark: "#d97706", 
      yellowLight: "#fde047",
      orange: "#f59e0b",
    },
    // Neutral colors
    neutral: {
      white: "#ffffff",
      gray50: "#f9fafb",
      gray100: "#f3f4f6",
      gray200: "#e5e7eb",
      gray300: "#d1d5db",
      gray400: "#9ca3af",
      gray500: "#6b7280",
      gray600: "#4b5563",
      gray700: "#374151",
      gray800: "#1f2937",
      gray900: "#111827",
      black: "#000000",
    },
    // Glass/Transparency
    glass: {
      light: "rgba(255, 255, 255, 0.1)",
      medium: "rgba(255, 255, 255, 0.2)",
      dark: "rgba(0, 0, 0, 0.3)",
    }
  },

  // Gradients
  gradients: {
    primary: "linear-gradient(135deg, #10b981, #06b6d4)",
    secondary: "linear-gradient(135deg, #06b6d4, #22d3ee)",
    accent: "linear-gradient(135deg, #fbbf24, #f59e0b)",
    background: "linear-gradient(180deg, #043C35 0%, #032722 45%, #000000 100%)",
    radial: "radial-gradient(1200px 600px at 70% -10%, rgba(6,182,212,0.35), transparent 60%), radial-gradient(800px 400px at 10% 10%, rgba(251,191,36,0.28), transparent 60%)",
    glass: "linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))"
  },

  // Typography
  typography: {
    fontFamily: {
      primary: '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      secondary: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem", 
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
      "6xl": "3.75rem",
      "7xl": "4.5rem",
    },
    fontWeight: {
      normal: "400",
      medium: "500", 
      semibold: "600",
      bold: "700",
      extrabold: "800"
    }
  },

  // Spacing
  spacing: {
    xs: "0.5rem",
    sm: "0.75rem",
    md: "1rem",
    lg: "1.5rem",
    xl: "2rem",
    "2xl": "3rem",
    "3xl": "4rem",
    "4xl": "5rem",
    "5xl": "6rem"
  },

  // Border Radius
  borderRadius: {
    sm: "0.5rem",
    md: "0.75rem", 
    lg: "1rem",
    xl: "1.5rem",
    "2xl": "2rem",
    full: "50%"
  },

  // Shadows
  shadows: {
    sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
    md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
    lg: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
    xl: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
    glow: "0 0 20px rgba(6, 182, 212, 0.5)",
    glowYellow: "0 0 20px rgba(251, 191, 36, 0.5)"
  },

  // Animation
  animation: {
    duration: {
      fast: "0.2s",
      normal: "0.3s", 
      slow: "0.5s",
      slower: "0.8s"
    },
    easing: {
      default: "ease",
      inOut: "ease-in-out",
      out: "ease-out",
      in: "ease-in"
    }
  },

  // Component specific styles
  components: {
    button: {
      primary: `
        background: linear-gradient(135deg, #10b981, #06b6d4);
        color: white;
        border: none;
        border-radius: 0.75rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
        cursor: pointer;
      `,
      secondary: `
        background: rgba(255, 255, 255, 0.1);
        color: white;
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 0.75rem;
        padding: 0.75rem 1.5rem;
        font-weight: 600;
        transition: all 0.3s ease;
        cursor: pointer;
        backdrop-filter: blur(10px);
      `
    },
    card: `
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 1.5rem;
      backdrop-filter: blur(10px);
      padding: 1.5rem;
      transition: all 0.3s ease;
    `,
    input: `
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 0.75rem;
      padding: 0.75rem 1rem;
      color: white;
      font-size: 1rem;
      transition: all 0.3s ease;
      backdrop-filter: blur(5px);
    `
  }
};

// Utility functions for consistent styling
export const getGlassStyle = (opacity = 0.1) => ({
  background: `rgba(255, 255, 255, ${opacity})`,
  backdropFilter: "blur(10px)",
  border: `1px solid rgba(255, 255, 255, ${opacity * 2})`
});

export const getHoverTransform = (scale = 1.02, translateY = -2) => ({
  transform: `scale(${scale}) translateY(${translateY}px)`
});

export const getGradientText = (colors = ["#10b981", "#06b6d4"]) => ({
  background: `linear-gradient(135deg, ${colors.join(", ")})`,
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text"
});
