import { useColorScheme } from 'react-native';

import { paletteForColorScheme } from './tokens';

export const usePalette = () => paletteForColorScheme(useColorScheme());

export const useIsDarkMode = () => useColorScheme() === 'dark';
