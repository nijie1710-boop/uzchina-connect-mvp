"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileText, LockKeyhole, MapPin, Phone, Send, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import {
  localizedAdvantages,
  localizedCategory,
  localizedDocuments,
  readText,
  resourceDescription,
  resourceLocation,
  resourceTitle,
  type MatchRequestRecord,
  type ResourceRecord
} from "@/lib/domain";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";
import { createMatchRequest } from "@/actions/matches";

type ResourceDetailData = {
  resource: ResourceRecord;
  matchRequest: MatchRequestRecord | null;
  contactUnlocked: boolean;
  isAuthenticated: boolean;
};

export function ResourceDetailPage({ id }: { id: string }) {
  const { t, tArray } = useI18n();
  const { showToast } = useToast();
  const router = useRouter();
  const [intent, setIntent] = useState("");
  const [detail, setDetail] = useState<ResourceDetailData | null>(null);
  const process = tArray("detail.process");

  useEffect(() => {
    void fetch(`/api/resources/${id}`)
      .then((response) => (response.ok ? (response.json() as Promise<ResourceDetailData>) : null))
      .then(setDetail);
  }, [id]);

  const submitMatch = async () => {
    if (!detail) return;
    const result = await createMatchRequest(detail.resource.id, intent || t("detail.applyPlaceholder"));
    if (!result.ok) {
      showToast(result.error);
      if (result.error.includes("登录")) router.push("/login");
      return;
    }
    showToast(t("toast.matchSubmitted"));
    const nextDetail = await fetch(`/api/resources/${id}`).then((response) =>
      response.ok ? (response.json() as Promise<ResourceDetailData>) : null
    );
    setDetail(nextDetail);
  };

  if (!detail) {
    return <div className="page-pad text-sm font-semibold text-slate-500">{t("resources.empty")}</div>;
  }

  const { resource, contactUnlocked } = detail;

  return (
    <div className="mobile-screen">
      <div className="border-b border-line bg-white px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/resources" className="inline-flex items-center gap-2 text-sm font-black text-navy-700">
          <ArrowLeft className="h-4 w-4" />
          {t("resources.title")}
        </Link>
        <h1 className="mt-3 section-title">{t("detail.title")}</h1>
        <p className="section-subtitle">{t("detail.subtitle")}</p>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[1fr_360px] lg:px-8 lg:py-8">
        <article className="panel p-5 lg:p-7">
          <div className="flex flex-wrap gap-2">
            <StatusBadge status={resource.status} t={t} />
            <span className="rounded-full border border-yellow-200 bg-yellow-50 px-3 py-1 text-xs font-black text-yellow-700">
              {t("detail.keyResource")}
            </span>
          </div>
          <h2 className="mt-4 text-2xl font-black leading-tight text-slate-950 lg:text-3xl">{resourceTitle(resource, t)}</h2>
          <div className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-slate-500">
            <MapPin className="h-4 w-4" />
            {resourceLocation(resource, t)} · {new Date(resource.createdAt).toLocaleDateString()}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {[
              [t("detail.industry"), localizedCategory(resource, t)],
              [t("detail.cooperation"), readText(resource.cooperation, resource.cooperationKey, t)],
              [t("detail.target"), readText(resource.target, resource.targetKey, t)]
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl bg-slate-50 p-4">
                <small className="text-xs font-bold text-slate-500">{label}</small>
                <b className="mt-2 block text-sm text-slate-950">{value}</b>
              </div>
            ))}
          </div>

          <section className="mt-7">
            <h3 className="text-lg font-black">{t("detail.description")}</h3>
            <p className="mt-2 text-sm leading-7 text-slate-600">{resourceDescription(resource, t)}</p>
          </section>

          <section className="mt-7">
            <h3 className="text-lg font-black">{t("detail.advantages")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {localizedAdvantages(resource, tArray).map((item) => (
                <div key={item} className="flex items-center gap-2 rounded-2xl bg-slate-50 p-4 text-sm font-bold text-slate-700">
                  <CheckCircle2 className="h-4 w-4 text-teal" />
                  {item}
                </div>
              ))}
            </div>
          </section>

          <section className="mt-7">
            <h3 className="text-lg font-black">{t("detail.files")}</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              {localizedDocuments(resource, tArray).map((item) => (
                <div key={item} className="rounded-2xl border border-line bg-slate-50 p-4">
                  <FileText className="mb-3 h-5 w-5 text-navy-700" />
                  <b className="text-sm">{item}</b>
                  <p className="mt-2 text-xs leading-5 text-slate-500">{t("detail.subtitle")}</p>
                </div>
              ))}
            </div>
          </section>

          <p className="mt-7 rounded-2xl bg-yellow-50 p-4 text-sm font-semibold leading-7 text-yellow-800">{t("detail.platformNote")}</p>
        </article>

        <aside className="space-y-4">
          <div className="panel p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy text-gold">
              <LockKeyhole className="h-6 w-6" />
            </div>
            <h3 className="mt-4 text-xl font-black">{t("detail.applyTitle")}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{t("detail.applyText")}</p>
            <textarea
              value={intent}
              onChange={(event) => setIntent(event.target.value)}
              placeholder={t("detail.applyPlaceholder")}
              className="field mt-4 min-h-28 w-full resize-none"
            />
            <button onClick={submitMatch} className="btn-primary mt-3 w-full">
              <Send className="h-4 w-4" />
              {detail.matchRequest ? t("dashboard.matching") : t("common.apply")}
            </button>
          </div>

          <div className="panel p-5">
            <h3 className="text-lg font-black">{t("detail.processTitle")}</h3>
            <div className="mt-4 grid gap-3">
              {process.map((item, index) => (
                <div key={item} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy-700 text-xs font-black text-white">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm font-bold text-slate-700">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className={contactUnlocked ? "rounded-3xl bg-teal p-5 text-white shadow-soft" : "rounded-3xl bg-navy p-5 text-white shadow-soft"}>
            <div className="flex items-center gap-2">
              {contactUnlocked ? <Phone className="h-5 w-5 text-white" /> : <ShieldCheck className="h-5 w-5 text-gold" />}
              <h3 className="font-black">{contactUnlocked ? t("detail.contactUnlocked") : t("detail.contactStatus")}</h3>
            </div>
            <div className="mt-4 grid gap-2 text-sm font-semibold text-white/80">
              {contactUnlocked ? (
                <>
                  <p>{resource.contact.phone}</p>
                  <p>{resource.contact.email}</p>
                  <p>{resource.contact.wechat ?? resource.contact.telegram ?? resource.contact.whatsapp}</p>
                </>
              ) : (
                <>
                  <p>{t("detail.phoneLocked")}</p>
                  <p>{t("detail.emailLocked")}</p>
                  <p>{t("detail.wechatLocked")}</p>
                </>
              )}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
