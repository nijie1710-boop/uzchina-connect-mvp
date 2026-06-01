"use server";

import { AuditTargetType, ReviewStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { mapDemand } from "@/lib/db-mappers";
import { actionError, type ActionResult } from "./types";
import { writeAuditLog } from "./audit";

type DemandInput = {
  title: string;
  description: string;
  country: string;
  city?: string;
  category: string;
  budgetRange?: string;
  cooperationMode?: string;
  urgency?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  contactTelegram?: string;
  contactWhatsapp?: string;
  contactWechat?: string;
};

type DemandReviewStatus = "pending" | "approved" | "rejected" | "needs_more_info";

const statusMap: Record<DemandReviewStatus, ReviewStatus> = {
  pending: ReviewStatus.PENDING,
  approved: ReviewStatus.APPROVED,
  rejected: ReviewStatus.REJECTED,
  needs_more_info: ReviewStatus.NEEDS_MORE_INFO
};

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function validateDemand(input: DemandInput) {
  if (!input.title?.trim()) throw new Error("请填写需求标题。");
  if (!input.description?.trim()) throw new Error("请填写需求说明。");
  if (!input.country?.trim()) throw new Error("请填写目标国家。");
  if (!input.category?.trim()) throw new Error("请填写行业分类。");
}

export async function createDemand(input: DemandInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    validateDemand(input);

    const demand = await prisma.demand.create({
      data: {
        userId: user.id,
        title: input.title.trim(),
        description: input.description.trim(),
        country: input.country.trim(),
        city: normalizeOptional(input.city),
        category: input.category.trim(),
        budgetRange: normalizeOptional(input.budgetRange),
        cooperationMode: normalizeOptional(input.cooperationMode),
        urgency: normalizeOptional(input.urgency),
        contactName: normalizeOptional(input.contactName) ?? user.name,
        contactEmail: normalizeOptional(input.contactEmail) ?? user.email,
        contactPhone: normalizeOptional(input.contactPhone) ?? user.phone,
        contactTelegram: normalizeOptional(input.contactTelegram) ?? user.telegram,
        contactWhatsapp: normalizeOptional(input.contactWhatsapp) ?? user.whatsapp,
        contactWechat: normalizeOptional(input.contactWechat) ?? user.wechat,
        status: ReviewStatus.PENDING
      },
      select: { id: true }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: demand };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMyDemands() {
  const user = await requireUser();
  const demands = await prisma.demand.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return demands.map(mapDemand);
}

export async function adminReviewDemand(
  id: string,
  status: DemandReviewStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const demand = await prisma.demand.update({
      where: { id },
      data: {
        status: statusMap[status],
        adminNote: note?.trim() || null
      },
      select: { id: true }
    });

    await writeAuditLog({
      adminId: admin.id,
      targetType: AuditTargetType.DEMAND,
      targetId: id,
      action: `review_demand:${status}`,
      note
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true, data: demand };
  } catch (error) {
    return actionError(error);
  }
}
