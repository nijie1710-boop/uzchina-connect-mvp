"use client";

import { useRouter } from "next/navigation";
import { Check, Eye, FileClock, FileText, Handshake, LayoutDashboard, Plus, Search, ShieldAlert, ShieldCheck, Star, Users, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useI18n } from "@/i18n/provider";
import {
  localizedCategory,
  readText,
  resourceLocation,
  resourceTitle,
  type AdminUserRecord,
  type AuditLogRecord,
  type DemandRecord,
  type LicenseApplicationRecord,
  type MatchRequestRecord,
  type ResourceRecord,
  type VerificationRecord
} from "@/lib/domain";
import { StatusBadge } from "@/components/status-badge";
import { useToast } from "@/components/toast-provider";
import { adminUpdateUserVerifyStatus } from "@/actions/admin";
import { adminReviewDemand } from "@/actions/demands";
import { adminReviewLicenseApplication } from "@/actions/licenses";
import { addMatchFollowUp, adminReviewMatchRequest } from "@/actions/matches";
import { adminReviewResource } from "@/actions/resources";
import { adminReviewVerification } from "@/actions/verifications";

type AdminTab = "overview" | "resources" | "demands" | "matches" | "licenses" | "verifications" | "users" | "audit";
type AdminMatchRequest = MatchRequestRecord & { resource: ResourceRecord };
type AdminStats = {
  pendingResources: number;
  approvedResources: number;
  pendingDemands: number;
  pendingMatches: number;
  pendingLicenses: number;
  pendingVerifications: number;
  users: number;
  auditLogs: number;
};
type AdminPayload = {
  stats: AdminStats;
  resources: ResourceRecord[];
  demands: DemandRecord[];
  matches: AdminMatchRequest[];
  licenses: LicenseApplicationRecord[];
  verifications: VerificationRecord[];
  users: AdminUserRecord[];
  logs: AuditLogRecord[];
};

const ADMIN_PAGE_SIZE = 8;
const initialPages: Record<AdminTab, number> = {
  overview: 1,
  resources: 1,
  demands: 1,
  matches: 1,
  licenses: 1,
  verifications: 1,
  users: 1,
  audit: 1
};

export default function AdminPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { showToast } = useToast();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [pendingResources, setPendingResources] = useState<ResourceRecord[]>([]);
  const [pendingDemands, setPendingDemands] = useState<DemandRecord[]>([]);
  const [pendingMatches, setPendingMatches] = useState<AdminMatchRequest[]>([]);
  const [pendingLicenses, setPendingLicenses] = useState<LicenseApplicationRecord[]>([]);
  const [pendingVerifications, setPendingVerifications] = useState<VerificationRecord[]>([]);
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [followUpNote, setFollowUpNote] = useState("");
  const [followUpNextStep, setFollowUpNextStep] = useState("");
  const [query, setQuery] = useState("");
  const [pageByTab, setPageByTab] = useState<Record<AdminTab, number>>(initialPages);
  const normalizedQuery = query.trim().toLowerCase();

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
      setPendingVerifications(payload.verifications);
      setUsers(payload.users);
      setAuditLogs(payload.logs);
    } catch {
      router.push("/login");
    }
  }, [router]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadAdmin();
  }, [loadAdmin]);

  const noteFor = (id: string) => notes[id]?.trim() || "";
  const setNote = (id: string, value: string) => setNotes((current) => ({ ...current, [id]: value }));
  const pageFor = (key: AdminTab) => pageByTab[key] ?? 1;
  const setPage = (key: AdminTab, value: number) => setPageByTab((current) => ({ ...current, [key]: value }));

  const runReview = async (result: Promise<{ ok: boolean; error?: string }>, successText: string) => {
    const resolved = await result;
    showToast(resolved.ok ? successText : (resolved.error ?? "Failed"));
    await loadAdmin();
  };

  const selectedMatch = selectedMatchId ? (pendingMatches.find((request) => request.id === selectedMatchId) ?? null) : null;

  const openMatchDetail = (request: AdminMatchRequest) => {
    setSelectedMatchId(request.id);
    setFollowUpNote("");
    setFollowUpNextStep("");
  };

  const saveMatchFollowUp = async () => {
    if (!selectedMatch) return;
    const result = await addMatchFollowUp(selectedMatch.id, followUpNote, followUpNextStep);
    showToast(result.ok ? t("admin.followUpSaved") : (result.error ?? "Failed"));
    if (result.ok) {
      setFollowUpNote("");
      setFollowUpNextStep("");
      await loadAdmin();
    }
  };

  if (!stats) {
    return <div className="page-pad text-sm font-semibold text-slate-500">{t("admin.loading")}</div>;
  }

  const tabs: Array<[AdminTab, string, typeof FileClock]> = [
    ["overview", t("admin.overview"), LayoutDashboard],
    ["resources", t("admin.resourceReview"), FileClock],
    ["demands", t("admin.demandReview"), Users],
    ["matches", t("admin.matchReview"), Handshake],
    ["licenses", t("admin.licenseReview"), FileText],
    ["verifications", t("admin.verificationReview"), ShieldCheck],
    ["users", t("admin.userManagement"), Users],
    ["audit", t("admin.auditLog"), ShieldAlert]
  ];

  const includesQuery = (parts: Array<string | null | undefined>) => {
    if (!normalizedQuery) return true;
    return parts.some((part) => part?.toLowerCase().includes(normalizedQuery));
  };

  const filteredResources = pendingResources.filter((resource) =>
    includesQuery([
      resourceTitle(resource, t),
      resourceLocation(resource, t),
      localizedCategory(resource, t),
      readText(resource.ownerName, resource.ownerNameKey, t),
      resource.status
    ])
  );
  const filteredDemands = pendingDemands.filter((demand) =>
    includesQuery([
      readText(demand.title, demand.titleKey, t),
      readText(demand.country, demand.countryKey, t),
      readText(demand.city, demand.cityKey, t),
      localizedCategory(demand, t),
      demand.status
    ])
  );
  const filteredMatches = pendingMatches.filter((request) =>
    includesQuery([
      resourceTitle(request.resource, t),
      readText(request.applicantName, request.applicantNameKey, t),
      request.intent,
      request.status
    ])
  );
  const filteredLicenses = pendingLicenses.filter((application) =>
    includesQuery([
      readText(application.applicantName, application.applicantNameKey, t),
      readText(application.country, application.countryKey, t),
      readText(application.city, application.cityKey, t),
      readText(application.partnership, application.partnershipKey, t),
      application.status
    ])
  );
  const filteredVerifications = pendingVerifications.filter((verification) =>
    includesQuery([verification.userName, verification.userId, verification.type, verification.status, verification.documentUrl])
  );
  const filteredUsers = users.filter((user) =>
    includesQuery([user.name, user.email, user.role, user.verifyStatus])
  );
  const filteredAuditLogs = auditLogs.filter((log) =>
    includesQuery([log.action, log.targetType, log.targetTitle, log.note, log.adminName])
  );
  const resourcePage = pageFor("resources");
  const demandPage = pageFor("demands");
  const matchPage = pageFor("matches");
  const licensePage = pageFor("licenses");
  const verificationPage = pageFor("verifications");
  const userPage = pageFor("users");
  const auditPage = pageFor("audit");
  const visibleResources = paginate(filteredResources, resourcePage, ADMIN_PAGE_SIZE);
  const visibleDemands = paginate(filteredDemands, demandPage, ADMIN_PAGE_SIZE);
  const visibleMatches = paginate(filteredMatches, matchPage, ADMIN_PAGE_SIZE);
  const visibleLicenses = paginate(filteredLicenses, licensePage, ADMIN_PAGE_SIZE);
  const visibleVerifications = paginate(filteredVerifications, verificationPage, ADMIN_PAGE_SIZE);
  const visibleUsers = paginate(filteredUsers, userPage, ADMIN_PAGE_SIZE);
  const visibleAuditLogs = paginate(filteredAuditLogs, auditPage, ADMIN_PAGE_SIZE);

  return (
    <div className="mobile-screen">
      <div className="grid min-h-[calc(100dvh-64px)] lg:grid-cols-[250px_1fr]">
        <aside className="hidden bg-navy p-6 text-white lg:block">
          <h1 className="text-xl font-black">UzChina</h1>
          <p className="text-xs font-semibold tracking-[0.3em] text-white/50">CONNECT</p>
          <div className="mt-8 grid gap-2">
            {tabs.map(([key, label, Icon]) => (
              <button
                key={key}
                onClick={() => {
                  setTab(key);
                  setPage(key, 1);
                }}
                className={tab === key ? "flex h-11 items-center gap-3 rounded-xl bg-white/[0.12] px-3 text-left text-sm font-black text-gold" : "flex h-11 items-center gap-3 rounded-xl px-3 text-left text-sm font-black text-white/70 hover:bg-white/[0.08]"}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </aside>

        <main className="px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
          <div>
            <h1 className="section-title">{t("admin.title")}</h1>
            <p className="section-subtitle">{t("admin.subtitle")}</p>
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {tabs.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    setTab(key);
                    setPage(key, 1);
                  }}
                  className={tab === key ? "rounded-full bg-navy-700 px-4 py-2 text-xs font-black text-white" : "rounded-full border border-line bg-white px-4 py-2 text-xs font-black text-slate-600"}
                >
                  {label}
                </button>
              ))}
            </div>
            <label className="mt-4 flex h-11 max-w-xl items-center gap-2 rounded-2xl border border-line bg-white px-4 text-sm">
              <Search className="h-4 w-4 text-slate-400" />
              <input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setPageByTab(initialPages);
                }}
                placeholder={t("admin.searchPlaceholder")}
                className="h-full flex-1 bg-transparent text-sm font-semibold outline-none placeholder:text-slate-400"
              />
            </label>
          </div>

          <StatsGrid stats={stats} />

          {tab === "overview" ? (
            <section className="mt-6 grid gap-5 lg:grid-cols-[1fr_360px]">
              <div className="panel overflow-hidden">
                <SectionTitle title={t("admin.recentAudit")} />
                {filteredAuditLogs.slice(0, 8).map((log) => (
                  <AuditRow key={log.id} log={log} />
                ))}
              </div>
              <div className="panel p-5">
                <h2 className="font-black">{t("admin.drawerTitle")}</h2>
                <div className="mt-4 grid gap-3 text-sm font-semibold text-slate-600">
                  <p>{t("admin.resourceReview")}: {stats.pendingResources}</p>
                  <p>{t("admin.demandReview")}: {stats.pendingDemands}</p>
                  <p>{t("admin.matchReview")}: {stats.pendingMatches}</p>
                  <p>{t("admin.licenseReview")}: {stats.pendingLicenses}</p>
                  <p>{t("admin.verificationReview")}: {stats.pendingVerifications}</p>
                </div>
              </div>
            </section>
          ) : null}

          {tab === "resources" ? (
            <ReviewPanel title={t("admin.resourceReview")} empty={!filteredResources.length}>
              {visibleResources.map((resource) => (
                <ReviewItem
                  key={resource.id}
                  title={resourceTitle(resource, t)}
                  meta={`${resourceLocation(resource, t)} · ${localizedCategory(resource, t)} · ${readText(resource.ownerName, resource.ownerNameKey, t)}`}
                  status={<StatusBadge status={resource.status} t={t} />}
                  note={notes[resource.id] ?? ""}
                  notePlaceholder={t("admin.notePlaceholder")}
                  onNote={(value) => setNote(resource.id, value)}
                  actions={
                    <>
                      <ActionButton label={t("common.approve")} tone="green" onClick={() => runReview(adminReviewResource(resource.id, "approved", noteFor(resource.id)), t("common.approved"))} />
                      <ActionButton label={t("admin.markFeatured")} tone="gold" onClick={() => runReview(adminReviewResource(resource.id, "featured", noteFor(resource.id)), t("common.featured"))} icon={<Star className="h-3.5 w-3.5" />} />
                      <ActionButton label={t("common.reject")} tone="red" onClick={() => runReview(adminReviewResource(resource.id, "rejected", noteFor(resource.id)), t("common.rejected"))} />
                      <ActionButton label={t("common.requestInfo")} tone="blue" onClick={() => runReview(adminReviewResource(resource.id, "needs_more_info", noteFor(resource.id)), t("common.needsMoreInfo"))} />
                      <ActionButton label={t("admin.markHighRisk")} tone="red" onClick={() => runReview(adminReviewResource(resource.id, "high_risk", noteFor(resource.id)), t("common.highRisk"))} />
                    </>
                  }
                />
              ))}
              <PageControls total={filteredResources.length} page={resourcePage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("resources", next)} />
            </ReviewPanel>
          ) : null}

          {tab === "demands" ? (
            <ReviewPanel title={t("admin.demandReview")} empty={!filteredDemands.length}>
              {visibleDemands.map((demand) => (
                <ReviewItem
                  key={demand.id}
                  title={readText(demand.title, demand.titleKey, t)}
                  meta={`${readText(demand.country, demand.countryKey, t)} · ${readText(demand.city, demand.cityKey, t)} · ${localizedCategory(demand, t)}`}
                  status={<StatusBadge status={demand.status} t={t} />}
                  note={notes[demand.id] ?? ""}
                  notePlaceholder={t("admin.notePlaceholder")}
                  onNote={(value) => setNote(demand.id, value)}
                  actions={
                    <>
                      <ActionButton label={t("common.approve")} tone="green" onClick={() => runReview(adminReviewDemand(demand.id, "approved", noteFor(demand.id)), t("common.approved"))} />
                      <ActionButton label={t("common.reject")} tone="red" onClick={() => runReview(adminReviewDemand(demand.id, "rejected", noteFor(demand.id)), t("common.rejected"))} />
                      <ActionButton label={t("common.requestInfo")} tone="blue" onClick={() => runReview(adminReviewDemand(demand.id, "needs_more_info", noteFor(demand.id)), t("common.needsMoreInfo"))} />
                    </>
                  }
                />
              ))}
              <PageControls total={filteredDemands.length} page={demandPage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("demands", next)} />
            </ReviewPanel>
          ) : null}

          {tab === "matches" ? (
            <ReviewPanel title={t("admin.matchReview")} empty={!filteredMatches.length}>
              {visibleMatches.map((request) => (
                <ReviewItem
                  key={request.id}
                  title={resourceTitle(request.resource, t)}
                  meta={`${readText(request.applicantName, request.applicantNameKey, t)} · ${request.intent}`}
                  status={<StatusBadge status={request.status} t={t} />}
                  note={notes[request.id] ?? ""}
                  notePlaceholder={t("admin.notePlaceholder")}
                  onNote={(value) => setNote(request.id, value)}
                  actions={
                    <>
                      <ActionButton label={t("admin.viewDetail")} tone="blue" onClick={() => openMatchDetail(request)} icon={<Eye className="h-3.5 w-3.5" />} />
                      <ActionButton label={t("common.approve")} tone="green" onClick={() => runReview(adminReviewMatchRequest(request.id, "approved", noteFor(request.id)), t("common.approved"))} />
                      <ActionButton label={t("admin.openContact")} tone="green" onClick={() => runReview(adminReviewMatchRequest(request.id, "contact_unlocked", noteFor(request.id)), t("detail.contactUnlocked"))} />
                      <ActionButton label={t("common.reject")} tone="red" onClick={() => runReview(adminReviewMatchRequest(request.id, "rejected", noteFor(request.id)), t("common.rejected"))} />
                    </>
                  }
                />
              ))}
              <PageControls total={filteredMatches.length} page={matchPage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("matches", next)} />
            </ReviewPanel>
          ) : null}

          {tab === "licenses" ? (
            <ReviewPanel title={t("admin.licenseReview")} empty={!filteredLicenses.length}>
              {visibleLicenses.map((application) => (
                <ReviewItem
                  key={application.id}
                  title={readText(application.applicantName, application.applicantNameKey, t)}
                  meta={`${readText(application.country, application.countryKey, t)} · ${readText(application.city, application.cityKey, t)} · ${readText(application.partnership, application.partnershipKey, t)}`}
                  status={<StatusBadge status={application.status} t={t} />}
                  note={notes[application.id] ?? ""}
                  notePlaceholder={t("admin.notePlaceholder")}
                  onNote={(value) => setNote(application.id, value)}
                  actions={
                    <>
                      <ActionButton label={t("admin.markContacted")} tone="blue" onClick={() => runReview(adminReviewLicenseApplication(application.id, "contacted", noteFor(application.id)), t("common.contacted"))} />
                      <ActionButton label={t("common.approve")} tone="green" onClick={() => runReview(adminReviewLicenseApplication(application.id, "approved", noteFor(application.id)), t("common.approved"))} />
                      <ActionButton label={t("common.reject")} tone="red" onClick={() => runReview(adminReviewLicenseApplication(application.id, "rejected", noteFor(application.id)), t("common.rejected"))} />
                      <ActionButton label={t("common.requestInfo")} tone="blue" onClick={() => runReview(adminReviewLicenseApplication(application.id, "needs_more_info", noteFor(application.id)), t("common.needsMoreInfo"))} />
                    </>
                  }
                />
              ))}
              <PageControls total={filteredLicenses.length} page={licensePage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("licenses", next)} />
            </ReviewPanel>
          ) : null}

          {tab === "verifications" ? (
            <ReviewPanel title={t("admin.verificationReview")} empty={!filteredVerifications.length}>
              {visibleVerifications.map((verification) => (
                <ReviewItem
                  key={verification.id}
                  title={verification.userName ?? verification.userId}
                  meta={`${verification.type} · ${verification.documentUrl ?? "-"}`}
                  status={<StatusBadge status={verification.status} t={t} />}
                  note={notes[verification.id] ?? ""}
                  notePlaceholder={t("admin.notePlaceholder")}
                  onNote={(value) => setNote(verification.id, value)}
                  actions={
                    <>
                      <ActionButton label={t("common.approve")} tone="green" onClick={() => runReview(adminReviewVerification(verification.id, "approved", noteFor(verification.id)), t("common.approved"))} />
                      <ActionButton label={t("common.reject")} tone="red" onClick={() => runReview(adminReviewVerification(verification.id, "rejected", noteFor(verification.id)), t("common.rejected"))} />
                      <ActionButton label={t("common.requestInfo")} tone="blue" onClick={() => runReview(adminReviewVerification(verification.id, "needs_more_info", noteFor(verification.id)), t("common.needsMoreInfo"))} />
                    </>
                  }
                />
              ))}
              <PageControls total={filteredVerifications.length} page={verificationPage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("verifications", next)} />
            </ReviewPanel>
          ) : null}

          {tab === "users" ? (
            <section className="panel mt-6 overflow-hidden">
              <SectionTitle title={t("admin.userManagement")} />
              {filteredUsers.length ? visibleUsers.map((user) => (
                <div key={user.id} className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1.4fr_1fr_1fr_1.2fr_220px] lg:items-center">
                  <b>{user.name ?? user.email}</b>
                  <span className="text-slate-500">{user.email}</span>
                  <span className="text-slate-500">{user.role}</span>
                  <span className="font-black text-slate-700">{user.verifyStatus}</span>
                  <div className="flex flex-wrap gap-2">
                    <ActionButton label={t("admin.verifyUser")} tone="green" onClick={() => runReview(adminUpdateUserVerifyStatus(user.id, "verified", noteFor(user.id)), t("common.verified"))} />
                    <ActionButton label={t("common.requestInfo")} tone="blue" onClick={() => runReview(adminUpdateUserVerifyStatus(user.id, "needs_more_info", noteFor(user.id)), t("common.needsMoreInfo"))} />
                  </div>
                </div>
              )) : <EmptyState />}
              <PageControls total={filteredUsers.length} page={userPage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("users", next)} />
            </section>
          ) : null}

          {tab === "audit" ? (
            <section className="panel mt-6 overflow-hidden">
              <SectionTitle title={t("admin.auditLog")} />
              {filteredAuditLogs.length ? visibleAuditLogs.map((log) => <AuditRow key={log.id} log={log} />) : <EmptyState />}
              <PageControls total={filteredAuditLogs.length} page={auditPage} pageSize={ADMIN_PAGE_SIZE} onPage={(next) => setPage("audit", next)} />
            </section>
          ) : null}

          {selectedMatch ? (
            <MatchDetailModal
              request={selectedMatch}
              note={notes[selectedMatch.id] ?? ""}
              followUpNote={followUpNote}
              followUpNextStep={followUpNextStep}
              onNote={(value) => setNote(selectedMatch.id, value)}
              onFollowUpNote={setFollowUpNote}
              onFollowUpNextStep={setFollowUpNextStep}
              onAddFollowUp={() => void saveMatchFollowUp()}
              onClose={() => setSelectedMatchId(null)}
              onApprove={() => void runReview(adminReviewMatchRequest(selectedMatch.id, "approved", noteFor(selectedMatch.id)), t("common.approved"))}
              onUnlock={() => void runReview(adminReviewMatchRequest(selectedMatch.id, "contact_unlocked", noteFor(selectedMatch.id)), t("detail.contactUnlocked"))}
              onReject={() => void runReview(adminReviewMatchRequest(selectedMatch.id, "rejected", noteFor(selectedMatch.id)), t("common.rejected"))}
            />
          ) : null}
        </main>
      </div>
    </div>
  );
}

function MatchDetailModal({
  request,
  note,
  followUpNote,
  followUpNextStep,
  onNote,
  onFollowUpNote,
  onFollowUpNextStep,
  onAddFollowUp,
  onClose,
  onApprove,
  onUnlock,
  onReject
}: {
  request: AdminMatchRequest;
  note: string;
  followUpNote: string;
  followUpNextStep: string;
  onNote: (value: string) => void;
  onFollowUpNote: (value: string) => void;
  onFollowUpNextStep: (value: string) => void;
  onAddFollowUp: () => void;
  onClose: () => void;
  onApprove: () => void;
  onUnlock: () => void;
  onReject: () => void;
}) {
  const { t } = useI18n();
  const canAddFollowUp = followUpNote.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/50 p-4">
      <section className="w-full max-w-5xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">{t("admin.matchDetail")}</p>
            <h2 className="mt-1 text-lg font-black text-navy">{resourceTitle(request.resource, t)}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-slate-100 px-3 text-xs font-black text-slate-600 hover:bg-slate-200"
          >
            <X className="h-3.5 w-3.5" />
            {t("common.close")}
          </button>
        </div>

        <div className="max-h-[calc(100dvh-130px)] overflow-y-auto p-5">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="grid gap-4">
              <div className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-black text-navy">{t("admin.applicant")}</h3>
                  <StatusBadge status={request.status} t={t} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <DetailField label={t("admin.applicant")} value={readText(request.applicantName, request.applicantNameKey, t)} />
                  <DetailField label={t("dashboard.statusColumn")} value={<StatusBadge status={request.status} t={t} />} />
                  <DetailField label={t("admin.createdAt")} value={formatDate(request.createdAt)} />
                  <DetailField label={t("admin.reviewedAt")} value={formatDate(request.reviewedAt)} />
                  <DetailField label={t("admin.contactUnlockedAt")} value={formatDate(request.contactUnlockedAt)} />
                </div>
                <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                  <p className="text-xs font-black text-slate-400">{t("admin.intent")}</p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{request.intent}</p>
                </div>
                {request.adminNote ? (
                  <div className="mt-3 rounded-2xl bg-amber-50 p-4 text-sm font-semibold text-amber-800">
                    <b>{t("admin.note")}：</b>{request.adminNote}
                  </div>
                ) : null}
              </div>

              <div className="rounded-2xl border border-line p-4">
                <h3 className="font-black text-navy">{t("admin.followUp")}</h3>
                <div className="mt-4 grid gap-3">
                  <textarea
                    value={followUpNote}
                    onChange={(event) => onFollowUpNote(event.target.value)}
                    placeholder={t("admin.followUpNotePlaceholder")}
                    className="field min-h-24 resize-none py-3 text-sm"
                  />
                  <input
                    value={followUpNextStep}
                    onChange={(event) => onFollowUpNextStep(event.target.value)}
                    placeholder={t("admin.nextStepPlaceholder")}
                    className="field text-sm"
                  />
                  <button
                    type="button"
                    disabled={!canAddFollowUp}
                    onClick={onAddFollowUp}
                    className="inline-flex h-10 w-fit items-center gap-2 rounded-xl bg-navy px-4 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus className="h-4 w-4" />
                    {t("admin.addFollowUp")}
                  </button>
                </div>

                <div className="mt-5 grid gap-3">
                  {request.followUps?.length ? (
                    request.followUps.map((followUp) => (
                      <div key={followUp.id} className="rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <b className="text-sm text-slate-800">{followUp.authorName}</b>
                          <span className="text-xs font-semibold text-slate-400">{formatDate(followUp.createdAt)}</span>
                        </div>
                        <p className="mt-2 text-sm font-semibold leading-6 text-slate-700">{followUp.note}</p>
                        {followUp.nextStep ? (
                          <p className="mt-2 text-xs font-black text-teal-700">{t("admin.nextStep")}：{followUp.nextStep}</p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <p className="rounded-2xl bg-slate-50 p-4 text-sm font-semibold text-slate-500">{t("admin.noFollowUps")}</p>
                  )}
                </div>
              </div>
            </div>

            <aside className="grid gap-4">
              <ContactBlock title={t("admin.applicantContact")} contact={request.applicantContact} />
              <ContactBlock title={t("admin.resourceContact")} contact={request.resource.contact} />

              <div className="rounded-2xl border border-line p-4">
                <h3 className="font-black text-navy">{t("admin.note")}</h3>
                <textarea
                  value={note}
                  onChange={(event) => onNote(event.target.value)}
                  placeholder={t("admin.notePlaceholder")}
                  className="field mt-3 min-h-28 resize-none py-3 text-sm"
                />
                <div className="mt-4 flex flex-wrap gap-2">
                  <ActionButton label={t("common.approve")} tone="green" onClick={onApprove} />
                  <ActionButton label={t("admin.openContact")} tone="green" onClick={onUnlock} />
                  <ActionButton label={t("common.reject")} tone="red" onClick={onReject} />
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactBlock({ title, contact }: { title: string; contact?: ResourceRecord["contact"] }) {
  const { t } = useI18n();
  const contactRows: Array<[string, string | undefined]> = [
    [t("forms.email"), contact?.email],
    [t("forms.phone"), contact?.phone],
    [t("forms.telegram"), contact?.telegram],
    [t("forms.whatsapp"), contact?.whatsapp],
    [t("forms.wechat"), contact?.wechat]
  ];
  const rows = contactRows.filter((row): row is [string, string] => Boolean(row[1]));

  return (
    <div className="rounded-2xl border border-line p-4">
      <h3 className="font-black text-navy">{title}</h3>
      <div className="mt-4 grid gap-2">
        {rows.length ? (
          rows.map(([label, value]) => (
            <div key={label} className="flex items-start justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2 text-sm">
              <span className="font-black text-slate-500">{label}</span>
              <span className="break-all text-right font-semibold text-slate-800">{value}</span>
            </div>
          ))
        ) : (
          <p className="rounded-xl bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-500">-</p>
        )}
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2">
      <p className="text-xs font-black text-slate-400">{label}</p>
      <div className="mt-1 text-sm font-semibold text-slate-800">{value || "-"}</div>
    </div>
  );
}

function formatDate(value?: string) {
  return value ? new Date(value).toLocaleString() : "-";
}

function StatsGrid({ stats }: { stats: AdminStats }) {
  const { t } = useI18n();
  const items = [
    [t("admin.pending"), stats.pendingResources],
    [t("admin.approved"), stats.approvedResources],
    [t("admin.demandReview"), stats.pendingDemands],
    [t("admin.matchReview"), stats.pendingMatches],
    [t("admin.licenseReview"), stats.pendingLicenses],
    [t("admin.pendingVerifications"), stats.pendingVerifications],
    [t("admin.totalUsers"), stats.users],
    [t("admin.auditLog"), stats.auditLogs]
  ];

  return (
    <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label as string} className="panel p-5">
          <small className="text-xs font-bold text-slate-500">{label as string}</small>
          <b className="mt-2 block text-3xl font-black">{value as number}</b>
        </div>
      ))}
    </div>
  );
}

function SectionTitle({ title }: { title: string }) {
  return <h2 className="bg-slate-50 px-4 py-3 text-sm font-black text-slate-700">{title}</h2>;
}

function ReviewPanel({ title, empty, children }: { title: string; empty: boolean; children: React.ReactNode }) {
  return (
    <section className="panel mt-6 overflow-hidden">
      <SectionTitle title={title} />
      {empty ? <EmptyState /> : children}
    </section>
  );
}

function ReviewItem({
  title,
  meta,
  status,
  note,
  notePlaceholder,
  onNote,
  actions
}: {
  title: string;
  meta: string;
  status: React.ReactNode;
  note: string;
  notePlaceholder: string;
  onNote: (value: string) => void;
  actions: React.ReactNode;
}) {
  const { t, tArray } = useI18n();
  const noteTemplates = tArray("admin.noteTemplates");
  return (
    <div className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1.5fr_1.3fr_120px_1.6fr_260px] lg:items-center">
      <b>{title}</b>
      <span className="text-slate-500">{meta}</span>
      <span>{status}</span>
      <label className="grid gap-1">
        <span className="text-xs font-black text-slate-400">{t("admin.note")}</span>
        <textarea
          value={note}
          onChange={(event) => onNote(event.target.value)}
          placeholder={notePlaceholder}
          className="field min-h-16 w-full resize-none py-2 text-xs"
        />
        <div className="flex flex-wrap gap-1">
          {noteTemplates.map((template) => (
            <button
              key={template}
              type="button"
              onClick={() => onNote(template)}
              className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-black text-slate-500 hover:bg-slate-200"
            >
              {template}
            </button>
          ))}
        </div>
      </label>
      <div className="flex flex-wrap gap-2">{actions}</div>
    </div>
  );
}

function paginate<T>(items: T[], page: number, pageSize: number) {
  const safePage = Math.max(page, 1);
  return items.slice((safePage - 1) * pageSize, safePage * pageSize);
}

function PageControls({
  total,
  page,
  pageSize,
  onPage
}: {
  total: number;
  page: number;
  pageSize: number;
  onPage: (page: number) => void;
}) {
  const { t } = useI18n();
  const totalPages = Math.max(Math.ceil(total / pageSize), 1);

  if (total <= pageSize) return null;

  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs font-black text-slate-500">
      <span>{t("admin.pageSummary", { page, totalPages, total })}</span>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => onPage(Math.max(page - 1, 1))}
          className="rounded-xl border border-line bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("admin.prevPage")}
        </button>
        <button
          type="button"
          disabled={page >= totalPages}
          onClick={() => onPage(Math.min(page + 1, totalPages))}
          className="rounded-xl border border-line bg-white px-3 py-2 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("admin.nextPage")}
        </button>
      </div>
    </div>
  );
}

function ActionButton({
  label,
  tone,
  onClick,
  icon
}: {
  label: string;
  tone: "green" | "red" | "blue" | "gold";
  onClick: () => void;
  icon?: React.ReactNode;
}) {
  const toneClass = {
    green: "bg-emerald-50 text-emerald-700",
    red: "bg-rose-50 text-rose-700",
    blue: "bg-sky-50 text-sky-700",
    gold: "bg-yellow-50 text-yellow-700"
  }[tone];

  return (
    <button type="button" onClick={onClick} className={`inline-flex h-9 items-center gap-1.5 rounded-xl px-3 text-xs font-black ${toneClass}`}>
      {icon ?? (tone === "red" ? <X className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />)}
      {label}
    </button>
  );
}

function AuditRow({ log }: { log: AuditLogRecord }) {
  return (
    <div className="grid gap-3 border-t border-slate-100 p-4 text-sm lg:grid-cols-[1fr_1fr_1fr]">
      <span className="font-black">{log.action}</span>
      <span className="text-slate-500">{log.targetType} · {log.note ?? log.targetTitle}</span>
      <span className="text-slate-500">{new Date(log.createdAt).toLocaleString()}</span>
    </div>
  );
}

function EmptyState() {
  const { t } = useI18n();
  return <div className="p-8 text-center text-sm font-semibold text-slate-500">{t("admin.noPending")}</div>;
}
