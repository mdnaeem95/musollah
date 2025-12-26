export const getCurrentDayIndex = () => {
  const today = new Date();
  const dayIndex = today.getDay() - 1; // Monday = 0
  return dayIndex < 0 ? 6 : dayIndex;
};

export const isSameDate = (d1: Date, d2: Date): boolean => {
  const date1 = new Date(d1.getFullYear(), d1.getMonth(), d1.getDate());
  const date2 = new Date(d2.getFullYear(), d2.getMonth(), d2.getDate());
  return date1.getTime() === date2.getTime();
};
