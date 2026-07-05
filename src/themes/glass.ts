import { Theme } from './types';

export const glassTheme: Theme = {
  id: 'glass',
  name: 'Glassmorphism',
  isDark: true,
  colors: {
    bg: '#0F172A', // Deep navy slate
    text: '#E2E8F0', // Cool bright gray
    muted: '#64748B', // Cool blue gray
    border: '#334155', // Slate-700
    accent: '#06B6D4', // Vibrant Cyan neon
    patternDot: '#1E293B', // Slate-800
    cardBg: 'rgba(30, 41, 59, 0.75)', // Frosted glass translucency handled via custom styling/RGBA
    headerBg: '#1E293B',
    headerBorder: '#475569',
  },
};
