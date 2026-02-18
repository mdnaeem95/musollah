/**
 * Ramadan Service Constants
 *
 * Special nights, daily duas/hadiths, cache config, and Ramadan-specific values.
 *
 * @version 1.0
 * @since 2026-02-14
 */

import type { RamadanDailyContent, RamadanNotificationPrefs } from './index';

// ============================================================================
// RAMADAN CALENDAR
// ============================================================================

/** Hijri month number for Ramadan */
export const RAMADAN_HIJRI_MONTH = 9;

/** Hijri month number for Sha'ban (month before Ramadan) */
export const SHABAN_HIJRI_MONTH = 8;

/**
 * MUIS Singapore official Ramadan dates override.
 *
 * The Aladhan API uses astronomical calculation (Umm al-Qura calendar) which
 * can differ by 1 day from MUIS's official determination based on moon sighting.
 * For Singapore users we follow MUIS. Update this table each year when MUIS
 * announces the dates.
 *
 * Key: Hijri year. Values: Gregorian start/end dates (yyyy-MM-dd).
 */
export const MUIS_RAMADAN_DATES: Record<number, { start: string; end: string }> = {
  1447: { start: '2026-02-19', end: '2026-03-20' },
};

/** Days before Ramadan to show approaching prompt */
export const APPROACHING_THRESHOLD_DAYS = 3;

/** Laylatul Qadr candidate nights (odd nights in last 10) */
export const LAYLATUL_QADR_NIGHTS = [21, 23, 25, 27, 29] as const;

/** Last 10 nights of Ramadan (days 21-30) */
export const LAST_TEN_NIGHTS_START = 21;

/** Imsak is typically 10 minutes before Subuh in Singapore */
export const IMSAK_OFFSET_MINUTES = 10;

/** Maximum acceptable difference between Aladhan Imsak and MUIS Subuh - 10min */
export const IMSAK_VALIDATION_THRESHOLD_MINUTES = 2;

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

export const RAMADAN_CACHE_TTL = {
  SCHEDULE: 7 * 24 * 60 * 60 * 1000,       // 1 week
  DETECTION: 24 * 60 * 60 * 1000,           // 1 day
  DAILY_TIMES: 60 * 60 * 1000,              // 1 hour
} as const;

export const RAMADAN_STALE_TIME = {
  SCHEDULE: 24 * 60 * 60 * 1000,            // 1 day
  DETECTION: 12 * 60 * 60 * 1000,           // 12 hours
  DAILY_TIMES: 30 * 60 * 1000,              // 30 minutes
} as const;

export const RAMADAN_CACHE_KEYS = {
  SCHEDULE: 'ramadan-schedule',
  DETECTION: 'ramadan-detection',
  DAILY_TIMES: 'ramadan-daily-times',
} as const;

// ============================================================================
// DEFAULT NOTIFICATION PREFERENCES
// ============================================================================

export const DEFAULT_RAMADAN_NOTIFICATION_PREFS: RamadanNotificationPrefs = {
  suhoorReminderEnabled: true,
  suhoorReminderMinutes: 45,
  iftarAlertEnabled: true,
  tarawihReminderEnabled: true,
  lastTenNightsEnabled: true,
  laylatulQadrEmphasis: true,
};

// ============================================================================
// SUHOOR REMINDER OPTIONS
// ============================================================================

export const SUHOOR_REMINDER_OPTIONS = [30, 45, 60] as const;

// ============================================================================
// QURAN KHATAM
// ============================================================================

export const TOTAL_JUZ = 30;
export const PAGES_PER_JUZ = 20;

// ============================================================================
// DAILY RAMADAN DUAS & HADITHS (30 days)
// ============================================================================

export const RAMADAN_DAILY_CONTENT: RamadanDailyContent[] = [
  {
    day: 1,
    duaArabic: 'اللَّهُمَّ اجْعَلْ صِيَامِي فِيهِ صِيَامَ الصَّائِمِينَ',
    duaTransliteration: "Allahumma-j'al siyami fihi siyamas-sa'imin",
    duaTranslation: 'O Allah, make my fasting in it the fasting of those who truly fast.',
    hadith: 'When Ramadan begins, the gates of Paradise are opened and the gates of Hell are closed, and the devils are chained.',
    hadithSource: 'Sahih al-Bukhari 1899',
  },
  {
    day: 2,
    duaArabic: 'اللَّهُمَّ قَرِّبْنِي فِيهِ إِلَى مَرْضَاتِكَ',
    duaTransliteration: 'Allahumma qarribni fihi ila mardatik',
    duaTranslation: 'O Allah, bring me closer in it to Your pleasure.',
    hadith: 'Whoever fasts during Ramadan out of sincere faith and hoping to attain Allah\'s rewards, then all his past sins will be forgiven.',
    hadithSource: 'Sahih al-Bukhari 38',
  },
  {
    day: 3,
    duaArabic: 'اللَّهُمَّ ارْزُقْنِي فِيهِ الذِّهْنَ وَالتَّنْبِيهَ',
    duaTransliteration: 'Allahumma-rzuqni fihidh-dhihna wat-tanbih',
    duaTranslation: 'O Allah, grant me in it awareness and alertness.',
    hadith: 'The one who gives food for a fasting person to break his fast, he will have a reward like theirs, without that detracting from their reward in the slightest.',
    hadithSource: 'Jami at-Tirmidhi 807',
  },
  {
    day: 4,
    duaArabic: 'اللَّهُمَّ قَوِّنِي فِيهِ عَلَى إِقَامَةِ أَمْرِكَ',
    duaTransliteration: "Allahumma qawwini fihi 'ala iqamati amrik",
    duaTranslation: 'O Allah, strengthen me in it to establish Your commands.',
    hadith: 'Allah said: Every deed of the son of Adam is for him except fasting; it is for Me and I shall reward for it.',
    hadithSource: 'Sahih al-Bukhari 1904',
  },
  {
    day: 5,
    duaArabic: 'اللَّهُمَّ اجْعَلْنِي فِيهِ مِنَ الْمُسْتَغْفِرِينَ',
    duaTransliteration: "Allahumma-j'alni fihil minal mustaghfirin",
    duaTranslation: 'O Allah, make me in it among those who seek forgiveness.',
    hadith: 'Whoever stands in prayer during Ramadan out of faith and hoping for reward, his previous sins will be forgiven.',
    hadithSource: 'Sahih al-Bukhari 37',
  },
  {
    day: 6,
    duaArabic: 'اللَّهُمَّ لَا تَخْذُلْنِي فِيهِ لِتَعَرُّضِ مَعْصِيَتِكَ',
    duaTransliteration: "Allahumma la takhdhulni fihi lita'arrudi ma'siyatik",
    duaTranslation: 'O Allah, do not forsake me in it for committing disobedience against You.',
    hadith: 'Fasting is a shield; so when one of you is fasting he should neither indulge in obscene language nor should he raise his voice.',
    hadithSource: 'Sahih al-Bukhari 1894',
  },
  {
    day: 7,
    duaArabic: 'اللَّهُمَّ أَعِنِّي فِيهِ عَلَى صِيَامِهِ وَقِيَامِهِ',
    duaTransliteration: "Allahumma a'inni fihi 'ala siyamihi wa qiyamih",
    duaTranslation: 'O Allah, help me in it to observe its fasting and night prayers.',
    hadith: 'There is a gate in Paradise called Ar-Rayyan, through which those who fast will enter, and no one will enter through it except them.',
    hadithSource: 'Sahih al-Bukhari 1896',
  },
  {
    day: 8,
    duaArabic: 'اللَّهُمَّ ارْزُقْنِي فِيهِ رَحْمَةَ الْأَيْتَامِ',
    duaTransliteration: 'Allahumma-rzuqni fihi rahmatal aytam',
    duaTranslation: 'O Allah, grant me in it mercy towards the orphans.',
    hadith: 'The best charity is that given in Ramadan.',
    hadithSource: 'Jami at-Tirmidhi 663',
  },
  {
    day: 9,
    duaArabic: 'اللَّهُمَّ اجْعَلْ لِي فِيهِ نَصِيبًا مِنْ رَحْمَتِكَ الْوَاسِعَةِ',
    duaTransliteration: "Allahumma-j'al li fihi nasiban min rahmatik al-wasi'ah",
    duaTranslation: "O Allah, grant me in it a share of Your vast mercy.",
    hadith: 'When the month of Ramadan starts, the gates of heaven are opened.',
    hadithSource: 'Sahih al-Bukhari 1898',
  },
  {
    day: 10,
    duaArabic: 'اللَّهُمَّ اجْعَلْنِي فِيهِ مِنَ الْمُتَوَكِّلِينَ عَلَيْكَ',
    duaTransliteration: "Allahumma-j'alni fihil minal mutawakkilina 'alayk",
    duaTranslation: 'O Allah, make me in it among those who rely upon You.',
    hadith: 'He who does not give up false speech and acting upon it, Allah has no need of his giving up food and drink.',
    hadithSource: 'Sahih al-Bukhari 1903',
  },
  {
    day: 11,
    duaArabic: 'اللَّهُمَّ حَبِّبْ إِلَيَّ فِيهِ الْإِحْسَانَ',
    duaTransliteration: 'Allahumma habbib ilayya fihil ihsan',
    duaTranslation: 'O Allah, make me love doing good in it.',
    hadith: 'Whoever does not abandon false speech and false conduct, Allah has no need of his abandoning food and drink.',
    hadithSource: 'Sahih al-Bukhari 6057',
  },
  {
    day: 12,
    duaArabic: 'اللَّهُمَّ زَيِّنِّي فِيهِ بِالسِّتْرِ وَالْعَفَافِ',
    duaTransliteration: 'Allahumma zayyinni fihi bis-sitri wal-afaf',
    duaTranslation: 'O Allah, adorn me in it with modesty and chastity.',
    hadith: 'Ramadan has come to you. It is a month of blessing in which Allah covers you with blessings.',
    hadithSource: 'Sunan an-Nasa\'i 2106',
  },
  {
    day: 13,
    duaArabic: 'اللَّهُمَّ طَهِّرْنِي فِيهِ مِنَ الدَّنَسِ وَالْأَقْذَارِ',
    duaTransliteration: 'Allahumma tahhirni fihil minad-danasi wal-aqdhar',
    duaTranslation: 'O Allah, purify me in it from uncleanliness and impurities.',
    hadith: 'If one of you is invited to eat while he is fasting, let him say: I am fasting.',
    hadithSource: 'Sahih Muslim 1150',
  },
  {
    day: 14,
    duaArabic: 'اللَّهُمَّ لَا تُؤَاخِذْنِي فِيهِ بِالْعَثَرَاتِ',
    duaTransliteration: "Allahumma la tu'akhidhni fihil bil-'atharat",
    duaTranslation: 'O Allah, do not hold me accountable in it for my stumbles.',
    hadith: 'There are two pleasures for the fasting person, one at the time of breaking his fast, and the other at the time when he will meet his Lord.',
    hadithSource: 'Sahih al-Bukhari 1904',
  },
  {
    day: 15,
    duaArabic: 'اللَّهُمَّ ارْزُقْنِي فِيهِ طَاعَةَ الْخَاشِعِينَ',
    duaTransliteration: "Allahumma-rzuqni fihi ta'atal khashi'in",
    duaTranslation: 'O Allah, grant me in it the obedience of the humble.',
    hadith: 'Look at those who are beneath you and do not look at those who are above you, for it is more suitable so that you do not belittle the favors of Allah.',
    hadithSource: 'Sahih Muslim 2963',
  },
  {
    day: 16,
    duaArabic: 'اللَّهُمَّ وَفِّقْنِي فِيهِ لِمُوَافَقَةِ الْأَبْرَارِ',
    duaTransliteration: 'Allahumma waffiqni fihi limuwafaqatil abrar',
    duaTranslation: 'O Allah, grant me in it the company of the righteous.',
    hadith: 'Whoever prays during the nights of Ramadan with faith and hoping for reward, his previous sins will be forgiven.',
    hadithSource: 'Sahih al-Bukhari 2009',
  },
  {
    day: 17,
    duaArabic: 'اللَّهُمَّ اهْدِنِي فِيهِ لِصَالِحِ الْأَعْمَالِ',
    duaTransliteration: 'Allahumma-hdini fihi lisalihil a\'mal',
    duaTranslation: 'O Allah, guide me in it to righteous deeds.',
    hadith: 'The Quran was revealed in Ramadan.',
    hadithSource: 'Quran 2:185',
  },
  {
    day: 18,
    duaArabic: 'اللَّهُمَّ نَبِّهْنِي فِيهِ لِبَرَكَاتِ أَسْحَارِهِ',
    duaTransliteration: 'Allahumma nabbihni fihi libarakati asharih',
    duaTranslation: 'O Allah, awaken me in it to the blessings of its pre-dawn hours.',
    hadith: 'Take suhoor, for indeed in suhoor there is blessing.',
    hadithSource: 'Sahih al-Bukhari 1923',
  },
  {
    day: 19,
    duaArabic: 'اللَّهُمَّ وَفِّرْ حَظِّي فِيهِ مِنْ بَرَكَاتِهِ',
    duaTransliteration: 'Allahumma waffir hazzi fihi min barakatih',
    duaTranslation: 'O Allah, increase my share in it of its blessings.',
    hadith: 'Delay the suhoor and hasten the iftar.',
    hadithSource: 'Sahih al-Bukhari 1957',
  },
  {
    day: 20,
    duaArabic: 'اللَّهُمَّ افْتَحْ لِي فِيهِ أَبْوَابَ الْجِنَانِ',
    duaTransliteration: 'Allahumma-ftah li fihi abwabal jinan',
    duaTranslation: 'O Allah, open for me in it the gates of Paradise.',
    hadith: 'When the last ten days of Ramadan came, the Prophet would tighten his waist-wrapper, stay up at night, and wake his family.',
    hadithSource: 'Sahih al-Bukhari 2024',
  },
  {
    day: 21,
    duaArabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',
    duaTransliteration: "Allahumma innaka 'afuwwun tuhibbul 'afwa fa'fu 'anni",
    duaTranslation: 'O Allah, You are the Most Forgiving, and You love forgiveness, so forgive me.',
    hadith: 'Seek Laylatul Qadr in the odd nights of the last ten nights of Ramadan.',
    hadithSource: 'Sahih al-Bukhari 2017',
  },
  {
    day: 22,
    duaArabic: 'اللَّهُمَّ اغْفِرْ لِي ذُنُوبِي يَا رَبَّ الْعَالَمِينَ',
    duaTransliteration: 'Allahumma-ghfir li dhunubi ya rabbal alamin',
    duaTranslation: 'O Allah, forgive my sins, O Lord of the worlds.',
    hadith: 'Whoever stands in prayer on Laylatul Qadr out of faith and hoping for reward, his previous sins will be forgiven.',
    hadithSource: 'Sahih al-Bukhari 1901',
  },
  {
    day: 23,
    duaArabic: 'اللَّهُمَّ اغْسِلْنِي فِيهِ مِنَ الذُّنُوبِ',
    duaTransliteration: 'Allahumma-ghsilni fihil minadh-dhunub',
    duaTranslation: 'O Allah, wash me in it from sins.',
    hadith: 'Laylatul Qadr is better than a thousand months.',
    hadithSource: 'Quran 97:3',
  },
  {
    day: 24,
    duaArabic: 'اللَّهُمَّ إِنِّي أَسْأَلُكَ فِيهِ مَا يُرْضِيكَ',
    duaTransliteration: "Allahumma inni as'aluka fihi ma yurdik",
    duaTranslation: 'O Allah, I ask You in it for what pleases You.',
    hadith: 'The Prophet was the most generous of people, and he was most generous during Ramadan.',
    hadithSource: 'Sahih al-Bukhari 1902',
  },
  {
    day: 25,
    duaArabic: 'اللَّهُمَّ اجْعَلْنِي فِيهِ مُحِبًّا لِأَوْلِيَائِكَ',
    duaTransliteration: "Allahumma-j'alni fihi muhibban li-awliya'ik",
    duaTranslation: 'O Allah, make me in it a lover of Your friends.',
    hadith: 'Indeed the angels send blessings on those taking the suhoor.',
    hadithSource: 'Sahih Ibn Hibban 3467',
  },
  {
    day: 26,
    duaArabic: 'اللَّهُمَّ اجْعَلْ سَعْيِي فِيهِ مَشْكُورًا',
    duaTransliteration: "Allahumma-j'al sa'yi fihi mashkura",
    duaTranslation: 'O Allah, make my effort in it appreciated.',
    hadith: 'Do not fast a day or two before Ramadan. Fast when you see the crescent moon and stop fasting when you see it.',
    hadithSource: 'Sahih al-Bukhari 1914',
  },
  {
    day: 27,
    duaArabic: 'اللَّهُمَّ ارْزُقْنِي فِيهِ فَضْلَ لَيْلَةِ الْقَدْرِ',
    duaTransliteration: 'Allahumma-rzuqni fihi fadla laylat al-qadr',
    duaTranslation: 'O Allah, grant me in it the virtue of Laylatul Qadr.',
    hadith: 'Therein descend the angels and the Spirit by permission of their Lord for every matter.',
    hadithSource: 'Quran 97:4',
  },
  {
    day: 28,
    duaArabic: 'اللَّهُمَّ وَفِّرْ حَظِّي فِيهِ مِنَ النَّوَافِلِ',
    duaTransliteration: 'Allahumma waffir hazzi fihil minan-nawafil',
    duaTranslation: 'O Allah, increase my share in it of voluntary acts of worship.',
    hadith: 'Whoever fasts Ramadan and then follows it with six days of Shawwal, it is as if he fasted the entire year.',
    hadithSource: 'Sahih Muslim 1164',
  },
  {
    day: 29,
    duaArabic: 'اللَّهُمَّ غَشِّنِي فِيهِ بِالرَّحْمَةِ',
    duaTransliteration: 'Allahumma ghashshini fihil bir-rahmah',
    duaTranslation: 'O Allah, cover me in it with mercy.',
    hadith: 'The supplications of three persons are never turned away: a just ruler, a fasting person until they break their fast, and the prayer of the oppressed.',
    hadithSource: 'Jami at-Tirmidhi 3598',
  },
  {
    day: 30,
    duaArabic: 'اللَّهُمَّ اجْعَلْ صِيَامِي فِيهِ بِالشُّكْرِ وَالْقَبُولِ',
    duaTransliteration: "Allahumma-j'al siyami fihi bish-shukri wal-qabul",
    duaTranslation: 'O Allah, make my fasting in it accepted with gratitude and acceptance.',
    hadith: 'When you see the new moon of Shawwal, stop fasting. And if it is cloudy, complete thirty days of Ramadan.',
    hadithSource: 'Sahih al-Bukhari 1907',
  },
];

// ============================================================================
// IFTAR DUA
// ============================================================================

export const IFTAR_DUA = {
  arabic: 'ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ',
  transliteration: "Dhahaba-dh-dhama'u wa-btallatil-'uruqu wa thabatal-ajru in sha'Allah",
  translation: 'The thirst has gone, the veins are quenched, and the reward is confirmed, if Allah wills.',
  source: 'Sunan Abu Dawud 2357',
} as const;

// ============================================================================
// SUHOOR DUA
// ============================================================================

export const SUHOOR_DUA = {
  arabic: 'وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ',
  transliteration: "Wa bisawmi ghadin nawaitu min shahri Ramadan",
  translation: 'I intend to fast tomorrow in the month of Ramadan.',
  source: 'Common practice',
} as const;

// ============================================================================
// ERROR MESSAGES
// ============================================================================

export const RAMADAN_ERROR_MESSAGES = {
  SCHEDULE_FETCH_FAILED: 'Unable to fetch Ramadan schedule. Please try again.',
  DETECTION_FAILED: 'Unable to detect Ramadan dates. Please try again.',
  LOG_SAVE_FAILED: 'Unable to save your log. Please try again.',
  NOT_RAMADAN: 'Ramadan has not started yet.',
} as const;
