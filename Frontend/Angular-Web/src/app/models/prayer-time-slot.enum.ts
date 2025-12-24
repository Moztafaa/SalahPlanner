/**
 * Prayer time slots enum matching backend PrayerTimeSlot
 */
export enum PrayerTimeSlot {
  BeforeFajr = 0,
  FajrToShurooq = 1,
  ShurooqToDhuhr = 2,
  DhuhrToAsr = 3,
  AsrToMaghrib = 4,
  MaghribToIsha = 5,
  AfterIsha = 6,
}

/**
 * Helper to get display name for Salah time slots
 */
export const PrayerTimeSlotDisplay: Record<PrayerTimeSlot, string> = {
  [PrayerTimeSlot.BeforeFajr]: 'Before Fajr Salah',
  [PrayerTimeSlot.FajrToShurooq]: 'Fajr → Shurooq',
  [PrayerTimeSlot.ShurooqToDhuhr]: 'Shurooq → Dhuhr',
  [PrayerTimeSlot.DhuhrToAsr]: 'Dhuhr → Asr',
  [PrayerTimeSlot.AsrToMaghrib]: 'Asr → Maghrib',
  [PrayerTimeSlot.MaghribToIsha]: 'Maghrib → Isha',
  [PrayerTimeSlot.AfterIsha]: 'After Isha Salah',
};
