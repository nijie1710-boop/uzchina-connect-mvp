"use server";

import { AuditTargetType, ResourceStatus, ResourceType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, requireAdmin, requireUser } from "@/lib/session";
import { mapMatchRequest, mapResource } from "@/lib/db-mappers";
import { actionError, type ActionResult } from "./types";
import { writeAuditLog } from "./audit";

type ResourceInput = {
  type?: "supplier" | "buyer" | "qualification" | "channel";
  title: string;
  description: string;
  country: string;
  city?: string;
  category: string;
  cooperationMode?: string;
  budgetRange?: string;
  longTerm?: boolean;
  hasBusinessLicense?: boolean;
  hasQualification?: boolean;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTelegram?: string;
  contactWhatsapp?: string;
  contactWechat?: string;
};

type ResourceFilters = {
  search?: string;
  country?: string;
  city?: string;
  category?: string;
  type?: string;
};

type ResourceReviewStatus = "pending" | "approved" | "rejected" | "needs_more_info" | "featured" | "high_risk";

const typeMap: Record<NonNullable<ResourceInput["type"]>, ResourceType> = {
  supplier: ResourceType.SUPPLIER,
  buyer: ResourceType.BUYER,
  qualification: ResourceType.QUALIFICATION,
  channel: ResourceType.CHANNEL
};

const statusMap: Record<ResourceReviewStatus, ResourceStatus> = {
  pending: ResourceStatus.PENDING,
  approved: ResourceStatus.APPROVED,
  rejected: ResourceStatus.REJECTED,
  needs_more_info: ResourceStatus.NEEDS_MORE_INFO,
  featured: ResourceStatus.FEATURED,
  high_risk: ResourceStatus.HIGH_RISK
};

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function validateResource(input: ResourceInput) {
  if (!input.title?.trim()) throw new Error("请填写资源标题。");
  if (!input.description?.trim()) throw new Error("请填写资源说明。");
  if (!input.country?.trim()) throw new Error("请填写国家。");
  if (!input.category?.trim()) throw new Error("请填写行业分类。");
}

export async function createResource(input: ResourceInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    validateResource(input);

    const resource = await prisma.resource.create({
      data: {
        userId: user.id,
        type: input.type ? typeMap[input.type] : ResourceType.SUPPLIER,
        title: input.title.trim(),
        description: input.description.trim(),
        country: input.country.trim(),
        city: normalizeOptional(input.city),
        category: input.category.trim(),
        cooperationMode: normalizeOptional(input.cooperationMode),
        budgetRange: normalizeOptional(input.budgetRange),
        longTerm: Boolean(input.longTerm),
        hasBusinessLicense: Boolean(input.hasBusinessLicense),
        hasQualification: Boolean(input.hasQualification),
        contactName: normalizeOptional(input.contactName),
        contactEmail: normalizeOptional(input.contactEmail),
        contactPhone: normalizeOptional(input.contactPhone),
        contactTelegram: normalizeOptional(input.contactTelegram),
        contactWhatsapp: normalizeOptional(input.contactWhatsapp),
        contactWechat: normalizeOptional(input.contactWechat),
        status: ResourceStatus.PENDING
      },
      select: { id: true }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: resource };
  } catch (error) {
    return actionError(error);
  }
}

export async function getApprovedResources(filters: ResourceFilters = {}) {
  const search = filters.search?.trim();
  const type = filters.type && filters.type in typeMap ? typeMap[filters.type as keyof typeof typeMap] : undefined;

  const resources = await prisma.resource.findMany({
    where: {
      AND: [
        {
          OR: [
            { status: { in: [ResourceStatus.APPROVED, ResourceStatus.FEATURED] } },
            { isFeatured: true }
          ]
        },
        type ? { type } : {},
        filters.country ? { country: { contains: filters.country, mode: "insensitive" } } : {},
        filters.city ? { city: { contains: filters.city, mode: "insensitive" } } : {},
        filters.category ? { category: { contains: filters.category, mode: "insensitive" } } : {},
        search
          ? {
              OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { category: { contains: search, mode: "insensitive" } },
                { country: { contains: search, mode: "insensitive" } },
                { city: { contains: search, mode: "insensitive" } }
              ]
            }
          : {}
      ]
    },
    include: { user: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }]
  });

  return resources.map((resource) => mapResource(resource, { includeContact: false }));
}

export async function getResourceDetail(id: string) {
  const user = await getCurrentUser();
  const resource = await prisma.resource.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true, email: true, companyName: true } } }
  });

  if (!resource) return null;
  const isOwner = user?.id === resource.userId;
  const isAdmin = user?.role === "ADMIN";
  const isPublic = resource.status === ResourceStatus.APPROVED || resource.status === ResourceStatus.FEATURED || resource.isFeatured;
  if (!isPublic && !isOwner && !isAdmin) return null;

  if (isPublic) {
    await prisma.resource.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    resource.viewCount += 1;
  }

  const matchRequest = user
    ? await prisma.matchRequest.findUnique({
        where: { resourceId_requesterId: { resourceId: id, requesterId: user.id } },
        include: { requester: { select: { id: true, name: true, email: true, companyName: true } } }
      })
    : null;

  const contactUnlocked = Boolean(isOwner || isAdmin || matchRequest?.status === "CONTACT_UNLOCKED");

  return {
    resource: mapResource(resource, { includeContact: contactUnlocked }),
    matchRequest: matchRequest ? mapMatchRequest(matchRequest) : null,
    contactUnlocked,
    isAuthenticated: Boolean(user)
  };
}

export async function getMyResources() {
  const user = await requireUser();
  const resources = await prisma.resource.findMany({
    where: { userId: user.id },
    include: { user: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: { createdAt: "desc" }
  });
  return resources.map((resource) => mapResource(resource, { includeContact: true }));
}

export async function updateMyResource(id: string, input: ResourceInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    validateResource(input);
    const existing = await prisma.resource.findFirst({ where: { id, userId: user.id }, select: { id: true } });
    if (!existing) throw new Error("资源不存在或无权编辑。");

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        type: input.type ? typeMap[input.type] : undefined,
        title: input.title.trim(),
        description: input.description.trim(),
        country: input.country.trim(),
        city: normalizeOptional(input.city),
        category: input.category.trim(),
        cooperationMode: normalizeOptional(input.cooperationMode),
        budgetRange: normalizeOptional(input.budgetRange),
        longTerm: Boolean(input.longTerm),
        hasBusinessLicense: Boolean(input.hasBusinessLicense),
        hasQualification: Boolean(input.hasQualification),
        contactName: normalizeOptional(input.contactName),
        contactEmail: normalizeOptional(input.contactEmail),
        contactPhone: normalizeOptional(input.contactPhone),
        contactTelegram: normalizeOptional(input.contactTelegram),
        contactWhatsapp: normalizeOptional(input.contactWhatsapp),
        contactWechat: normalizeOptional(input.contactWechat),
        status: ResourceStatus.PENDING,
        isFeatured: false,
        adminNote: null
      },
      select: { id: true }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    revalidatePath(`/resources/${id}`);
    return { ok: true, data: resource };
  } catch (error) {
    return actionError(error);
  }
}

export async function adminReviewResource(
  id: string,
  status: ResourceReviewStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const resource = await prisma.resource.update({
      where: { id },
      data: {
        status: statusMap[status],
        isFeatured: status === "featured",
        adminNote: note?.trim() || null
      },
      select: { id: true }
    });

    await writeAuditLog({
      adminId: admin.id,
      targetType: AuditTargetType.RESOURCE,
      targetId: id,
      action: `review_resource:${status}`,
      note
    });

    revalidatePath("/resources");
    revalidatePath(`/resources/${id}`);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true, data: resource };
  } catch (error) {
    return actionError(error);
  }
}
