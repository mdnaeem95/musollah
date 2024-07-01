import { Tabs } from 'expo-router'

const TabLayout = () => {
  return (
      <Tabs screenOptions={{ tabBarActiveTintColor: '#FFFFFF', tabBarStyle: { backgroundColor: '#4D6561', borderTopColor: '#FFFFFF' } }}>
        <Tabs.Screen 
            name="index" 
            options={{
                title: 'Prayers',
                headerShown: false
            }} 
        />
        <Tabs.Screen 
            name="musollah" 
            options={{
                title: 'Musollah',
                headerShown: false
            }} 
        />
        <Tabs.Screen 
            name="qiblat" 
            options={{
                title: 'Qiblat',
                headerShown: false
            }} 
        />
        <Tabs.Screen 
            name="(quran)" 
            options={{
                title: 'Quran',
                headerShown: false
            }} 
        />
        <Tabs.Screen 
            name="settings" 
            options={{
                title: 'Settings',
                headerShown: false
            }} 
        />
      </Tabs>
  )
}

export default TabLayout