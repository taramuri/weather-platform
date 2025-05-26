import { createTheme } from '@mui/material/styles';

const customTheme = createTheme({
  palette: {
    primary: {
      main: '#132a13', // Темно-зелений
      light: '#31572c',
      dark: '#0d1c0d',
      contrastText: '#ecf39e',
    },
    secondary: {
      main: '#4f772d', // Середній зелений
      light: '#6B9440',
      dark: '#3D5A22',
      contrastText: '#ecf39e',
    },
    success: {
      main: '#7f954b', // Світло-зелений
      light: '#A8BD73',
      dark: '#758942',
      contrastText: '#132a13',
    },
    info: {
      main: '#31572c', // Темно-зелений (вторинний)
      light: '#4f772d',
      dark: '#1E3A1A',
      contrastText: '#ecf39e',
    },
    background: {
      default: '#ecf39e', // Світло-зелено-жовтий як основний фон
      paper: '#ffffff',   // Білий для карток та паперів
    },
    text: {
      primary: '#132a13',   // Темно-зелений для основного тексту
      secondary: '#31572c', // Середній зелений для вторинного тексту
    },
    divider: '#90a955',
  },
  components: {
    // Налаштування для Paper компонентів (картки)
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          '&.MuiCard-root': {
            backgroundColor: '#ffffff',
            boxShadow: '0 4px 6px rgba(19, 42, 19, 0.1)',
            border: '1px solid rgba(144, 169, 85, 0.2)',
          },
        },
      },
    },
    // Налаштування для кнопок
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none', 
          borderRadius: 8,
          '&:hover': {
            color: '#132a13 !important',
          },
        },
        containedPrimary: {
          backgroundColor: '#132a13',
          color: '#ecf39e',
          '&:hover': {
            backgroundColor: '#31572c',
            color: '#ecf39e !important', // Залишаємо світлий текст для темного фону
          },
        },
        containedSecondary: {
          backgroundColor: '#4f772d',
          color: '#ecf39e',
          '&:hover': {
            backgroundColor: '#6B9440',
            color: '#132a13 !important', // Примусово темний текст
          },
        },
        contained: {
          '&.MuiButton-containedSuccess': {
            backgroundColor: '#90a955',
            color: '#132a13',
            '&:hover': {
              backgroundColor: '#A8BD73',
              color: '#132a13 !important', // Примусово темний текст
            },
          },
        },
        outlined: {
          borderColor: '#90a955',
          color: '#132a13',
          '&:hover': {
            borderColor: '#132a13',
            backgroundColor: 'rgba(19, 42, 19, 0.04)',
            color: '#132a13 !important', // Примусово темний текст
          },
        },
        // Додаткові налаштування для text кнопок
        text: {
          color: '#132a13',
          '&:hover': {
            backgroundColor: 'rgba(19, 42, 19, 0.04)',
            color: '#132a13 !important', // Примусово темний текст
          },
        },
        // Спеціальні налаштування для success кнопок
        containedSuccess: {
          backgroundColor: '#90a955',
          color: '#132a13',
          '&:hover': {
            backgroundColor: '#A8BD73',
            color: '#132a13 !important', // Примусово темний текст
          },
        },
      },
    },
    // Налаштування для AppBar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#132a13',
          color: '#ecf39e',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          '& .MuiTab-root': {
            color: '#31572c',
            '&.Mui-selected': {
              color: '#132a13',
            },
            '&:hover': {
              color: '#132a13',
              backgroundColor: 'rgba(19, 42, 19, 0.04)',
            },
          },
          '& .MuiTabs-indicator': {
            backgroundColor: '#132a13',
          },
        },
      },
    },    
    MuiChip: {
      styleOverrides: {
        root: {
          backgroundColor: '#90a955',
          color: '#132a13',
          '&:hover': {
            backgroundColor: '#A8BD73',
            color: '#132a13',
          },
          '&.MuiChip-colorPrimary': {
            backgroundColor: '#132a13',
            color: '#ecf39e',
            '&:hover': {
              backgroundColor: '#31572c',
              color: '#ecf39e',
            },
          },
          '&.MuiChip-colorSecondary': {
            backgroundColor: '#4f772d',
            color: '#ecf39e',
            '&:hover': {
              backgroundColor: '#6B9440',
              color: '#132a13',
            },
          },
          '&.MuiChip-colorSuccess': {
            backgroundColor: '#90a955',
            color: '#132a13',
            '&:hover': {
              backgroundColor: '#A8BD73',
              color: '#132a13',
            },
          },
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardSuccess: {
          backgroundColor: 'rgba(144, 169, 85, 0.1)',
          color: '#132a13',
          '& .MuiAlert-icon': {
            color: '#90a955',
          },
        },
        standardInfo: {
          backgroundColor: 'rgba(49, 87, 44, 0.1)',
          color: '#132a13',
          '& .MuiAlert-icon': {
            color: '#31572c',
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          '&:hover': {
            backgroundColor: 'rgba(19, 42, 19, 0.04)',
          },
        },
      },
    },
  },
});

export default customTheme;