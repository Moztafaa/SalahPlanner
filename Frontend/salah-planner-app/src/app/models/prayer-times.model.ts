/**
 * Prayer times data model matching PrayerTimesDto from backend
 */
export interface PrayerTimes {
  date: Date | null;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}
