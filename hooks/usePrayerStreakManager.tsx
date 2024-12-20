import { useDispatch } from 'react-redux';
import { AppDispatch } from '../redux/store/store'
import { useEffect, useState } from 'react';
import { useStreakCalculator } from './usePrayerStreakCalculator';
import { updatePrayerStreak } from '../redux/slices/gamificationSlice';

export const usePrayerStreakManager = (prayerLogs: { [date: string]: any }, userId: string | null) => {
    const { current, highest } = useStreakCalculator(prayerLogs);
    const dispatch = useDispatch<AppDispatch>();
    const [streakInfo, setStreakInfo] = useState({
        current: 0,
        highest: 0,
        lastLoggedDate: ''
    });

    const syncStreaks = async () => {
        if (!userId) return;
        const lastLoggedDate = Object.keys(prayerLogs).pop() || '';
        setStreakInfo({ current, highest, lastLoggedDate });

        await dispatch(
            updatePrayerStreak(streakInfo)
        ).unwrap();
    };

    useEffect(() => {
        syncStreaks();
    }, [current, highest, userId]);

    return streakInfo;
}