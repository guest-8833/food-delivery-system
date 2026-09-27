import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import en from "./locales/en.json";
import am from "./locales/am.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "am"],
    interpolation: {
      escapeValue: false, // React already escapes values
    },
    detection: {
      // Remember the user's choice across visits
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "preferredLanguage",
    },
  });

export default i18n;