/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#4A9EFF';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    // Additional colors for comprehensive theming
    cardBackground: '#fff',
    borderColor: '#eee',
    shadowColor: '#000',
    primaryButton: '#007bff',
    primaryButtonText: '#fff',
    secondaryButton: '#f0f0f0',
    secondaryButtonText: '#333',
    errorBackground: '#ffebee',
    errorText: '#d32f2f',
    warningText: '#ff8800',
    successBackground: '#e6f7e6',
    successText: '#006400',
    infoBackground: '#e6f7ff',
    infoText: '#007bff',
    placeholderText: '#666',
    subtleText: '#888',
    dividerColor: '#eee',
  },
  dark: {
    text: '#E8E8E8',
    background: '#0A0A0A',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    // Additional colors for comprehensive dark theming
    cardBackground: '#1A1A1A',
    borderColor: '#333',
    shadowColor: '#000',
    primaryButton: '#4A9EFF',
    primaryButtonText: '#fff',
    secondaryButton: '#2A2A2A',
    secondaryButtonText: '#E8E8E8',
    errorBackground: '#2D1B1B',
    errorText: '#FF6B6B',
    warningText: '#FFB347',
    successBackground: '#1B2D1B',
    successText: '#4CAF50',
    infoBackground: '#1B2A2D',
    infoText: '#4A9EFF',
    placeholderText: '#888',
    subtleText: '#666',
    dividerColor: '#333',
  },
};
