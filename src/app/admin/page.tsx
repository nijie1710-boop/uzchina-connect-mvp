"use client";

import { useRouter } from "next/navigation";
import { Check, FileClock, FileText, Handshake, ShieldAlert, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import {
  localizedCategory,
  matchStatusLabel,
  readText,
  resourceLocation,
  resourceTitle,
  statusLabel,
  type AuditLogRecord,
  type DemandRecord,
  type LicenseApplicationRecord,
  type MatchRequestRecord,
  type ResourceRecord,
  type SubmissionStatus
} from "@/lib/domain";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";
import { adminReviewDemand } from "@/actions/demands";
import { adminReviewLicenseApplication } from "@/actions/licenses";
import { adminReviewMatchRequest } from "@/actions/matches";
import { adminReviewResource } from "@/actions/resources";

type AdminTab = "resources" | "demands" | "matches" | "licenses" | "audit";
type AdminMatchRequest = MatchRequestRecord & { resource: ResourceRecord };
type AdminStats = {
  pendingResources: number;
  approvedResources: number;
  pendingDemands: number;
  pendingMatches: number;
  pendingLicenses: number;
  auditLogs: number;
};
type AdminPayload = {
  stats: AdminStats;
  resources: ResourceRecord[];
  demands: DemandRecord[];
  matches: AdminMatchRequest[];
  licenses: LicenseApplicationRecord[];
  logs: AuditLogRecord[];
};

export default function AdminPage() {
  const { t, tArray } = useI18n();
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>("resources");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingResources, setPendingResources] = useState<ResourceRecord[]>([]);
  const [pendingDemands, setPendingDemands] = useState<DemandRecord[]>([]);
  const [pendingMatches, setPendingMatches] = useState<AdminMatchRequest[]>([]);
  const [pendingLicenses, setPendingLicenses] = useState<LicenseApplicationRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);

  const loadAdmin = useCallback(async () => {
    try {
      const response = await fetch("/api/admin");
      if (!response.ok) {
        router.push("/login");
        return;
      }
      const payload = (await response.json()) as AdminPayload;
      setStats(payload.stats);
      setPendingResources(payload.resources);
      setPendingDemands(payload.demands);
      setPendingMatches(payload.matches);
      setPendingLicenses(payload.licenses);
      setAuditLogs(payload.logs);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAdmin();
  }, [loadAdmin]);

  const reviewResource = async (id: string, status: "approved" | "rejected" | "needs_more_info" | "featured" | "high_risk" | "pending") => {
    const result = await adminReviewResource(id, status, t("admin.contactHidden"));
    showToast(result.ok ? t("toast.resourceApproved") : result.error);
    await loadAdmin();
  };

  const reviewDemand = async (id: string, status: "approved" | "rejected" | "needs_more_info") => {
    const result = await adminReviewDemand(id, status, t("admin.notePlaceholder"));
    showToast(result.ok ? t("common.approved") : result.error);
    await loadAdmin();
  };

  const reviewMatch = async (id: string, status: "contact_unlocked" | "rejected") => {
    const result = await adminReviewMatchRequest(id, status, status === "contact_unlocked" ? t("detail.contactUnlocked") : t("common.reject"));
    showToast(result.ok ? t("toast.matchUnlocked") : result.error);
    await loadAdmin();
  };

  const reviewLicense = async (id: string, status: "approved" | "rejected" | "contacted" | "needs_more_info") => {
    const result = await adminReviewLicenseApplication(id, status, t("forms.licenseTitle"));
    showToast(result.ok ? t("toast.licenseApproved") : result.error);
    await loadAdmin();
  };

  if (!stats) {
    return <div className="page-pad text-sm font-semibold text-slate-500">{t("admin.subtitle")}</div>;
  }

  return (
    <div className="mobile-screen">
      <div className="grid min-h-[calc(100dvh-64px)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden bg-navy p-6 text-white lg:block">
          <h1 className="text-xl font-black">UzChina</h1>
          <p className="text-xs font-semibold tracking-[0.3em] text-white/50">CONNECT</p>
          <div className="mt-8 grid gap-2">
            {[
              ["resources", t("admin.resourceReview"), FileClock],
              ["demands", t("forms.demandTitle"), Users],
              ["matches", t("admin.matchReview"), Handshake],
              ["licenses", t("admin.licenseReview"), FileText],
              ["audit", t("admin.auditLog"), ShieldAlert]
            ].map(([key, label, Icon]) => {
              const TypedIcon = Icon as typeof FileClock;
              return (
                <button
                  key={key as string}
                  onClick={() => setTab(key as AdminTab)}
                  className={tab === key ? "flex h-11 items-center gap-3 rounded-xl bg-white/[0.12] px-3 text-left text-sm font-black text-gold" : "flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-white/70 hover:bg-white/[0.08]"}
                >
                  <TypedIcon className="h-4 w-4" />
                  {label as string}
                </button>
              );
            })}
          </div>
        </aside>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div>
            <h1 className="section-title">{t("admin.title")}</h1>
            <p className="section-subtitle">{t("admin.subtitle")}</p>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {[
                ["resources", t("admin.resourceReview")],
                ["demands", t("forms.demandTitle")],
                ["matches", t("admin.matchReview")],
                ["licenses", t("admin.licenseReview")],
                ["audit", t("admin.auditLog")]
              ].map(([key, label]) => (
                <button
                  key={key as string}
                  onClick={() => setTab(key as AdminTab)}
                  className={tab === key ? "rounded-full bg-navy-700 px-4 py-2 text-xs font-black text-white" : "rounded-full border border-line bg-white px-4 py-2 text-xs font-black text-slate-600"}
                >
                  {label as string}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[
              [t("admin.pending"), stats.pendingResources],
              [t("admin.approved"), stats.approvedResources],
              [t("forms.demandTitle"), stats.pendingDemands],
              [t("admin.matchReview"), stats.pendingMatches],
              [t("admin.licenseReview"), stats.pendingLicenses]
            ].map(([label, value]) => (
              <div key={label as string} className="panel p-5">
                <small className="text-xs font-bold text-slate-500">{label as string}</small>
                <b className="mt-2 block text-3xl font-black">{value as number}</b>
              </div>
            ))}
          </div>

          {tab === "resources" ? (
            <section className="panel mt-6 overflow-hidden">
              <TableHead labels={tArray("admin.tableResource")} />
              {pendingResources.length ? (
                pendingResources.map((resource) => (
                  <div key={resource.id} className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1.6fr_1fr_1fr_1fr_170px] lg:items-center">
                    <b>{resourceTitle(resource, t)}</b>
                    <span className="text-slate-500">{resourceLocation(resource, t)}</span>
                    <span>{localizedCategory(resource, t)}</span>
                    <span>{readText(resource.ownerName, resource.ownerNameKey, t)}</span>
                    <div className="flex gap-2">
                      <button onClick={() => reviewResource(resource.id, "approved")} className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => reviewResource(resource.id, "rejected")} className="rounded-xl bg-rose-50 p-2 text-rose-700">
                        <X className="h-4 w-4" />
                      </button>
                      <button onClick={() => reviewResource(resource.id, "needs_more_info")} className="rounded-xl bg-sky-50 px-3 text-xs font-black text-sky-700">
                        {t("common.requestInfo")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </section>
          ) : null}

          {tab === "demands" ? (
            <section className="panel mt-6 overflow-hidden">
              <TableHead labels={tArray("admin.tableResource")} />
              {pendingDemands.length ? (
                pendingDemands.map((demand) => (
                  <div key={demand.id} className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1.6fr_1fr_1fr_1fr_170px] lg:items-center">
                    <b>{readText(demand.title, demand.titleKey, t)}</b>
                    <span className="text-slate-500">{readText(demand.country, demand.countryKey, t)} · {readText(demand.city, demand.cityKey, t)}</span>
                    <span>{localizedCategory(demand, t)}</span>
                    <StatusBadge status={demand.status} t={t} />
                    <div className="flex gap-2">
                      <button onClick={() => reviewDemand(demand.id, "approved")} className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => reviewDemand(demand.id, "rejected")} className="rounded-xl bg-rose-50 p-2 text-rose-700">
                        <X className="h-4 w-4" />
                      </button>
                      <button onClick={() => reviewDemand(demand.id, "needs_more_info")} className="rounded-xl bg-sky-50 px-3 text-xs font-black text-sky-700">
                        {t("common.requestInfo")}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </section>
          ) : null}

          {tab === "matches" ? (
            <section className="panel mt-6 overflow-hidden">
              <TableHead labels={tArray("admin.tableMatch")} />
              {pendingMatches.length ? (
                pendingMatches.map((request) => (
                  <div key={request.id} className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1.5fr_1fr_1fr_1fr_190px] lg:items-center">
                    <b>{resourceTitle(request.resource, t)}</b>
                    <span>{readText(request.applicantName, request.applicantNameKey, t)}</span>
                    <StatusBadge status={request.status} t={t} />
                    <span className="text-slate-500">{request.intent}</span>
                    <div className="flex gap-2">
                      <button onClick={() => reviewMatch(request.id, "contact_unlocked")} className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                        {t("common.approveUnlock")}
                      </button>
                      <button onClick={() => reviewMatch(request.id, "rejected")} className="rounded-xl bg-rose-50 p-2 text-rose-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </section>
          ) : null}

          {tab === "licenses" ? (
            <section className="panel mt-6 overflow-hidden">
              <TableHead labels={tArray("admin.tableLicense")} />
              {pendingLicenses.length ? (
                pendingLicenses.map((application) => (
                  <div key={application.id} className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1.2fr_1fr_1fr_1fr_160px] lg:items-center">
                    <b>{readText(application.applicantName, application.applicantNameKey, t)}</b>
                    <span className="text-slate-500">
                      {readText(application.country, application.countryKey, t)} · {readText(application.city, application.cityKey, t)}
                    </span>
                    <span>{readText(application.partnership, application.partnershipKey, t)}</span>
                    <StatusBadge status={application.status} t={t} />
                    <div className="flex gap-2">
                      <button onClick={() => reviewLicense(application.id, "approved")} className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => reviewLicense(application.id, "rejected")} className="rounded-xl bg-rose-50 p-2 text-rose-700">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </section>
          ) : null}

          {tab === "audit" ? (
            <section className="panel mt-6 overflow-hidden">
              <div className="grid grid-cols-[1fr_1fr_1fr] gap-3 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500">
                <span>{t("admin.auditAction")}</span>
                <span>{t("admin.auditTarget")}</span>
                <span>{t("admin.auditTime")}</span>
              </div>
              {auditLogs.length ? (
                auditLogs.map((log) => (
                  <div key={log.id} className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1fr_1fr_1fr]">
                    <span className="font-black">{log.action}</span>
                    <span className="text-slate-500">
                      {log.targetType} · {log.toStatus ? (log.toStatus === "contact_unlocked" ? matchStatusLabel(log.toStatus, t) : statusLabel(log.toStatus as SubmissionStatus, t)) : log.targetTitle}
                    </span>
                    <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                ))
              ) : (
                <EmptyState />
              )}
            </section>
          ) : null}
        </main>
      </div>
    </div>
  );
}

function TableHead({ labels }: { labels: string[] }) {
  return (
    <div className="hidden gap-3 bg-slate-50 px-4 py-3 text-xs font-black text-slate-500 lg:grid lg:grid-cols-[1.6fr_1fr_1fr_1fr_170px]">
      {labels.map((label) => (
        <span key={label}>{label}</span>
      ))}
    </div>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return <div className="p-8 text-center text-sm font-semibold text-slate-500">{t("admin.noPending")}</div>;
}
