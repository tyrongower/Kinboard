"use client";

const designTokens = {
  palette: {
    mode: "light",
    primary: {
      main: "#3B82F6",
      light: "#60A5FA",
      dark: "#2563EB",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
      contrastText: "#ffffff",
    },
    background: {
      default: "#F7F7FB",
      surface: "#FFFFFF",
    },
    divider: "#E5E7EB",
    text: {
      primary: "#111827",
      secondary: "#6B7280",
    },
    success: { main: "#16A34A" },
    warning: { main: "#F59E0B" },
    error: { main: "#EF4444" },
  },
  shape: {
    borderRadius: 12,
  },
  typography: {
    fontFamily: `Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"`,
    headingWeight: 600,
    buttonWeight: 600,
    buttonTransform: "none",
  },
  components: {
    button: {
      size: "large",
      variant: "filled",
      minHeight: 44,
      borderRadius: 12,
      paddingInline: 16,
      paddingBlock: 12,
      boxShadow:
        "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)",
    },
    tab: {
      minHeight: 56,
      fontSize: "1rem",
      fontWeight: 600,
    },
    surface: {
      borderRadius: 12,
      shadow:
        "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)",
    },
    checkbox: {
      padding: 8,
      iconSize: 28,
    },
    tableCell: {
      paddingBlock: 12,
    },
    textField: {
      size: "medium",
      fullWidth: true,
    },
  },
};

export default designTokens;
