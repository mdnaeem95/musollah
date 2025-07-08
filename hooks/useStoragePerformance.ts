import { useEffect, useState } from 'react'
import { storage } from '../utils/storage'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useStoragePerformance = () => {
    const [metrics, setMetrics] = useState({
        mmkvReadTime: 0,
        asyncStorageReadTime: 0,
        mmkvWriteTime: 0,
        asyncStorageWriteTime: 0
    })

    const runBenchmark = async () => {
        const testData = JSON.stringify({
            test: 'data',
            array: Array(1000).fill('test'),
            nested: {deep: { object: true } }
        })

        // test mmkv write
        const mmkvWriteStart = Date.now()
        storage.set('benchmark', testData)
        const mmkvWriteTime = Date.now() - mmkvWriteStart

        // test AsyncStorage write
        const asyncWriteStart = Date.now()
        await AsyncStorage.setItem('benchmark', testData)
        const asyncStorageWriteTime = Date.now() - asyncWriteStart

        // test MMKV read
        const mmkvReadStart = Date.now()
        storage.getString('benchmark')
        const mmkvReadTime = Date.now() - mmkvReadStart

        // test asyncstorage read
        const asyncReadStart = Date.now()
        await AsyncStorage.getItem('benchmark')
        const asyncStorageReadTime = Date.now() - asyncReadStart

        setMetrics({
            mmkvReadTime,
            asyncStorageReadTime,
            mmkvWriteTime,
            asyncStorageWriteTime
        })

        // cleanup
        storage.delete('benchmark')
        await AsyncStorage.removeItem('benchmark')
    }

    return { metrics, runBenchmark }
}