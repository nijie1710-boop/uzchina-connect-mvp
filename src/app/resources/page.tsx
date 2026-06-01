"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import type { ResourceRecord } from "@/lib/domain";
import { ResourceListItem } from "@/components/resource-card";

export default function ResourcesPage() {
  const { t, tArray } = useI18n();
  const [search, setSearch] = useState("");
  const [visibleResources, setVisibleResources] = useState<ResourceRecord[]>([]);
  const categories = tArray("mock.categories").slice(0, 5);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const params = new URLSearchParams();
      if (search.trim()) params.set("search", search.trim());
      void fetch(`/api/resources?${params.toString()}`)
        .then((response) => response.json() as Promise<ResourceRecord[]>)
        .then(setVisibleResources);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [search]);

  return (
    <div className="mobile-screen">
      <div className="border-b border-line bg-white px-4 py-5 sm:px-6 lg:px-8">
        <h1 className="section-title">{t("resources.title")}</h1>
        <p className="section-subtitle">{t("resources.subtitle")}</p>
      </div>
      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8 lg:py-8">
        <aside className="panel hidden h-fit p-5 lg:block">
          <div className="flex items-center justify-between">
            <h2 className="font-black">{t("resources.filters")}</h2>
            <button className="text-xs font-black text-navy-700">{t("common.resetDemo")}</button>
          </div>
          {[
            [t("resources.type"), [t("resources.all"), t("resources.supplier"), t("resources.buyer"), t("resources.license")]],
            [t("resources.country"), ["Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan"]],
            [t("resources.category"), categories],
            [t("resources.verification"), [t("common.verified"), t("common.reviewed"), t("common.recommended")]]
          ].map(([title, items]) => (
            <div key={title as string} className="mt-5 border-t border-slate-100 pt-5">
              <b className="text-sm">{title as string}</b>
              <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-500">
                {(items as string[]).map((item) => (
                  <label key={item} className="flex items-center gap-2">
                    <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-navy-700" />
                    {item}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </aside>

        <section>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <label className="flex h-14 items-center overflow-hidden rounded-2xl border border-line bg-white shadow-soft">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="min-w-0 flex-1 px-4 text-sm outline-none"
                placeholder={t("resources.searchPlaceholder")}
              />
              <button className="flex h-full w-14 items-center justify-center bg-navy-700 text-white">
                <Search className="h-5 w-5" />
              </button>
            </label>
            <button className="btn-outline h-14">
              <SlidersHorizontal className="h-4 w-4" />
              {t("resources.sort")}
            </button>
          </div>
          <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
            {[t("resources.all"), ...categories.slice(0, 3), t("common.recommended")].map((chip, index) => (
              <button
                key={chip}
                className={index === 0 ? "rounded-full bg-navy-700 px-4 py-2 text-xs font-black text-white" : "rounded-full border border-line bg-white px-4 py-2 text-xs font-black text-slate-600"}
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between text-sm text-slate-500">
            <span>
              {t("resources.foundPrefix")} <b className="text-slate-950">{visibleResources.length}</b> {t("resources.foundSuffix")}
            </span>
            <span className="hidden sm:inline">{t("resources.onlyApproved")}</span>
          </div>
          <div className="mt-4 grid gap-4">
            {visibleResources.length ? (
              visibleResources.map((resource) => <ResourceListItem key={resource.id} resource={resource} />)
            ) : (
              <div className="panel p-8 text-center text-sm font-semibold text-slate-500">{t("resources.empty")}</div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
