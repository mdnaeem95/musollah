/**
 * AccentHeaderBackground
 *
 * Shared navigation-header background for the app's "calm" header treatment:
 * a neutral header surface with a thin sky-phase accent hairline along the bottom.
 * The hairline tracks the live time of day via useAccent (and respects the
 * Living Sky toggle — it falls back to the theme accent when that's off).
 *
 * Use as `headerBackground: () => <AccentHeaderBackground backgroundColor={bg} />`.
 */

import React from 'react';
import { View } from 'react-native';
import { useAccent } from '../hooks/useAccent';

export function AccentHeaderBackground({ backgroundColor }: { backgroundColor: string }) {
  const { accent } = useAccent();
  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View
        style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 2, backgroundColor: accent }}
      />
    </View>
  );
}
