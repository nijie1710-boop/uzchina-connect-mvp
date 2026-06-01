"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { BadgeCheck, FileCheck2, Handshake, Library, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import {
  localizedCategory,
  matchStatusLabel,
  readText,
  resourceTitle,
  type DemandRecord,
  type LicenseApplicationRecord,
  type MatchRequestRecord,
  type ResourceRecord,
  type VerificationRecord
} from "@/lib/domain";
import { StatusBadge } from "@/components/status-badge";

type DashboardUser = {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  telegram: string | null;
  whatsapp: string | null;
  wechat: string | null;
  companyName: string | null;
  verifyStatus: string;
};

type DashboardPayload = {
  user: DashboardUser;
  resources: ResourceRecord[];
  demands: DemandRecord[];
  matches: MatchRequestRecord[];
  licenses: LicenseApplicationRecord[];
  verifications: VerificationRecord[];
};

export default function DashboardPage() {
  const { t } = useI18n();
  const router = useRouter();
  const [user, setUser] = useState<DashboardUser | null>(null);
  const [myResources, setMyResources] = useState<ResourceRecord[]>([]);
  const [myDemands, setMyDemands] = useState<DemandRecord[]>([]);
  const [myMatches, setMyMatches] = useState<MatchRequestRecord[]>([]);
  const [myLicenses, setMyLicenses] = useState<LicenseApplicationRecord[]>([]);
  const [myVerifications, setMyVerifications] = useState<VerificationRecord[]>([]);

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch("/api/dashboard");
        if (!response.ok) {
          router.push("/login");
          return;
        }
        const payload = (await response.json()) as DashboardPayload;
        setUser(payload.user);
        setMyResources(payload.resources);
        setMyDemands(payload.demands);
        setMyMatches(payload.matches);
        setMyLicenses(payload.licenses);
        setMyVerifications(payload.verifications);
      } catch {
        router.push("/login");
      }
    }
    void loadDashboard();
  }, [router]);

  if (!user) {
    return <div className="page-pad text-sm font-semibold text-slate-500">{t("auth.loginSubtitle")}</div>;
  }

  const name = user.name ?? user.email;
  const company = user.companyName ?? t("dashboard.profile");
  const pendingCount =
    myResources.filter((resource) => resource.status === "pending").length +
    myDemands.filter((demand) => demand.status === "pending").length +
    myMatches.filter((request) => request.status === "pending").length +
    myLicenses.filter((application) => application.status === "pending").length;
  const verificationStatus =
    user.verifyStatus === "VERIFIED"
      ? t("common.verified")
      : user.verifyStatus === "REJECTED"
        ? t("common.rejected")
        : user.verifyStatus === "NEEDS_MORE_INFO"
          ? t("common.needsMoreInfo")
          : t("dashboard.verificationPending");

  return (
    <div className="mobile-screen">
      <div className="bg-navy px-4 py-6 text-white sm:px-6 md:hidden">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-lg font-black text-navy">U</div>
          <div>
            <h1 className="text-xl font-black">{t("dashboard.title")}</h1>
            <p className="text-sm text-white/70">{name}</p>
          </div>
        </div>
      </div>
      <div className="hidden border-b border-line bg-white px-4 py-5 sm:px-6 md:block lg:px-8">
        <h1 className="section-title">{t("dashboard.title")}</h1>
        <p className="section-subtitle">{t("dashboard.subtitle")}</p>
      </div>

      <div className="grid gap-6 px-4 py-5 sm:px-6 lg:grid-cols-[280px_1fr] lg:px-8 lg:py-8">
        <aside className="panel h-fit p-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-navy text-lg font-black text-gold">U</div>
            <div>
              <b className="block">{name}</b>
              <span className="text-xs font-semibold text-slate-500">{t("dashboard.verificationPending")}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-2">
            {[t("dashboard.myResources"), t("dashboard.myDemands"), t("dashboard.myMatches"), t("dashboard.myLicenses"), t("dashboard.myVerifications")].map((item, index) => (
              <button
                key={item}
                className={index === 0 ? "h-11 rounded-xl bg-sky-50 px-3 text-left text-sm font-black text-sky-700" : "h-11 rounded-xl px-3 text-left text-sm font-black text-slate-500 hover:bg-slate-50"}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="mt-5 rounded-2xl bg-slate-50 p-4">
            <h2 className="font-black">{t("dashboard.accountProfile")}</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
              <p>{company}</p>
              <p>{user.email}</p>
              <p>{verificationStatus}</p>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-slate-50 p-4">
            <h2 className="font-black">{t("dashboard.contactProfile")}</h2>
            <div className="mt-3 grid gap-2 text-sm font-semibold text-slate-600">
              <p>{user.phone}</p>
              <p>{user.telegram}</p>
              <p>{user.whatsapp}</p>
              <p>{user.wechat}</p>
            </div>
          </div>
        </aside>

        <main className="grid gap-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              [t("dashboard.stats.0"), myResources.length, Library],
              [t("dashboard.stats.1"), pendingCount, FileCheck2],
              [t("dashboard.stats.2"), myMatches.length, Handshake],
              [t("dashboard.stats.3"), verificationStatus, BadgeCheck]
            ].map(([label, value, Icon]) => {
              const TypedIcon = Icon as typeof Library;
              return (
                <div key={label as string} className="panel p-5">
                  <TypedIcon className="h-5 w-5 text-navy-700" />
                  <small className="mt-3 block text-xs font-bold text-slate-500">{label as string}</small>
                  <b className="mt-1 block text-2xl font-black">{value as string | number}</b>
                </div>
              );
            })}
          </div>

          <DashboardTable title={t("dashboard.myResources")}>
            {myResources.map((resource) => (
              <div key={resource.id} className="grid gap-2 border-t border-slate-100 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
                <b>{resourceTitle(resource, t)}</b>
                <span className="text-slate-500">{localizedCategory(resource, t)}</span>
                <StatusBadge status={resource.status} t={t} />
                <Link href={`/resources/${resource.id}`} className="btn-outline h-9 px-4">
                  {t("dashboard.view")}
                </Link>
                <RecordNote note={resource.adminNote} />
              </div>
            ))}
          </DashboardTable>

          <DashboardTable title={t("dashboard.myDemands")}>
            {myDemands.map((demand) => (
              <div key={demand.id} className="grid gap-2 border-t border-slate-100 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
                <b>{readText(demand.title, demand.titleKey, t)}</b>
                <span className="text-slate-500">{localizedCategory(demand, t)}</span>
                <StatusBadge status={demand.status} t={t} />
                <button className="btn-outline h-9 px-4">{t("dashboard.view")}</button>
                <RecordNote note={demand.adminNote} />
              </div>
            ))}
          </DashboardTable>

          <DashboardTable title={t("dashboard.myMatches")}>
            {myMatches.map((request) => {
              const resource = myResources.find((item) => item.id === request.resourceId);
              return (
                <div key={request.id} className="grid gap-2 border-t border-slate-100 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
                  <b>{request.resourceTitle ?? (resource ? resourceTitle(resource, t) : request.resourceId)}</b>
                  <span className="text-slate-500">{request.intent}</span>
                  <span className="text-sm font-black text-slate-600">{matchStatusLabel(request.status, t)}</span>
                  <Link href={`/resources/${request.resourceId}`} className="btn-outline h-9 px-4">
                    {t("dashboard.view")}
                  </Link>
                  <RecordNote note={request.adminNote} />
                </div>
              );
            })}
          </DashboardTable>

          <DashboardTable title={t("dashboard.myLicenses")}>
            {myLicenses.map((application) => (
              <div key={application.id} className="grid gap-2 border-t border-slate-100 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
                <b>{readText(application.applicantName, application.applicantNameKey, t)}</b>
                <span className="text-slate-500">{readText(application.partnership, application.partnershipKey, t)}</span>
                <StatusBadge status={application.status} t={t} />
                <button className="btn-outline h-9 px-4">{t("dashboard.view")}</button>
                <RecordNote note={application.adminNote} />
              </div>
            ))}
          </DashboardTable>

          <DashboardTable title={t("dashboard.myVerifications")}>
            {myVerifications.map((verification) => (
              <div key={verification.id} className="grid gap-2 border-t border-slate-100 p-4 text-sm md:grid-cols-[1.5fr_1fr_1fr_auto] md:items-center">
                <b>{verification.type}</b>
                <span className="text-slate-500">{verification.documentUrl ?? "-"}</span>
                <StatusBadge status={verification.status} t={t} />
                <button className="btn-outline h-9 px-4">{t("dashboard.view")}</button>
                <RecordNote note={verification.adminNote} />
              </div>
            ))}
          </DashboardTable>
        </main>
      </div>
    </div>
  );
}

function RecordNote({ note }: { note?: string }) {
  const { t } = useI18n();
  if (!note) return null;
  return (
    <p className="rounded-2xl bg-amber-50 p-3 text-xs font-semibold leading-5 text-amber-800 md:col-span-4">
      <b>{t("dashboard.reviewNote")}：</b>
      {note}
    </p>
  );
}

function DashboardTable({ title, children }: { title: string; children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <section className="panel overflow-hidden">
      <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
        <h2 className="font-black">{title}</h2>
        <UserRound className="h-4 w-4 text-slate-400" />
      </div>
      <div className="hidden grid-cols-[1.5fr_1fr_1fr_auto] gap-2 px-4 py-3 text-xs font-black text-slate-500 md:grid">
        <span>{t("dashboard.titleColumn")}</span>
        <span>{t("dashboard.typeColumn")}</span>
        <span>{t("dashboard.statusColumn")}</span>
        <span>{t("dashboard.actionColumn")}</span>
      </div>
      {children}
    </section>
  );
}
