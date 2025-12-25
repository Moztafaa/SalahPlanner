// ============================================
// Prayer Time Slot Enum
// ============================================
export enum PrayerTimeSlot {
  BeforeFajr = 0,
  FajrToShurooq = 1,
  ShurooqToDhuhr = 2,
  DhuhrToAsr = 3,
  AsrToMaghrib = 4,
  MaghribToIsha = 5,
  AfterIsha = 6,
}

export const PrayerTimeSlotLabels: Record<PrayerTimeSlot, string> = {
  [PrayerTimeSlot.BeforeFajr]: "Before Fajr Salah",
  [PrayerTimeSlot.FajrToShurooq]: "Fajr → Shurooq",
  [PrayerTimeSlot.ShurooqToDhuhr]: "Shurooq → Dhuhr",
  [PrayerTimeSlot.DhuhrToAsr]: "Dhuhr → Asr",
  [PrayerTimeSlot.AsrToMaghrib]: "Asr → Maghrib",
  [PrayerTimeSlot.MaghribToIsha]: "Maghrib → Isha",
  [PrayerTimeSlot.AfterIsha]: "After Isha Salah",
};

// ============================================
// Task DTOs
// ============================================
export interface Task {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  taskDate?: Date;
  isCompleted: boolean;
  slot: PrayerTimeSlot;
  applicationUserId?: string;
}

export interface CreateTaskDto {
  title: string;
  description?: string;
  slot: PrayerTimeSlot;
  taskDate?: Date;
}

export interface UpdateTaskDto {
  title?: string;
  description?: string;
  slot?: PrayerTimeSlot;
  isCompleted?: boolean;
  taskDate?: Date | null;
}

export interface UpdateTaskSlotDto {
  taskIds: string[];
  newSlot: PrayerTimeSlot;
}

// ============================================
// Account/Auth DTOs
// ============================================
export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponseDto {
  userId: string;
  userName: string;
  email: string;
  fullName: string;
  token: string;
  expiration: Date;
  message: string;
}

export interface RegisterDto {
  fullName: string;
  userName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface RegisterResponseDto {
  userId: string;
  userName: string;
  email: string;
  message: string;
}

export interface UserSettingsDto {
  defaultCity: string;
  defaultCountry: string;
  isAutoLocation?: boolean;
  calculationMethod: number;
  timeFormat?: "12h" | "24h";
}

// ============================================
// Prayer Time DTOs
// ============================================
export interface PrayerTimesDto {
  date?: Date;
  fajr: string;
  sunrise: string;
  dhuhr: string;
  asr: string;
  maghrib: string;
  isha: string;
}

// ============================================
// Calculation Methods
// ============================================
export enum CalculationMethod {
  ShiaIthnaAshari = 0,
  UniversityOfIslamicSciencesKarachi = 1,
  IslamicSocietyOfNorthAmerica = 2,
  MuslimWorldLeague = 3,
  UmmAlQuraUniversityMakkah = 4,
  EgyptianGeneralAuthorityOfSurvey = 5,
  GulfRegion = 8,
  Kuwait = 9,
  Qatar = 10,
  JAKIM = 17,
}

export const CalculationMethodLabels: Record<CalculationMethod, string> = {
  [CalculationMethod.ShiaIthnaAshari]: "Shia Ithna-Ashari",
  [CalculationMethod.UniversityOfIslamicSciencesKarachi]:
    "University of Islamic Sciences, Karachi",
  [CalculationMethod.IslamicSocietyOfNorthAmerica]:
    "ISNA (Islamic Society of North America)",
  [CalculationMethod.MuslimWorldLeague]: "Muslim World League",
  [CalculationMethod.UmmAlQuraUniversityMakkah]:
    "Umm Al-Qura University, Makkah",
  [CalculationMethod.EgyptianGeneralAuthorityOfSurvey]:
    "Egyptian General Authority of Survey",
  [CalculationMethod.GulfRegion]: "Gulf Region",
  [CalculationMethod.Kuwait]: "Kuwait",
  [CalculationMethod.Qatar]: "Qatar",
  [CalculationMethod.JAKIM]: "JAKIM (Malaysia)",
};

// ============================================
// API Error Response
// ============================================
export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
}
