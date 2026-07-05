import { Theme } from './types';

export const paperTheme: Theme = {
  id: 'paper',
  name: 'Paper',
  isDark: false,
  colors: {
    bg: '#F5F5F3',       // Matte recycled paper light gray
    text: '#222222',     // Dark pencil charcoal text for excellent contrast
    muted: '#6B7280',    // Pencil lead graphite gray
    border: '#D1D5DB',   // Divider pencil lines
    accent: '#1E3A8A',   // Ink blue pen accent (reminiscent of real handwriting ink)
    patternDot: '#E5E5E2', // Dot grid notebook background
    cardBg: '#FAFAF9',   // Pure off-white paper sheet background
    headerBg: '#EAEAE7', // Shaded paper header area
    headerBorder: '#C5C5C2', // Header line margin rule
  },
};
