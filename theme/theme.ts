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
    small: 10,
    medium: 14,
    large: 18,
  },
  shadows: {
    default: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
  },
};

/** ========== GREEN (minimal + vibrant) ========== */
export const greenTheme = {
  dark: {
    ...baseTheme,
    colors: {
      // Surfaces (neutral so brand/accents stand out)
      primary: '#1B2423',   // background / app surface
      secondary: '#222C2B', // cards / elevated
      accent: '#4CC9A6',    // vibrant pop
      muted: '#1E2726',     // subtle separators / muted surfaces

      text: {
        primary: '#E7EFED',
        secondary: '#B6C3C0',
        muted: '#8FA19C',
        success: '#7ED38E',
        error: '#F28A8A',
        arabic: '#EAF6F1',
      },

      modalBackground: 'rgba(0,0,0,0.35)',

      tabBar: {
        activeTintColor: '#4CC9A6',
        inactiveTintColor: '#7A8E89',
        backgroundColor: '#1B2423',
        borderColor: '#263130',
      },

      fab: {
        background: '#2F4F4F', // brand anchor
        light: '#6C8A7D',
        dark: '#2F4F4F',
        icon: calculateContrastColor('#2F4F4F'),
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#F7F9F7',
      secondary: '#FFFFFF',
      accent: '#2F8F72',   // slightly deeper than dark’s accent for legibility
      muted: '#EEF3F0',

      text: {
        primary: '#0F1F1E',
        secondary: '#4A5B58',
        muted: '#7A8A86',
        success: '#2E7D32',
        error: '#C62828',
        arabic: '#0B1413',
      },

      modalBackground: 'rgba(15,31,30,0.06)',

      tabBar: {
        activeTintColor: '#2F4F4F', // brand
        inactiveTintColor: '#8EA49F',
        backgroundColor: '#FFFFFF',
        borderColor: '#E2E7E4',
      },

      fab: {
        background: '#2F4F4F',
        light: '#6C8A7D',
        dark: '#2F4F4F',
        icon: calculateContrastColor('#2F4F4F'),
      },
    },
  },
};

/** ========== BLUE (minimal + vibrant) ========== */
export const blueTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#11171E',
      secondary: '#17212A',
      accent: '#52A9DD',   // crisp blue pop
      muted: '#161E26',

      text: {
        primary: '#E9EEF3',
        secondary: '#B8C3CD',
        muted: '#91A0AE',
        success: '#7DB7D8',
        error: '#F28A8A',
        arabic: '#EAF2FA',
      },

      modalBackground: 'rgba(0,0,0,0.35)',

      tabBar: {
        activeTintColor: '#52A9DD',
        inactiveTintColor: '#7A8EA1',
        backgroundColor: '#11171E',
        borderColor: '#1F2A35',
      },

      fab: {
        background: '#355D77',
        light: '#82A8C5',
        dark: '#355D77',
        icon: calculateContrastColor('#355D77'),
      },
    },
  },
  light: {
    ...baseTheme,
    colors: {
      primary: '#F2F6FA',
      secondary: '#FFFFFF',
      accent: '#2E7FB3',
      muted: '#E8EFF5',

      text: {
        primary: '#122436',
        secondary: '#32485E',
        muted: '#5E758C',
        success: '#4286B9',
        error: '#D65A5A',
        arabic: '#0E1822',
      },

      modalBackground: 'rgba(18,36,54,0.06)',

      tabBar: {
        activeTintColor: '#2E7FB3',
        inactiveTintColor: '#A6C2D9',
        backgroundColor: '#FFFFFF',
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

/** ========== PURPLE (minimal + vibrant) ========== */
export const purpleTheme = {
  dark: {
    ...baseTheme,
    colors: {
      primary: '#16121C',
      secondary: '#1F1A28',
      accent: '#B27DFF',   // lively but readable on dark
      muted: '#1A1522',

      text: {
        primary: '#F0ECF6',
        secondary: '#CABFDC',
        muted: '#9E8EB5',
        success: '#A98ED8',
        error: '#F28A9B',
        arabic: '#F1EEFA',
      },

      modalBackground: 'rgba(0,0,0,0.35)',

      tabBar: {
        activeTintColor: '#B27DFF',
        inactiveTintColor: '#8D7A9E',
        backgroundColor: '#16121C',
        borderColor: '#261F33',
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
      primary: '#F8F5FA',
      secondary: '#FFFFFF',
      accent: '#8D5ED4',
      muted: '#EFE9F5',

      text: {
        primary: '#2E2142',
        secondary: '#4B3466',
        muted: '#7F6A99',
        success: '#7D5FB8',
        error: '#C26472',
        arabic: '#241736',
      },

      modalBackground: 'rgba(46,33,66,0.06)',

      tabBar: {
        activeTintColor: '#8D5ED4',
        inactiveTintColor: '#C6A6CE',
        backgroundColor: '#FFFFFF',
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
