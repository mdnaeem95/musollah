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
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 3,
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
      muted: '#2B3533',
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
      fab: {
        background: '#2F4F4F',
        light: '#6C8A7D',
        dark: '#2F4F4F',
        icon: calculateContrastColor('#2F4F4F'),
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#F3F5EB',
      secondary: '#E8ECD8',
      accent: '#A8B897',
      muted: '#F7F9EF',
      text: {
        primary: '#3E5C43',
        secondary: '#587D5B',
        muted: '#6F8572',
        success: '#4CAF50',
        error: '#C62828',
      },
      modalBackground: 'rgba(243, 245, 235, 0.95)',
      tabBar: {
        activeTintColor: '#4CAF50',
        inactiveTintColor: '#A8B897',
        backgroundColor: '#F3F5EB',
        borderColor: '#E8ECD8',
      },
      fab: {
        background: '#6C8A7D', // lighter muted olive green
        light: '#6C8A7D',
        dark: '#2F4F4F',
        icon: calculateContrastColor('#6C8A7D'),
      },
    },
  },
};

export const blueTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#263A50',
      secondary: '#32485E',
      accent: '#E1E7ED',
      muted: '#223346',
      text: {
        primary: calculateContrastColor('#263A50'),
        secondary: calculateContrastColor('#32485E'),
        muted: '#8898AA',
        success: '#5A9EC9',
        error: '#C47171',
      },
      modalBackground: 'rgba(38, 58, 80, 0.8)',
      tabBar: {
        activeTintColor: '#ADC4D3',
        inactiveTintColor: '#677D92',
        backgroundColor: '#263A50',
        borderColor: '#3B5366',
      },
      fab: {
        background: '#355D77',  // deep muted teal blue
        light: '#82A8C5',
        dark: '#355D77',
        icon: calculateContrastColor('#355D77'),
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#E9F2F8',
      secondary: '#D3E2EB',
      accent: '#A6C2D9',
      muted: '#EDF4FA',
      text: {
        primary: '#1C3555',
        secondary: '#2F4D6B',
        muted: '#5E758C',
        success: '#4286B9',
        error: '#D65A5A',
      },
      modalBackground: 'rgba(233, 242, 248, 0.95)',
      tabBar: {
        activeTintColor: '#4286B9',
        inactiveTintColor: '#A6C2D9',
        backgroundColor: '#E9F2F8',
        borderColor: '#D3E2EB',
      },
      fab: {
        background: '#82A8C5',
        light: '#82A8C5',
        dark: '#355D77',
        icon: calculateContrastColor('#82A8C5'),
      },
    },
  },
};

export const purpleTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#362A47',
      secondary: '#44385B',
      accent: '#E3D0E1',
      muted: '#2E243A',
      text: {
        primary: calculateContrastColor('#362A47'),
        secondary: calculateContrastColor('#44385B'),
        muted: '#8D7A9E',
        success: '#9E85C7',
        error: '#C77A87',
      },
      modalBackground: 'rgba(54, 42, 71, 0.8)',
      tabBar: {
        activeTintColor: '#D4BDD9',
        inactiveTintColor: '#6F587B',
        backgroundColor: '#362A47',
        borderColor: '#44385B',
      },
      fab: {
        background: '#6F587B',
        light: '#B89CC9',
        dark: '#6F587B',
        icon: calculateContrastColor('#6F587B'),
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#F2EAF3',
      secondary: '#E5D3E9',
      accent: '#C6A6CE',
      muted: '#EDF4FA',
      text: {
        primary: '#4A2A61',
        secondary: '#62457B',
        muted: '#F5EEF7',
        success: '#7D5FB8',
        error: '#C26472',
      },
      modalBackground: 'rgba(242, 234, 243, 0.95)',
      tabBar: {
        activeTintColor: '#7D5FB8',
        inactiveTintColor: '#C6A6CE',
        backgroundColor: '#F2EAF3',
        borderColor: '#E5D3E9',
      },
      fab: {
        background: '#B89CC9',
        light: '#B89CC9',
        dark: '#6F587B',
        icon: calculateContrastColor('#B89CC9'),
      },
    },
  },
};