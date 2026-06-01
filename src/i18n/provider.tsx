"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { defaultLocale, type Locale } from "./config";
import { messages, type Messages } from "./messages";

type Primitive = string | number;

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, params?: Record<string, Primitive>) => string;
  tArray: (path: string) => string[];
};

const I18nContext = createContext<I18nContextValue | null>(null);

function lookup(dictionary: Messages, path: string): unknown {
  return path.split(".").reduce<unknown>((value, key) => {
    if (value && typeof value === "object" && key in value) {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, dictionary);
}

function interpolate(value: string, params?: Record<string, Primitive>) {
  if (!params) return value;
  return Object.entries(params).reduce((text, [key, replacement]) => {
    return text.replaceAll(`{${key}}`, String(replacement));
  }, value);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const savedLocale = window.localStorage.getItem("uzc_locale") as Locale | null;
    if (savedLocale && messages[savedLocale]) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLocaleState(savedLocale);
      document.documentElement.lang = savedLocale;
    }
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const activeMessages = messages[locale] ?? messages[defaultLocale];

    return {
      locale,
      setLocale(nextLocale) {
        setLocaleState(nextLocale);
        if (typeof window !== "undefined") {
          window.localStorage.setItem("uzc_locale", nextLocale);
          document.documentElement.lang = nextLocale;
        }
      },
      t(path, params) {
        const result = lookup(activeMessages, path) ?? lookup(messages[defaultLocale], path) ?? path;
        return typeof result === "string" ? interpolate(result, params) : path;
      },
      tArray(path) {
        const result = lookup(activeMessages, path) ?? lookup(messages[defaultLocale], path);
        return Array.isArray(result) ? result.map(String) : [];
      }
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const value = useContext(I18nContext);
  if (!value) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return value;
}
