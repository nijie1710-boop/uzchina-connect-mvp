"use client";

import Link from "next/link";
import { Eye, LockKeyhole, MapPin, MessageCircle } from "lucide-react";
import { useI18n } from "@/i18n/provider";
import type { ResourceRecord } from "@/lib/domain";
import { localizedCategory, resourceDescription, resourceLocation, resourceTitle } from "@/lib/domain";
import { StatusBadge } from "./status-badge";

export function ResourceCard({ resource }: { resource: ResourceRecord }) {
  const { t } = useI18n();

  return (
    <Link href={`/resources/${resource.id}`} className="group panel block overflow-hidden transition hover:-translate-y-1 hover:shadow-strong">
      <div className="relative h-28 p-3" style={{ background: resource.gradient }}>
        <StatusBadge status={resource.status} t={t} className="bg-white/90" />
        <div className="absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-slate-950/40 to-transparent" />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {resourceLocation(resource, t)}
        </div>
        <h3 className="mt-2 min-h-12 text-base font-black leading-snug text-slate-950 group-hover:text-navy-700">
          {resourceTitle(resource, t)}
        </h3>
        <p className="mt-2 line-clamp-2 min-h-10 text-xs leading-5 text-slate-500">{resourceDescription(resource, t)}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
            {localizedCategory(resource, t)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-black text-yellow-700">
            <LockKeyhole className="h-3 w-3" />
            {t("common.contactManaged")}
          </span>
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs font-semibold text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" />
            {resource.views}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="h-3.5 w-3.5" />
            {resource.matchCount}
          </span>
          <span className="font-black text-navy-700">{t("common.apply")}</span>
        </div>
      </div>
    </Link>
  );
}

export function ResourceListItem({ resource }: { resource: ResourceRecord }) {
  const { t } = useI18n();

  return (
    <Link href={`/resources/${resource.id}`} className="panel grid gap-4 p-3 transition hover:shadow-strong sm:grid-cols-[104px_1fr_auto]">
      <div className="min-h-24 rounded-2xl p-2" style={{ background: resource.gradient }}>
        <StatusBadge status={resource.status} t={t} className="bg-white/90" />
      </div>
      <div>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
          <MapPin className="h-3.5 w-3.5" />
          {resourceLocation(resource, t)}
        </div>
        <h3 className="mt-1 text-base font-black text-slate-950">{resourceTitle(resource, t)}</h3>
        <p className="mt-1 text-sm leading-6 text-slate-500">{resourceDescription(resource, t)}</p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-black text-slate-600">
            {localizedCategory(resource, t)}
          </span>
          <span className="rounded-full border border-yellow-200 bg-yellow-50 px-2.5 py-1 text-[11px] font-black text-yellow-700">
            {t("common.contactManaged")}
          </span>
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
        <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-black text-sky-700">
          {t("common.available")}
        </span>
        <span className="btn-primary mt-0 h-9 px-4 sm:mt-5">{t("common.apply")}</span>
      </div>
    </Link>
  );
}
