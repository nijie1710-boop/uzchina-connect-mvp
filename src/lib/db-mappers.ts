import type {
  AuditLogRecord,
  AdminUserRecord,
  DemandRecord,
  LicenseApplicationRecord,
  MatchRequestRecord,
  ResourceRecord,
  SubmissionStatus,
  VerificationRecord
} from "./domain";

type DbUserBrief = {
  id: string;
  name: string | null;
  email: string;
  companyName: string | null;
  role?: string;
  verifyStatus?: string;
  phone?: string | null;
  telegram?: string | null;
  whatsapp?: string | null;
  wechat?: string | null;
  country?: string | null;
  city?: string | null;
  createdAt?: Date;
};

type DbResource = {
  id: string;
  userId: string;
  user?: DbUserBrief;
  type: string;
  title: string;
  description: string;
  country: string;
  city: string | null;
  category: string;
  cooperationMode: string | null;
  budgetRange: string | null;
  longTerm: boolean;
  hasBusinessLicense: boolean;
  hasQualification: boolean;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
  contactWechat: string | null;
  status: string;
  isFeatured: boolean;
  adminNote?: string | null;
  viewCount: number;
  matchCount: number;
  createdAt: Date;
};

type DbDemand = {
  id: string;
  userId: string;
  title: string;
  description: string;
  country: string;
  city: string | null;
  category: string;
  budgetRange: string | null;
  cooperationMode: string | null;
  urgency: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: Date;
};

type DbMatchRequest = {
  id: string;
  resourceId: string;
  requesterId: string;
  requester?: DbUserBrief;
  resource?: DbResource;
  message: string;
  status: string;
  adminNote?: string | null;
  createdAt: Date;
};

type DbLicenseApplication = {
  id: string;
  userId: string;
  name: string;
  country: string;
  city: string | null;
  companyName?: string | null;
  cooperationType: string;
  contactEmail: string | null;
  contactPhone: string | null;
  contactTelegram: string | null;
  contactWhatsapp: string | null;
  contactWechat: string | null;
  note?: string | null;
  status: string;
  adminNote?: string | null;
  createdAt: Date;
};

type DbVerification = {
  id: string;
  userId: string;
  user?: DbUserBrief;
  type: string;
  documentUrl: string | null;
  status: string;
  adminNote: string | null;
  reviewedAt: Date | null;
  createdAt: Date;
};

type DbAuditLog = {
  id: string;
  action: string;
  targetType: string;
  targetId: string;
  note: string | null;
  createdAt: Date;
  admin?: DbUserBrief;
};

const gradients = [
  "linear-gradient(135deg,#071B39,#0E3A6F,#8A672D)",
  "linear-gradient(135deg,#E6F0FF,#176293,#082A57)",
  "linear-gradient(135deg,#ECFDF5,#0F766E,#064E3B)",
  "linear-gradient(135deg,#F1F5F9,#64748B,#0F172A)",
  "linear-gradient(135deg,#FFFBEB,#D6A84F,#7C4A03)"
];

export function enumToValue(value: string) {
  return value.toLowerCase();
}

function resourceStatus(resource: DbResource): SubmissionStatus {
  if (resource.isFeatured || resource.status === "FEATURED") return "featured";
  return enumToValue(resource.status) as SubmissionStatus;
}

function gradientFor(id: string) {
  const index = [...id].reduce((sum, char) => sum + char.charCodeAt(0), 0) % gradients.length;
  return gradients[index];
}

function ownerName(user?: DbUserBrief) {
  if (!user) return "";
  return user.companyName ?? user.name ?? user.email;
}

export function mapResource(resource: DbResource, options: { includeContact?: boolean } = {}): ResourceRecord {
  const advantages = [
    resource.longTerm ? "长期合作意向" : "单次项目可沟通",
    resource.hasBusinessLicense ? "营业执照已提交" : "平台人工初审",
    resource.hasQualification ? "资质资料已提交" : "资质待补充"
  ];

  const documents = [
    resource.hasBusinessLicense ? "营业执照" : "企业资料",
    resource.hasQualification ? "许可证 / 资质证明" : "平台审核记录",
    "联系方式托管"
  ];

  return {
    id: resource.id,
    ownerId: resource.userId,
    ownerName: ownerName(resource.user),
    type: enumToValue(resource.type),
    title: resource.title,
    description: resource.description,
    category: resource.category,
    country: resource.country,
    city: resource.city ?? "",
    cooperation: resource.cooperationMode ?? "",
    target: resource.budgetRange ?? resource.type,
    advantages,
    documents,
    status: resourceStatus(resource),
    gradient: gradientFor(resource.id),
    views: resource.viewCount,
    matchCount: resource.matchCount,
    completeness: [resource.title, resource.description, resource.category, resource.country, resource.contactName].filter(Boolean)
      .length * 18,
    contact: options.includeContact
      ? {
          phone: resource.contactPhone ?? undefined,
          email: resource.contactEmail ?? undefined,
          telegram: resource.contactTelegram ?? undefined,
          whatsapp: resource.contactWhatsapp ?? undefined,
          wechat: resource.contactWechat ?? undefined
        }
      : {},
    adminNote: resource.adminNote ?? undefined,
    createdAt: resource.createdAt.toISOString()
  };
}

export function mapDemand(demand: DbDemand): DemandRecord {
  return {
    id: demand.id,
    userId: demand.userId,
    title: demand.title,
    description: demand.description,
    category: demand.category,
    country: demand.country,
    city: demand.city ?? "",
    budget: demand.budgetRange ?? "",
    cooperation: demand.cooperationMode ?? "",
    urgency: demand.urgency ?? "",
    status: enumToValue(demand.status) as SubmissionStatus,
    adminNote: demand.adminNote ?? undefined,
    createdAt: demand.createdAt.toISOString()
  };
}

export function mapMatchRequest(request: DbMatchRequest): MatchRequestRecord {
  return {
    id: request.id,
    resourceId: request.resourceId,
    applicantId: request.requesterId,
    applicantName: ownerName(request.requester),
    intent: request.message,
    status: enumToValue(request.status) as MatchRequestRecord["status"],
    adminNote: request.adminNote ?? undefined,
    resourceTitle: request.resource?.title,
    createdAt: request.createdAt.toISOString()
  };
}

export function mapLicenseApplication(application: DbLicenseApplication): LicenseApplicationRecord {
  const contact = [
    application.contactEmail,
    application.contactPhone,
    application.contactTelegram,
    application.contactWhatsapp,
    application.contactWechat
  ]
    .filter(Boolean)
    .join(" / ");

  return {
    id: application.id,
    userId: application.userId,
    applicantName: application.name,
    country: application.country,
    city: application.city ?? "",
    companyName: application.companyName ?? undefined,
    partnership: application.cooperationType,
    contact,
    status: enumToValue(application.status) as SubmissionStatus,
    adminNote: application.adminNote ?? undefined,
    note: application.note ?? undefined,
    createdAt: application.createdAt.toISOString()
  };
}

export function mapVerification(verification: DbVerification): VerificationRecord {
  return {
    id: verification.id,
    userId: verification.userId,
    userName: ownerName(verification.user),
    type: enumToValue(verification.type),
    documentUrl: verification.documentUrl ?? undefined,
    status: enumToValue(verification.status) as SubmissionStatus,
    adminNote: verification.adminNote ?? undefined,
    reviewedAt: verification.reviewedAt?.toISOString(),
    createdAt: verification.createdAt.toISOString()
  };
}

export function mapAdminUser(user: DbUserBrief): AdminUserRecord {
  return {
    id: user.id,
    name: user.name ?? undefined,
    email: user.email,
    phone: user.phone ?? undefined,
    telegram: user.telegram ?? undefined,
    whatsapp: user.whatsapp ?? undefined,
    wechat: user.wechat ?? undefined,
    country: user.country ?? undefined,
    city: user.city ?? undefined,
    companyName: user.companyName ?? undefined,
    role: user.role ? enumToValue(user.role) : "",
    verifyStatus: user.verifyStatus ? enumToValue(user.verifyStatus) : "",
    createdAt: user.createdAt ? user.createdAt.toISOString() : ""
  };
}

export function mapAuditLog(log: DbAuditLog): AuditLogRecord {
  return {
    id: log.id,
    adminName: ownerName(log.admin) || "Admin",
    action: log.action,
    targetType: targetTypeLabel(log.targetType),
    targetId: log.targetId,
    targetTitle: log.note ?? log.targetId,
    note: log.note ?? undefined,
    createdAt: log.createdAt.toISOString()
  };
}

function targetTypeLabel(targetType: string): AuditLogRecord["targetType"] {
  const map: Record<string, AuditLogRecord["targetType"]> = {
    RESOURCE: "Resource",
    DEMAND: "Demand",
    MATCH_REQUEST: "MatchRequest",
    LICENSE_APPLICATION: "LicenseApplication",
    VERIFICATION: "Verification",
    USER: "Verification"
  };
  return map[targetType] ?? "Verification";
}
