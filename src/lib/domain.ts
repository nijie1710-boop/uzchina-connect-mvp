export type SubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "needs_more_info"
  | "featured"
  | "high_risk"
  | "contacted";

export type MatchRequestStatus = "pending" | "approved" | "rejected" | "contact_unlocked";

export type ContactProfile = {
  phone?: string;
  email?: string;
  telegram?: string;
  whatsapp?: string;
  wechat?: string;
};

export type LocalizedRecord = {
  titleKey?: string;
  title?: string;
  descriptionKey?: string;
  description?: string;
  categoryKey?: string;
  category?: string;
  countryKey?: string;
  country?: string;
  cityKey?: string;
  city?: string;
};

export type ResourceRecord = LocalizedRecord & {
  id: string;
  ownerId: string;
  ownerNameKey?: string;
  ownerName?: string;
  cooperationKey?: string;
  cooperation?: string;
  targetKey?: string;
  target?: string;
  advantagesKey?: string;
  advantages?: string[];
  documentsKey?: string;
  documents?: string[];
  status: SubmissionStatus;
  gradient: string;
  views: number;
  matchCount: number;
  completeness: number;
  contact: ContactProfile;
  createdAt: string;
};

export type DemandRecord = LocalizedRecord & {
  id: string;
  userId: string;
  budget?: string;
  cooperation?: string;
  urgency?: string;
  status: SubmissionStatus;
  createdAt: string;
};

export type MatchRequestRecord = {
  id: string;
  resourceId: string;
  applicantId: string;
  applicantNameKey?: string;
  applicantName?: string;
  intent: string;
  status: MatchRequestStatus;
  createdAt: string;
};

export type LicenseApplicationRecord = {
  id: string;
  userId: string;
  applicantNameKey?: string;
  applicantName?: string;
  country?: string;
  countryKey?: string;
  city?: string;
  cityKey?: string;
  partnershipKey?: string;
  partnership?: string;
  contact: string;
  status: SubmissionStatus;
  createdAt: string;
};

export type AuditLogRecord = {
  id: string;
  adminName: string;
  action: string;
  targetType: "Resource" | "Demand" | "MatchRequest" | "LicenseApplication" | "Verification";
  targetId: string;
  targetTitle: string;
  fromStatus?: string;
  toStatus?: string;
  note?: string;
  createdAt: string;
};

export type CurrentUser = {
  id: string;
  nameKey?: string;
  name?: string;
  companyKey?: string;
  company?: string;
  email: string;
  role: "user" | "admin";
  verificationStatus: SubmissionStatus;
  contact: ContactProfile;
};

export type ResourceFormInput = {
  title: string;
  category: string;
  country: string;
  city: string;
  cooperation: string;
  description: string;
  contactName: string;
  contact: ContactProfile;
};

export type DemandFormInput = {
  title: string;
  category: string;
  country: string;
  city: string;
  budget: string;
  cooperation: string;
  description: string;
};

export type LicenseFormInput = {
  applicantName: string;
  country: string;
  city: string;
  partnership: string;
  contact: string;
};

export type WorkflowState = {
  currentUser: CurrentUser;
  resources: ResourceRecord[];
  demands: DemandRecord[];
  matchRequests: MatchRequestRecord[];
  licenseApplications: LicenseApplicationRecord[];
  auditLogs: AuditLogRecord[];
};

export type Translate = (path: string) => string;
export type TranslateArray = (path: string) => string[];

export function statusLabel(status: SubmissionStatus, t: Translate) {
  const map: Record<SubmissionStatus, string> = {
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
    needs_more_info: t("common.needsMoreInfo"),
    featured: t("common.featured"),
    high_risk: t("common.highRisk"),
    contacted: t("common.contacted")
  };
  return map[status];
}

export function matchStatusLabel(status: MatchRequestStatus, t: Translate) {
  const map: Record<MatchRequestStatus, string> = {
    pending: t("common.pending"),
    approved: t("common.approved"),
    rejected: t("common.rejected"),
    contact_unlocked: t("detail.contactUnlocked")
  };
  return map[status];
}

export function readText(value: string | undefined, key: string | undefined, t: Translate) {
  return value ?? (key ? t(key) : "");
}

export function resourceTitle(resource: ResourceRecord, t: Translate) {
  return readText(resource.title, resource.titleKey, t);
}

export function resourceDescription(resource: ResourceRecord, t: Translate) {
  return readText(resource.description, resource.descriptionKey, t);
}

export function resourceLocation(resource: ResourceRecord, t: Translate) {
  const country = readText(resource.country, resource.countryKey, t);
  const city = readText(resource.city, resource.cityKey, t);
  return city ? `${country} · ${city}` : country;
}

export function localizedCategory(record: LocalizedRecord, t: Translate) {
  return readText(record.category, record.categoryKey, t);
}

export function localizedOwner(resource: ResourceRecord, t: Translate) {
  return readText(resource.ownerName, resource.ownerNameKey, t);
}

export function localizedAdvantages(resource: ResourceRecord, tArray: TranslateArray) {
  return resource.advantages ?? (resource.advantagesKey ? tArray(resource.advantagesKey) : []);
}

export function localizedDocuments(resource: ResourceRecord, tArray: TranslateArray) {
  return resource.documents ?? (resource.documentsKey ? tArray(resource.documentsKey) : []);
}
