import { calculateContrastColor } from '../utils/index';

const baseTheme = {
  fontSizes: {
    small: 12,
    medium: 14,
    large: 16,
    xLarge: 18,
    xxLarge: 24,
  },
  spacing: {
    small: 8,
    medium: 16,
    large: 24,
  },
  borderRadius: {
    small: 8,
    medium: 12,
    large: 15,
  },
  shadows: {
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 5,
    },
  },
};

export const greenTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#2E3D3A',
      secondary: '#3D4F4C',
      accent: '#F4E2C1',
      text: {
        primary: calculateContrastColor('#2E3D3A'),
        secondary: calculateContrastColor('#3D4F4C'),
        muted: '#999999',
        success: '#78A678',
        error: '#A83A3A',
      },
      modalBackground: 'rgba(46, 61, 58, 0.8)',
      tabBar: {
        activeTintColor: '#BFE1DB',
        inactiveTintColor: '#688A84',
        backgroundColor: '#2E3D3A',
        borderColor: '#3A504C',
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#F3F5EB', // Soft, warm olive-tinged background
      secondary: '#E8ECD8', // Light sage green for secondary elements
      accent: '#A8B897', // Muted olive-green accent
      text: {
        primary: '#3E5C43', // Deep olive for primary text
        secondary: '#587D5B', // Slightly lighter green for secondary text
        muted: '#6F8572', // Muted gray-green for less emphasis
        success: '#4CAF50', // Standard green for success
        error: '#C62828', // Deep red for errors
      },
      modalBackground: 'rgba(243, 245, 235, 0.95)', // Subtle olive background for modals
      tabBar: {
        activeTintColor: '#4CAF50', // Standard green for active tabs
        inactiveTintColor: '#A8B897', // Muted olive for inactive tabs
        backgroundColor: '#F3F5EB', // Matches primary background
        borderColor: '#E8ECD8', // Subtle border matching secondary
      },
    },
  },
};

export const blueTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#263A50', // Muted deep blue background
      secondary: '#32485E', // Slightly lighter secondary blue
      accent: '#E1E7ED', // Soft muted accent
      text: {
        primary: calculateContrastColor('#263A50'), // Contrast color for primary text
        secondary: calculateContrastColor('#32485E'), // Contrast for secondary text
        muted: '#8898AA', // Subtle gray-blue for less emphasis
        success: '#5A9EC9', // Muted success blue
        error: '#C47171', // Muted soft red for errors
      },
      modalBackground: 'rgba(38, 58, 80, 0.8)', // Subtle overlay for modals
      tabBar: {
        activeTintColor: '#ADC4D3', // Light blue for active tabs
        inactiveTintColor: '#677D92', // Muted blue for inactive tabs
        backgroundColor: '#263A50', // Matches primary background
        borderColor: '#3B5366', // Border matching secondary color
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#E9F2F8', // Soft muted light blue background
      secondary: '#D3E2EB', // Light muted secondary blue
      accent: '#A6C2D9', // Subtle blue-gray accent
      text: {
        primary: '#1C3555', // Deep muted blue for primary text
        secondary: '#2F4D6B', // Slightly lighter muted blue for secondary text
        muted: '#5E758C', // Subtle gray-blue for muted text
        success: '#4286B9', // Muted success blue
        error: '#D65A5A', // Muted soft red for errors
      },
      modalBackground: 'rgba(233, 242, 248, 0.95)', // Light translucent blue for modals
      tabBar: {
        activeTintColor: '#4286B9', // Muted success blue for active tabs
        inactiveTintColor: '#A6C2D9', // Subtle blue for inactive tabs
        backgroundColor: '#E9F2F8', // Matches primary background
        borderColor: '#D3E2EB', // Border matching secondary color
      },
    },
  },
};

export const purpleTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#362A47', // Muted deep purple background
      secondary: '#44385B', // Slightly lighter muted secondary purple
      accent: '#E3D0E1', // Soft muted lavender for accents
      text: {
        primary: calculateContrastColor('#362A47'), // Optimized contrast for primary text
        secondary: calculateContrastColor('#44385B'), // Optimized contrast for secondary text
        muted: '#8D7A9E', // Subtle grayish-purple for muted text
        success: '#9E85C7', // Muted lavender-purple for success
        error: '#C77A87', // Soft muted rose for errors
      },
      modalBackground: 'rgba(54, 42, 71, 0.8)', // Subtle overlay for modals
      tabBar: {
        activeTintColor: '#D4BDD9', // Light lavender for active tabs
        inactiveTintColor: '#6F587B', // Muted grayish-purple for inactive tabs
        backgroundColor: '#362A47', // Matches primary background
        borderColor: '#44385B', // Border matching secondary color
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#F2EAF3', // Soft muted lavender background
      secondary: '#E5D3E9', // Light muted lavender secondary
      accent: '#C6A6CE', // Subtle purple-gray accent
      text: {
        primary: '#4A2A61', // Deep muted purple for primary text
        secondary: '#62457B', // Slightly lighter muted purple for secondary text
        muted: '#84699C', // Subtle gray-purple for muted text
        success: '#7D5FB8', // Muted lavender-purple for success
        error: '#C26472', // Muted rose-pink for errors
      },
      modalBackground: 'rgba(242, 234, 243, 0.95)', // Light translucent lavender for modals
      tabBar: {
        activeTintColor: '#7D5FB8', // Muted lavender-purple for active tabs
        inactiveTintColor: '#C6A6CE', // Subtle purple-gray for inactive tabs
        backgroundColor: '#F2EAF3', // Matches primary background
        borderColor: '#E5D3E9', // Border matching secondary color
      },
    },
  },
};