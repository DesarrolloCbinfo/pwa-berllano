import { createTheme } from '@mui/material/styles';

const carteleraTheme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      light: '#42a5f5',
      dark: '#1565c0',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#7c4dff',
      light: '#b47cff',
      dark: '#3f1dcb',
      contrastText: '#ffffff',
    },
    background: {
      default: '#0a1929',
      paper: '#132f4c',
    },
    text: {
      primary: '#ffffff',
      secondary: '#b2bac2',
      disabled: '#546e7a',
    },
    divider: '#1e4976',
    error: { main: '#f44336', light: '#e57373', dark: '#d32f2f' },
    warning: { main: '#ffa726', light: '#ffb74d', dark: '#f57c00' },
    success: { main: '#66bb6a', light: '#81c784', dark: '#388e3c' },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: { fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '2.5rem' },
    h2: { fontFamily: '"Inter", sans-serif', fontWeight: 700, fontSize: '2rem' },
    h3: { fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '1.75rem' },
    h4: { fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '1.5rem' },
    h5: { fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '1.25rem' },
    h6: { fontFamily: '"Inter", sans-serif', fontWeight: 600, fontSize: '1.1rem' },
    subtitle1: { fontFamily: '"Inter", sans-serif', fontWeight: 500 },
    subtitle2: { fontFamily: '"Inter", sans-serif', fontWeight: 500 },
    body1: { fontFamily: '"Inter", "Roboto", sans-serif', fontSize: '0.95rem' },
    body2: { fontFamily: '"Inter", "Roboto", sans-serif', fontSize: '0.85rem' },
    button: {
      fontFamily: '"Inter", sans-serif',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.02em',
    },
    caption: { fontFamily: '"Inter", sans-serif' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      defaultProps: { disableElevation: false },
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          padding: '8px 20px',
        },
        contained: {
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: '#ffffff',
          boxShadow: '0 4px 14px rgba(25,118,210,0.35)',
          '&:hover': {
            background: 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)',
            boxShadow: '0 6px 20px rgba(25,118,210,0.45)',
          },
        },
        outlined: {
          borderColor: '#1e4976',
          color: '#90caf9',
          '&:hover': {
            borderColor: '#42a5f5',
            backgroundColor: 'rgba(25,118,210,0.08)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#132f4c',
          border: '1px solid #1e4976',
          borderRadius: 12,
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#132f4c',
          backgroundImage: 'none',
        },
      },
    },
    MuiTextField: {
      defaultProps: { variant: 'outlined' },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: '#0a1929',
            borderRadius: 10,
            '& fieldset': { borderColor: '#1e4976' },
            '&:hover fieldset': { borderColor: '#42a5f5' },
            '&.Mui-focused fieldset': { borderColor: '#1976d2', borderWidth: 2 },
          },
          '& .MuiInputLabel-root': {
            color: '#90caf9',
            '&.Mui-focused': { color: '#42a5f5' },
          },
          '& .MuiInputBase-input': { color: '#ffffff' },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a1929',
          color: '#ffffff',
        },
        icon: { color: '#90caf9' },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: '#90caf9',
          '&.Mui-focused': { color: '#42a5f5' },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: '#0a1929',
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#1e4976' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#42a5f5' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#1976d2', borderWidth: 2 },
        },
        input: { color: '#ffffff' },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          '&:hover': { backgroundColor: 'rgba(25,118,210,0.12)' },
          '&.Mui-selected': {
            backgroundColor: 'rgba(25,118,210,0.25)',
            '&:hover': { backgroundColor: 'rgba(25,118,210,0.35)' },
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          borderColor: '#1e4976',
          color: '#90caf9',
          '&.Mui-selected': {
            backgroundColor: '#1976d2',
            color: '#ffffff',
            '&:hover': { backgroundColor: '#1565c0' },
          },
        },
      },
    },
    MuiToggleButtonGroup: {
      styleOverrides: {
        root: {
          '& .MuiToggleButtonGroup-grouped': {
            '&.Mui-selected': {
              backgroundColor: '#1976d2',
              color: '#ffffff',
            },
          },
        },
      },
    },
    MuiDivider: {
      styleOverrides: {
        root: { borderColor: '#1e4976' },
      },
    },
    MuiSvgIcon: {
      styleOverrides: {
        root: { color: '#90caf9' },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#132f4c',
          backgroundImage: 'none',
          borderRadius: 16,
        },
      },
    },
    MuiDialogTitle: {
      styleOverrides: {
        root: {
          color: '#ffffff',
          fontWeight: 600,
        },
      },
    },
    MuiDialogContent: {
      styleOverrides: {
        root: {
          color: '#b2bac2',
        },
      },
    },
  },
});

export default carteleraTheme;
