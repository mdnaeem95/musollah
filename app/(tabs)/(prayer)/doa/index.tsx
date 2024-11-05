import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList, ActivityIndicator } from 'react-native'
import React, { useEffect, useState } from 'react'
import { getDoaAfterPrayer } from '../../../../api/firebase'
import { FontAwesome6 } from '@expo/vector-icons'
import { DoaAfterPrayer } from '../../../../utils/types'

const Doa = () => {
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
        setLoading(false)
      }  
    };

    fetchdoasData();
  }, [])

  return (
    <View style={styles.mainContainer}>
      {loading ? (
        <ActivityIndicator size="large" color="#FFFFFF" style={{marginTop: 20}} />
      ) : (
        <FlatList 
        data={doas}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.doaContainer} >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={styles.doaHeaderText}>{item.step}. {item.title}</Text>
            </View>
            <Text style={styles.doaText}>{item.arabicText}</Text>
            <Text style={styles.romanizedText}>{item.romanized}</Text>
            <Text style={styles.englishText}>{item.englishTranslation}</Text>
          </View>
        )}
        initialNumToRender={10}
        removeClippedSubviews={true}
        />
      )}

      <TouchableOpacity 
        style={styles.tooltipIcon} 
        onPress={() => setTooltipVisible(true)}
      >
          <FontAwesome6 name="circle-info" size={15} color="#CCC" />
      </TouchableOpacity>

      {tooltipVisible && (
        <Modal 
          transparent={true} 
          animationType="fade" 
          visible={tooltipVisible} 
          onRequestClose={() => setTooltipVisible(false)}
        >
          <View style={styles.tooltipContainer}>
            <View style={styles.tooltip}>
              <TouchableOpacity onPress={() => setTooltipVisible(false)} style={{ width: '100%', marginBottom: 10 }}>
                <FontAwesome6 name="xmark" size={20} color="#000" />
              </TouchableOpacity>
              <Text style={styles.tooltipText}>There are many Duas/Zikirs that we can recite. We may recite any heartfelt Dua, in any language that we know, either out loud or silently. This is just a guide for those who are unsure of what to ask for.</Text>
              <Text style={styles.tooltipText}>May Allah s.w.t guide us to all that which pleases Him and accept all our prayers.</Text>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: '#2E3D3A',
    paddingVertical: 16
  },
  tooltipIcon: {
    position: 'absolute',
    left: 275,
    top: 42,
    alignItems: 'center', 
    justifyContent: 'center', 
  },
  doaContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CC'
  },
  doaHeaderText: {
    color: '#ECDFCC',
    fontFamily: 'Outfit_500Medium',
    fontSize: 20,
    lineHeight: 25,
    marginBottom: 20 
  },
  doaText: {
    fontFamily: 'Amiri_400Regular',
    color: '#ECDFCC',
    fontSize: 26,
    lineHeight: 44,
    textAlign: 'right',
    paddingHorizontal: 20,
    marginBottom: 20
},
  romanizedText: {
    fontFamily: 'Outfit_400Regular',
    color: '#D3D3D3',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20
  },
  englishText: {
    fontFamily: 'Outfit_400Regular',
    color: '#D3D3D3',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 20,
    fontStyle: 'italic'
  },
  tooltipContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  tooltip: {
    width: 250, 
    padding: 20,
    backgroundColor: '#FFF',
    borderRadius: 10,
    alignItems: 'center'
  },
  tooltipText: {
    fontFamily: 'Outfit_400Regular',
    fontSize: 16,
    marginBottom: 10,
  },
})

export default Doa