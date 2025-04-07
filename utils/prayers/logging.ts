export const getPrayerAvailability = (prayerTimes: Record<string, string>) => {
    const now = new Date();
  
    return Object.entries(prayerTimes).map(([prayer, time]) => {
      const [hour, minute] = time.split(':').map(Number);
      const prayerTime = new Date();
      prayerTime.setHours(hour, minute, 0, 0);
  
      return {
        prayer,
        isAvailable: now >= prayerTime,
      };
    });
  };  