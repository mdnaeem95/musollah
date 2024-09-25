import { View, Text, StyleSheet, TouchableOpacity, Modal, FlatList } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React, { useEffect, useState } from 'react'
import { getDoaAfterPrayer } from '../../../../api/firebase'
import { FontAwesome6 } from '@expo/vector-icons'
import BackArrow from '../../../../components/BackArrow'
import { DoaAfterPrayer } from '../../../../utils/types'

const Doa = () => {
  const [doas, setDoas] = useState<DoaAfterPrayer[]>([]);
  const [tooltipVisible, setTooltipVisible] = useState<boolean>(false);

  useEffect(() => {
    const fetchdoasData = async () => {
      await getDoaAfterPrayer().then((data) => {
        setDoas(data)
      });
         
    };

    fetchdoasData();
  }, [])

  return (
    <SafeAreaView style={styles.mainContainer}>
      <View style={{ paddingHorizontal: 16 }}>
        <BackArrow />
      </View>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Doa After Prayer</Text>
        <TouchableOpacity style={styles.tooltipIcon} onPress={() => setTooltipVisible(true)}>
          <FontAwesome6 name="circle-info" size={15} color="#CCC" />
        </TouchableOpacity>
      </View>

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
      />

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
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1, 
    backgroundColor: '#637E7A'
  },
  headerContainer: {
    marginTop: 20, 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    flexDirection: 'row'
  },
  headerText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_600SemiBold',
    fontSize: 30,
    lineHeight: 45
  },
  tooltipIcon: {
    alignItems: 'center', 
    justifyContent: 'center', 
    marginTop: 7 
  },
  doaContainer: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#CC'
  },
  doaHeaderText: {
    color: '#FFFFFF',
    fontFamily: 'Outfit_500Medium',
    fontSize: 20,
    lineHeight: 25,
    marginBottom: 20 
  },
  doaText: {
    fontFamily: 'Amiri_400Regular',
    color: '#FFFFFF',
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