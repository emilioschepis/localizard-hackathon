import en from "~/locales/en.json";
import it from "~/locales/it.json";

export default {
  supportedLngs: ["en", "it"],
  fallbackLng: "en",
  interpolation: {
    escapeValue: false, // not needed for react as it escapes by default
  },
  resources: {
    en: {
      translation: en.project.translations,
    },
    it: {
      translation: it.project.translations,
    },
  },
  react: {
    useSuspense: false,
  },
};
