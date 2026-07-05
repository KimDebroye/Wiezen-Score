import { Theme } from './types';
import { standardTheme } from './standard';
import { darkTheme } from './dark';
import { glassTheme } from './glass';
import { peachTheme } from './peach';
import { cardsTheme } from './cards';
import { paperTheme } from './paper';

export * from './types';
export * from './standard';
export * from './dark';
export * from './glass';
export * from './peach';
export * from './cards';
export * from './paper';

export const THEMES: Theme[] = [
  standardTheme, // Left (Row 1) - Classic Light
  darkTheme,     // Right (Row 1) - Classic Dark
  peachTheme,    // Left (Row 2) - Soft Peach
  glassTheme,    // Right (Row 2) - Ocean
  paperTheme,    // Left (Row 3) - Notepad/Paper
  cardsTheme,    // Right (Row 3) - Casino/Vilt
];

/**
 * Dynamically applies the selected theme's colors to the DOM
 * by updating CSS Custom Properties (Variables) on the document element.
 * @param {Theme} theme - The theme configuration to apply.
 */
export const applyTheme = (theme: Theme) => {
  if (typeof window === 'undefined') return;
  const root = document.documentElement;
  
  // Set the CSS variables
  root.style.setProperty('--color-hd-bg', theme.colors.bg);
  root.style.setProperty('--color-hd-text', theme.colors.text);
  root.style.setProperty('--color-hd-muted', theme.colors.muted);
  root.style.setProperty('--color-hd-border', theme.colors.border);
  root.style.setProperty('--color-hd-accent', theme.colors.accent);
  root.style.setProperty('--color-hd-pattern-dot', theme.colors.patternDot);
  root.style.setProperty('--color-hd-card-bg', theme.colors.cardBg);
  root.style.setProperty('--color-hd-header-bg', theme.colors.headerBg);
  root.style.setProperty('--color-hd-header-border', theme.colors.headerBorder);

  // Toggle standard Tailwind dark mode utility class
  if (theme.isDark) {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
};
