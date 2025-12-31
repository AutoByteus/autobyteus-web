import type { ITheme } from '@xterm/xterm';

export interface TerminalTheme {
  name: string;
  id: string;
  colors: ITheme;
  containerBackground: string;
}

export const themes: Record<string, TerminalTheme> = {
  tokyoNight: {
    id: 'tokyoNight',
    name: 'Tokyo Night',
    containerBackground: '#1a1b26',
    colors: {
      background: '#1a1b26',
      foreground: '#a9b1d6',
      cursor: '#f7768e',
      selectionBackground: '#515c7e',
      black: '#414868',
      red: '#f7768e',
      green: '#9ece6a',
      yellow: '#e0af68',
      blue: '#7aa2f7',
      magenta: '#bb9af7',
      cyan: '#7dcfff',
      white: '#c0caf5',
      brightBlack: '#414868',
      brightRed: '#f7768e',
      brightGreen: '#9ece6a',
      brightYellow: '#e0af68',
      brightBlue: '#7aa2f7',
      brightMagenta: '#bb9af7',
      brightCyan: '#7dcfff',
      brightWhite: '#c0caf5'
    }
  },
  dracula: {
    id: 'dracula',
    name: 'Dracula',
    containerBackground: '#282a36',
    colors: {
      background: '#282a36',
      foreground: '#f8f8f2',
      cursor: '#f8f8f2',
      selectionBackground: '#44475a',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#6272a4',
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff'
    }
  },
  vsCodeDark: {
    id: 'vsCodeDark',
    name: 'VS Code Dark',
    containerBackground: '#1e1e1e',
    colors: {
      background: '#1e1e1e',
      foreground: '#cccccc',
      cursor: '#ffffff',
      selectionBackground: '#264f78',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#e5e5e5'
    }
  },
  githubLight: {
    id: 'githubLight',
    name: 'GitHub Light',
    containerBackground: '#ffffff',
    colors: {
      background: '#ffffff',
      foreground: '#24292f', // Slightly darker charcoal
      cursor: '#0366d6',     // GitHub Blue cursor
      selectionBackground: '#dbedff', // Light blue selection
      
      // ANSI Colors - Adjusted for Light Mode visibility (darker)
      black: '#24292f',
      red: '#d73a49',
      green: '#22863a',
      yellow: '#b08800',
      blue: '#0366d6',
      magenta: '#5a32a3',
      cyan: '#1b7c83', // Darkened from #0598bc for better contrast
      white: '#6a737d',
      
      // Bright variants
      brightBlack: '#959da5',
      brightRed: '#cb2431',
      brightGreen: '#28a745',
      brightYellow: '#dbab09',
      brightBlue: '#2188ff',
      brightMagenta: '#8a63d2',
      brightCyan: '#3192aa',
      brightWhite: '#d1d5da'
    }
  }
};

export const defaultTheme = themes.tokyoNight;
