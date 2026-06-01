"use client";

import Link from "next/link";
import { ArrowRight, Building2, FileCheck2, Globe2, Handshake, LockKeyhole, Search, ShieldCheck, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import type { ResourceRecord } from "@/lib/domain";
import { ResourceCard } from "@/components/resource-card";

const categoryIcons = [FileCheck2, Truck, Globe2, Building2, ShieldCheck, Handshake, FileCheck2, ShieldCheck];

export default function HomePage() {
  const { t, tArray } = useI18n();
  const [visibleResources, setVisibleResources] = useState<ResourceRecord[]>([]);
  const categories = tArray("mock.categories");
  const trust = tArray("home.trust");

  useEffect(() => {
    void fetch("/api/resources")
      .then((response) => response.json() as Promise<ResourceRecord[]>)
      .then((resources) => setVisibleResources(resources.slice(0, 4)));
  }, []);

  return (
    <div className="mobile-screen">
      <section className="relative overflow-hidden bg-navy px-4 py-7 text-white sm:px-6 lg:rounded-b-[28px] lg:px-8 lg:py-14">
        <div className="absolute inset-y-0 right-0 hidden w-1/2 opacity-70 lg:block">
          <div className="absolute right-10 top-12 h-72 w-[520px] rounded-[48%] border border-white/15" />
          <div className="absolute right-32 top-24 h-48 w-[340px] rounded-[48%] border border-gold/40" />
          {["Uzbekistan", "Kazakhstan", "Kyrgyzstan", "Tajikistan", "Turkmenistan"].map((item, index) => (
            <span
              key={item}
              className="absolute rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-black"
              style={{
                right: [260, 84, 165, 305, 390][index],
                top: [150, 88, 220, 260, 205][index]
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <div className="relative z-10 w-full max-w-[358px] sm:max-w-2xl">
          <span className="inline-flex rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1.5 text-xs font-black text-yellow-700">
            {t("home.badge")}
          </span>
          <h1 className="mt-5 text-3xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            {t("home.titleA")}
            <span className="block text-gold">{t("home.titleB")}</span>
          </h1>
          <p className="mt-4 w-full max-w-full break-all text-sm font-semibold leading-7 text-white/80 sm:max-w-xl sm:break-words sm:text-lg">
            {t("home.subtitle")}
          </p>
          <div className="mt-6 flex h-[52px] w-full max-w-full overflow-hidden rounded-2xl bg-white shadow-strong sm:h-14">
            <input className="min-w-0 flex-1 px-4 text-sm text-slate-800 outline-none" placeholder={t("home.searchPlaceholder")} />
            <Link href="/resources" className="flex w-14 shrink-0 items-center justify-center bg-navy-700 text-white">
              <Search className="h-5 w-5" />
            </Link>
          </div>
          <div className="mt-5 grid w-full max-w-full gap-3 sm:flex">
            <Link href="/submit-resource" className="btn-primary">
              {t("home.postResource")}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/resources" className="btn-outline border-white/30 bg-white/[0.08] text-white hover:bg-white/[0.12]">
              {t("home.findResource")}
            </Link>
            <Link href="/license-cooperation" className="btn-outline border-white/30 bg-white/[0.08] text-white hover:bg-white/[0.12]">
              {t("home.licenseChannel")}
            </Link>
          </div>
          <div className="mt-6 grid w-full max-w-full grid-cols-2 gap-2 sm:grid-cols-4">
            {trust.map((item) => (
              <div key={item} className="rounded-2xl border border-white/15 bg-white/[0.08] p-3 text-xs font-bold text-white/80">
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-4 -mt-4 grid gap-3 rounded-3xl border border-line bg-white p-4 shadow-soft sm:mx-6 sm:grid-cols-4 lg:mx-8">
        {[
          ["common.manualReview", ShieldCheck],
          ["common.contactManaged", LockKeyhole],
          ["home.licenseChannel", FileCheck2],
          ["common.language", Globe2]
        ].map(([key, Icon]) => {
          const TypedIcon = Icon as typeof ShieldCheck;
          return (
            <div key={key as string} className="flex items-center gap-3 border-slate-100 sm:border-r sm:last:border-r-0">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 text-navy-700">
                <TypedIcon className="h-5 w-5" />
              </span>
              <div>
                <b className="block text-sm">{t(key as string)}</b>
                <small className="text-xs text-slate-500">{t("resources.onlyApproved")}</small>
              </div>
            </div>
          );
        })}
      </section>

      <section className="page-pad">
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="section-title">{t("home.featuredTitle")}</h2>
            <p className="section-subtitle">{t("home.featuredSubtitle")}</p>
          </div>
          <Link href="/resources" className="hidden text-sm font-black text-navy-700 sm:inline-flex">
            {t("common.viewAll")}
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {visibleResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
          ))}
        </div>
      </section>

      <section className="page-pad pt-0">
        <h2 className="section-title">{t("home.categoriesTitle")}</h2>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {categories.map((category, index) => {
            const Icon = categoryIcons[index] ?? FileCheck2;
            return (
              <Link href="/resources" key={category} className="panel flex items-center gap-3 p-4 transition hover:shadow-strong">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-50 text-navy-700">
                  <Icon className="h-5 w-5" />
                </span>
                <span className="text-sm font-black">{category}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="page-pad pt-0">
        <div className="grid gap-5 lg:grid-cols-[1fr_360px]">
          <div className="overflow-hidden rounded-3xl bg-navy p-6 text-white shadow-strong lg:p-8">
            <h2 className="text-2xl font-black">{t("home.licenseTitle")}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/70">{t("home.licenseSubtitle")}</p>
            <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {["agency", "distribution", "equity", "compliance"].map((key) => (
                <div key={key} className="rounded-2xl border border-white/15 bg-white/[0.08] p-4">
                  <FileCheck2 className="mb-3 h-5 w-5 text-gold" />
                  <b className="text-sm">{t(`mock.license.${key}`)}</b>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <h3 className="text-xl font-black">{t("home.ctaTitle")}</h3>
            <p className="mt-3 text-sm leading-7 text-slate-500">{t("home.ctaText")}</p>
            <div className="mt-5 grid gap-3">
              <Link href="/submit-resource" className="btn-primary w-full">
                {t("home.postResource")}
              </Link>
              <Link href="/submit-demand" className="btn-outline w-full">
                {t("forms.demandTitle")}
              </Link>
            </div>
            <p className="mt-4 rounded-2xl bg-slate-50 p-3 text-xs font-semibold leading-5 text-slate-500">{t("home.reviewTime")}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
