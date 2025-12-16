"use client";

import { createTheme } from "@mui/material/styles";

// Modern light theme tuned for touch-friendly kiosk/admin UIs
const theme = createTheme({
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
      paper: "#FFFFFF",
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
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F7F7FB",
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: "large",
        variant: "contained",
      },
      styleOverrides: {
        root: {
          minHeight: 44,
          borderRadius: 12,
          paddingInline: 16,
          paddingBlock: 12,
          boxShadow:
            "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          minHeight: 56,
          fontSize: "1rem",
          fontWeight: 600,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow:
            "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.1)",
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          padding: 8,
          "& .MuiSvgIcon-root": { fontSize: 28 },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          paddingBlock: 12,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "medium",
        fullWidth: true,
      },
    },
  },
});

export default theme;
