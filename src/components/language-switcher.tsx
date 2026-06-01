"use client";

import { Globe2 } from "lucide-react";
import { useState } from "react";
import { localeMeta, locales, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/provider";

export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);
  const active = localeMeta[locale];
  const isBetaLocale = (item: Locale) => item !== "zh-CN" && item !== "en";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/15 bg-white/[0.08] px-3 text-xs font-black text-white md:bg-white/10"
        aria-expanded={open}
        aria-label={t("common.language")}
      >
        <Globe2 className="h-4 w-4" />
        <span className={compact ? "hidden sm:inline" : ""}>{active.nativeName}</span>
      </button>

      {open ? (
        <div className="absolute right-0 top-11 z-50 w-64 overflow-hidden rounded-2xl border border-line bg-white p-2 text-slate-900 shadow-strong">
          <div className="px-3 py-2 text-xs font-black text-slate-500">{t("common.language")}</div>
          {locales.map((item) => {
            const meta = localeMeta[item];
            return (
              <button
                type="button"
                key={item}
                onClick={() => {
                  setLocale(item as Locale);
                  setOpen(false);
                }}
                className={
                  item === locale
                    ? "flex w-full items-center justify-between rounded-xl bg-yellow-50 px-3 py-2.5 text-left text-sm font-black text-yellow-800"
                    : "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm font-black text-slate-700 hover:bg-slate-50"
                }
              >
                <span>
                  <span className="mr-2 text-xs text-slate-400">{meta.flag}</span>
                  {meta.nativeName}
                  {isBetaLocale(item) ? (
                    <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-black text-slate-500">
                      Beta
                    </span>
                  ) : null}
                </span>
                <span className="text-xs text-slate-400">{meta.label}</span>
              </button>
            );
          })}
          <div className="mt-2 rounded-xl bg-slate-50 px-3 py-2 text-xs font-semibold leading-5 text-slate-500">
            {t("meta.localeNotice")}
          </div>
        </div>
      ) : null}
    </div>
  );
}
