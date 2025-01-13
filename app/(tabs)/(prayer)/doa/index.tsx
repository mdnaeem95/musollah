import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { getDoaAfterPrayer } from '../../../../api/firebase';
import { FontAwesome6 } from '@expo/vector-icons';
import { DoaAfterPrayer } from '../../../../utils/types';
import { useTheme } from '../../../../context/ThemeContext';

const Doa = () => {
  const { theme } = useTheme();

  const [doas, setDoas] = useState<DoaAfterPrayer[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchdoasData = async () => {
      try {
        const data = await getDoaAfterPrayer();
        setDoas(data);
      } catch (error) {
        console.error("Error fetching doas: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchdoasData();
  }, []);

  return (
    <View style={[styles.mainContainer, { backgroundColor: theme.colors.primary }]}>
      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.text.muted} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={doas}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={[styles.doaContainer, { borderBottomColor: theme.colors.text.muted }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[styles.doaHeaderText, { color: theme.colors.text.primary }]}>
                  {item.step}. {item.title}
                </Text>
              </View>
              <Text style={[styles.doaText, { color: theme.colors.text.primary }]}>{item.arabicText}</Text>
              <Text style={[styles.romanizedText, { color: theme.colors.text.secondary }]}>{item.romanized}</Text>
              <Text style={[styles.englishText, { color: theme.colors.text.muted }]}>{item.englishTranslation}</Text>
            </View>
          )}
          ListHeaderComponent={(
            <TouchableOpacity
              style={[styles.tooltipIcon, { backgroundColor: theme.colors.secondary }]}
              onPress={() => setTooltipVisible(true)}
            >
              <FontAwesome6 name="circle-info" size={15} color={theme.colors.text.primary} />
            </TouchableOpacity>
          )}
          initialNumToRender={10}
          removeClippedSubviews={true}
        />
      )}

      {tooltipVisible && (
        <Modal
          transparent={true}
          animationType="fade"
          visible={tooltipVisible}
          onRequestClose={() => setTooltipVisible(false)}
        >
          <View style={styles.tooltipContainer}>
            <View style={[styles.tooltip, { backgroundColor: theme.colors.secondary }]}>
              <TouchableOpacity onPress={() => setTooltipVisible(false)} style={{ width: '100%', marginBottom: 10 }}>
                <FontAwesome6 name="xmark" size={20} color={theme.colors.text.primary} />
              </TouchableOpacity>
              <Text style={[styles.tooltipText, { color: theme.colors.text.primary }]}>
                There are many Duas/Zikirs that we can recite. We may recite any heartfelt Dua, in any language that we
                know, either out loud or silently. This is just a guide for those who are unsure of what to ask for.
              </Text>
              <Text style={[styles.tooltipText, { color: theme.colors.text.primary }]}>
                May Allah s.w.t guide us to all that which pleases Him and accept all our prayers.
              </Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    paddingVertical: 16,
  },
  tooltipIcon: {
    marginTop: 20,
    alignSelf: 'center', // Center the icon horizontally
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },  
  doaContainer: {
    padding: 20,
    borderBottomWidth: 1,
  },
  doaHeaderText: {
    fontFamily: 'Outfit_500Medium',
    fontSize: 20,
    lineHeight: 25,
    marginBottom: 20,
  },
  doaText: {
    fontFamily: 'Amiri_400Regular',
    fontSize: 26,
    lineHeight: 44,
    textAlign: 'right',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  romanizedText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  englishText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontStyle: 'italic',
  },
  tooltipContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  tooltip: {
    width: 250,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',

  },
  tooltipText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    marginBottom: 10,
  },
});

export default Doa;
