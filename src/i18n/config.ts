export const locales = ["zh-CN", "uz", "kk", "ky", "tg", "tk", "ru", "en"] as const;

export type Locale = (typeof locales)[number];

export const localeMeta: Record<Locale, { label: string; nativeName: string; flag: string }> = {
  "zh-CN": { label: "Chinese", nativeName: "中文", flag: "CN" },
  uz: { label: "Uzbek", nativeName: "O'zbekcha", flag: "UZ" },
  kk: { label: "Kazakh", nativeName: "Қазақша", flag: "KZ" },
  ky: { label: "Kyrgyz", nativeName: "Кыргызча", flag: "KG" },
  tg: { label: "Tajik", nativeName: "Тоҷикӣ", flag: "TJ" },
  tk: { label: "Turkmen", nativeName: "Türkmençe", flag: "TM" },
  ru: { label: "Russian", nativeName: "Русский", flag: "RU" },
  en: { label: "English", nativeName: "English", flag: "EN" }
};

export const defaultLocale: Locale = "zh-CN";
