export interface Theme {
  id: string;
  name: string; // Display name in Dutch
  isDark: boolean;
  colors: {
    bg: string;          // Page background color (e.g., #F9F7F2)
    text: string;        // Primary text color (e.g., #2D2D2D)
    muted: string;       // Secondary muted text (e.g., #8E8C7E)
    border: string;      // Borders (e.g., #D9D7CB)
    accent: string;      // Accent/Action highlights (e.g., #FF6B6B)
    patternDot: string;  // Dot color for the .hd-pattern background (e.g., #E6E4D5)
    cardBg: string;      // Inside table sheet container background (e.g., #FFFFFF)
    headerBg: string;    // Inner panels header backgrounds (e.g., #F2EFE8)
    headerBorder: string;// Inner panels header borders (e.g., #E2DFC2)
  };
}
