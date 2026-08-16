export const GRID_GUTTER_PX = 1.5;

export const spacing = {
  hair: 2,
  tight: 4,
  snug: 8,
  regular: 12,
  roomy: 16,
  loose: 24,
  section: 32,
} as const;

export const typeScale = {
  caption: 12,
  body: 14,
  emphasis: 15,
  title: 17,
  count: 18,
} as const;

export const avatarDiameter = {
  profileHeader: 86,
  postDetail: 32,
  accountRow: 44,
} as const;

export type Palette = {
  background: string;
  surface: string;
  primaryText: string;
  secondaryText: string;
  separator: string;
  placeholder: string;
  accent: string;
  destructive: string;
  overlay: string;
  onOverlay: string;
};

const lightPalette: Palette = {
  background: '#FFFFFF',
  surface: '#FAFAFA',
  primaryText: '#000000',
  secondaryText: '#737373',
  separator: '#DBDBDB',
  placeholder: '#EFEFEF',
  accent: '#0095F6',
  destructive: '#ED4956',
  overlay: 'rgba(0, 0, 0, 0.45)',
  onOverlay: '#FFFFFF',
};

const darkPalette: Palette = {
  background: '#000000',
  surface: '#121212',
  primaryText: '#FFFFFF',
  secondaryText: '#A8A8A8',
  separator: '#262626',
  placeholder: '#1A1A1A',
  accent: '#0095F6',
  destructive: '#ED4956',
  overlay: 'rgba(0, 0, 0, 0.55)',
  onOverlay: '#FFFFFF',
};

export const paletteForColorScheme = (colorScheme: string | null | undefined) =>
  colorScheme === 'dark' ? darkPalette : lightPalette;
