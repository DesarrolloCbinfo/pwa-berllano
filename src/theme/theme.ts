import { createTheme } from '@mui/material/styles';

// Tema BERLLANO - Minimalista, elegante y profesional
// Basado en el logo monocromático con estética de lujo

const theme = createTheme({
  palette: {
    primary: {
      main: '#1A1A1A', // Negro profundo - para botones principales, enlaces activos y AppBar
      light: '#3A3A3A',
      dark: '#000000',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#B0B0B0', // Gris elegante del logo - para texto secundario y acciones secundarias
      light: '#D0D0D0',
      dark: '#8A8A8A',
      contrastText: '#1A1A1A',
    },
    background: {
      default: '#FFFFFF', // Blanco puro - alto contraste y limpieza
      paper: '#FFFFFF', // Blanco para tarjetas y menús
    },
    text: {
      primary: '#1A1A1A', // Negro
      secondary: '#B0B0B0', // Gris
      disabled: '#D0D0D0',
    },
    divider: '#E0E0E0',
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#ED6C02',
      light: '#FF9800',
      dark: '#E65100',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
  },

  typography: {
    // Fuentes serif elegantes que reflejan la estética del logo
    fontFamily: '"Lora", "Merriweather", "Georgia", serif', // Fuente base para el cuerpo
    
    // Títulos con Playfair Display - fuente serif con gran contraste
    h1: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
      fontSize: '3rem',
      lineHeight: 1.2,
      letterSpacing: '-0.01em',
    },
    h2: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
      fontSize: '2.5rem',
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
      fontSize: '2rem',
      lineHeight: 1.3,
      letterSpacing: '0em',
    },
    h4: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 700,
      fontSize: '1.75rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h5: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 600,
      fontSize: '1.5rem',
      lineHeight: 1.4,
      letterSpacing: '0em',
    },
    h6: {
      fontFamily: '"Playfair Display", "Georgia", serif',
      fontWeight: 600,
      fontSize: '1.25rem',
      lineHeight: 1.5,
      letterSpacing: '0em',
    },
    
    subtitle1: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.75,
      letterSpacing: '0.01em',
    },
    subtitle2: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.57,
      letterSpacing: '0.01em',
    },
    
    body1: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    body2: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    
    button: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontWeight: 500,
      fontSize: '0.875rem',
      lineHeight: 1.75,
      letterSpacing: '0.05em',
      textTransform: 'uppercase', // El logo está en mayúsculas
    },
    
    caption: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.03em',
    },
    
    overline: {
      fontFamily: '"Lora", "Merriweather", serif',
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2.66,
      letterSpacing: '0.08em',
      textTransform: 'uppercase', // El logo está en mayúsculas
    },
  },

  shape: {
    borderRadius: 2, // Bordes muy sutiles, casi cuadrados para un look nítido
  },

  shadows: [
    'none',
    'none', // Eliminamos sombras para mantener el diseño plano
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
    'none',
  ],

  components: {
    // AppBar - Plano y elegante
    MuiAppBar: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          boxShadow: 'none',
        },
        colorPrimary: {
          backgroundColor: '#FFFFFF',
          color: '#1A1A1A',
        },
      },
    },

    // Botones - Nítidos y cuadrados
    MuiButton: {
      defaultProps: {
        disableElevation: true, // Sin sombras
      },
      styleOverrides: {
        root: {
          borderRadius: 2,
          textTransform: 'uppercase',
          fontWeight: 500,
          letterSpacing: '0.05em',
          padding: '8px 22px',
        },
        contained: {
          backgroundColor: '#1A1A1A',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#3A3A3A',
          },
        },
        outlined: {
          borderColor: '#1A1A1A',
          color: '#1A1A1A',
          borderWidth: '1.5px',
          '&:hover': {
            borderColor: '#1A1A1A',
            borderWidth: '1.5px',
            backgroundColor: 'rgba(26, 26, 26, 0.04)',
          },
        },
        text: {
          color: '#1A1A1A',
          '&:hover': {
            backgroundColor: 'rgba(26, 26, 26, 0.04)',
          },
        },
      },
    },

    // Tarjetas y Papers - Planos con bordes sutiles
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: 2,
        },
        outlined: {
          border: '1px solid #E0E0E0',
        },
      },
    },

    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          border: '1px solid #E0E0E0',
          borderRadius: 2,
        },
      },
    },

    // Campos de texto - Outlined por defecto
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 2,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: '#E0E0E0',
            borderWidth: '1.5px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: '#B0B0B0',
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: '#1A1A1A',
            borderWidth: '1.5px',
          },
        },
      },
    },

    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#B0B0B0',
          '&.Mui-focused': {
            color: '#1A1A1A',
          },
        },
      },
    },

    // Iconos - Preferir outlined
    MuiSvgIcon: {
      defaultProps: {
        fontSize: 'medium',
      },
      styleOverrides: {
        root: {
          color: '#1A1A1A',
        },
      },
    },

    // Dividers
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: '#E0E0E0',
        },
      },
    },

    // Links
    MuiLink: {
      styleOverrides: {
        root: {
          color: '#1A1A1A',
          textDecorationColor: '#1A1A1A',
          '&:hover': {
            color: '#3A3A3A',
          },
        },
      },
    },

    // Tabs
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'uppercase',
          fontWeight: 500,
          letterSpacing: '0.05em',
          color: '#B0B0B0',
          '&.Mui-selected': {
            color: '#1A1A1A',
          },
        },
      },
    },

    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: '#1A1A1A',
          height: 2,
        },
      },
    },

    // Menús
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: '1px solid #E0E0E0',
          marginTop: '4px',
        },
      },
    },

    MuiMenuItem: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(26, 26, 26, 0.04)',
          },
          '&.Mui-selected': {
            backgroundColor: 'rgba(26, 26, 26, 0.08)',
            '&:hover': {
              backgroundColor: 'rgba(26, 26, 26, 0.12)',
            },
          },
        },
      },
    },

    // Drawer
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#FFFFFF',
          borderRight: '1px solid #E0E0E0',
        },
      },
    },

    // Accordion
    MuiAccordion: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          border: '1px solid #E0E0E0',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },

    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E0E0E0',
          '&.Mui-expanded': {
            minHeight: 48,
          },
        },
        content: {
          '&.Mui-expanded': {
            margin: '12px 0',
          },
        },
      },
    },
  },
});

export default theme;
