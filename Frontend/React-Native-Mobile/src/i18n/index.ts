import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import * as SecureStore from "expo-secure-store";
import { I18nManager } from "react-native";
import "intl-pluralrules";

import en from "./locales/en.json";
import ar from "./locales/ar.json";

const LANGUAGE_KEY = "user-language";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
};

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lang: string) => void) => {
    try {
      const storedLanguage = await SecureStore.getItemAsync(LANGUAGE_KEY);
      if (storedLanguage) {
        return callback(storedLanguage);
      }
    } catch (error) {
      console.error("Error reading language from storage", error);
    }

    const locales = Localization.getLocales();
    const bestLanguage = locales[0]?.languageCode ?? "en";
    callback(bestLanguage);
  },
  init: () => {},
  cacheUserLanguage: async (language: string) => {
    try {
      await SecureStore.setItemAsync(LANGUAGE_KEY, language);
    } catch (error) {
      console.error("Error saving language to storage", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
