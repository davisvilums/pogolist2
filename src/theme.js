import { red } from '@mui/material/colors';
import { createTheme } from '@mui/material/styles';

// Dark mode uses softened text and slightly lifted surfaces instead of pure
// white on near-black, which is tiring to look at
const darkPalette = {
  primary: {
    main: '#8193e6',
    contrastText: '#10142b',
  },
  secondary: {
    main: '#5fb3aa',
    contrastText: '#0c1f1d',
  },
  background: {
    default: '#17181c',
    paper: '#1e2025',
  },
  text: {
    primary: '#d9dbe1',
    secondary: '#9a9ea8',
    disabled: '#6b6f78',
  },
  divider: 'rgba(217, 219, 225, 0.1)',
};

const lightPalette = {
  primary: {
    main: '#556cd6',
  },
  secondary: {
    main: '#19857b',
  },
};

// A custom theme for this app, in "light" or "dark" mode
export function createAppTheme(mode) {
  return createTheme({
    palette: {
      mode,
      ...(mode === 'dark' ? darkPalette : lightPalette),
      error: {
        main: red.A400,
      },
    },
  });
}

const theme = createAppTheme('light');

export default theme;
