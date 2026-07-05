import { Theme } from './types';

export const peachTheme: Theme = {
  id: 'peach',
  name: 'Peach',
  isDark: false,
  colors: {
    bg: '#FFF5F0',       // Soft pastel peach background
    text: '#4A2A1B',     // Deep warm brown for high contrast and readability
    muted: '#A08070',    // Muted terracotta for helper text
    border: '#F3DCD3',   // Soft warm divider border
    accent: '#FF7A59',   // Beautiful coral peach accent for CTAs
    patternDot: '#FBE4D8', // Grid dot pattern in soft warm orange
    cardBg: '#FFFFFF',   // White container card background
    headerBg: '#FDF0EA', // Soft tinted peach header
    headerBorder: '#EED0C4', // Styled header border
  },
};
