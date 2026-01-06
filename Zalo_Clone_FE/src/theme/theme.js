import { createTheme } from "@mui/material/styles";

// Light theme (mặc định)
export const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: "#0088cc",
      light: "#35a3e0",
      dark: "#006699",
    },
    secondary: {
      main: "#0068ff",
      light: "#339aff",
      dark: "#004bb5",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff"
    },
    text: {
      primary: "#333333",
      secondary: "#666666"
    },
    divider: "rgba(0, 0, 0, 0.12)"
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    subtitle1: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "8px 16px"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12
        }
      }
    }
  }
});

// Dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: "#1da8ff",
      light: "#62daff",
      dark: "#0079cc",
    },
    secondary: {
      main: "#339aff",
      light: "#73caff",
      dark: "#006dcb",
    },
    background: {
      default: "#121212",
      paper: "#1e1e1e"
    },
    text: {
      primary: "#e0e0e0",
      secondary: "#aaaaaa"
    },
    divider: "rgba(255, 255, 255, 0.12)"
  },
  typography: {
    fontFamily: "Roboto, sans-serif",
    h5: {
      fontWeight: 600
    },
    h6: {
      fontWeight: 600
    },
    subtitle1: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 8
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          padding: "8px 16px"
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 12
        }
      }
    }
  }
});

// Zalo theme (phong cách gần với Zalo thực tế)
export const zaloTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: "#0068ff",
      light: "#4b96ff",
      dark: "#0046b3",
    },
    secondary: {
      main: "#00bfa5",
      light: "#5df2d6",
      dark: "#008e76",
    },
    background: {
      default: "#f8f9fa",
      paper: "#ffffff"
    },
    text: {
      primary: "#222222",
      secondary: "#787878"
    },
    divider: "rgba(0, 0, 0, 0.08)"
  },
  typography: {
    fontFamily: "'Roboto', 'Helvetica', 'Arial', sans-serif",
    h5: {
      fontWeight: 700
    },
    h6: {
      fontWeight: 700
    },
    subtitle1: {
      fontWeight: 600
    },
    button: {
      fontWeight: 500
    }
  },
  shape: {
    borderRadius: 10
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 20,
          fontWeight: 500,
          boxShadow: "none"
        },
        contained: {
          boxShadow: "none",
          "&:hover": {
            boxShadow: "0px 2px 4px rgba(0, 0, 0, 0.1)"
          }
        }
      }
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 16
        },
        elevation1: {
          boxShadow: "0px 2px 8px rgba(0, 0, 0, 0.08)"
        }
      }
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          border: "2px solid #f1f1f1"
        }
      }
    }
  }
});

// Mặc định export theme chính
export default zaloTheme;