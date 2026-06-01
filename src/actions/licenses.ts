"use server";

import { AuditTargetType, LicenseApplicationStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { mapLicenseApplication } from "@/lib/db-mappers";
import { actionError, type ActionResult } from "./types";
import { writeAuditLog } from "./audit";

type LicenseApplicationInput = {
  name: string;
  country: string;
  city?: string;
  companyName?: string;
  channelInfo?: string;
  capitalAbility?: string;
  cooperationType: string;
  hasWarehouse?: boolean;
  hasStore?: boolean;
  hasTeam?: boolean;
  contactEmail?: string;
  contactPhone?: string;
  contactTelegram?: string;
  contactWhatsapp?: string;
  contactWechat?: string;
  note?: string;
};

type LicenseReviewStatus = "pending" | "contacted" | "approved" | "rejected" | "needs_more_info";

const statusMap: Record<LicenseReviewStatus, LicenseApplicationStatus> = {
  pending: LicenseApplicationStatus.PENDING,
  contacted: LicenseApplicationStatus.CONTACTED,
  approved: LicenseApplicationStatus.APPROVED,
  rejected: LicenseApplicationStatus.REJECTED,
  needs_more_info: LicenseApplicationStatus.NEEDS_MORE_INFO
};

function normalizeOptional(value?: string) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function validateLicenseApplication(input: LicenseApplicationInput) {
  if (!input.name?.trim()) throw new Error("请填写申请人姓名。");
  if (!input.country?.trim()) throw new Error("请填写合作国家。");
  if (!input.cooperationType?.trim()) throw new Error("请填写期望合作方式。");
}

export async function createLicenseApplication(input: LicenseApplicationInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    validateLicenseApplication(input);

    const application = await prisma.licenseApplication.create({
      data: {
        userId: user.id,
        name: input.name.trim(),
        country: input.country.trim(),
        city: normalizeOptional(input.city),
        companyName: normalizeOptional(input.companyName),
        channelInfo: normalizeOptional(input.channelInfo),
        capitalAbility: normalizeOptional(input.capitalAbility),
        cooperationType: input.cooperationType.trim(),
        hasWarehouse: Boolean(input.hasWarehouse),
        hasStore: Boolean(input.hasStore),
        hasTeam: Boolean(input.hasTeam),
        contactEmail: normalizeOptional(input.contactEmail) ?? user.email,
        contactPhone: normalizeOptional(input.contactPhone) ?? user.phone,
        contactTelegram: normalizeOptional(input.contactTelegram) ?? user.telegram,
        contactWhatsapp: normalizeOptional(input.contactWhatsapp) ?? user.whatsapp,
        contactWechat: normalizeOptional(input.contactWechat) ?? user.wechat,
        note: normalizeOptional(input.note),
        status: LicenseApplicationStatus.PENDING
      },
      select: { id: true }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: application };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMyLicenseApplications() {
  const user = await requireUser();
  const applications = await prisma.licenseApplication.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" }
  });
  return applications.map(mapLicenseApplication);
}

export async function adminReviewLicenseApplication(
  id: string,
  status: LicenseReviewStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const application = await prisma.licenseApplication.update({
      where: { id },
      data: {
        status: statusMap[status],
        adminNote: note?.trim() || null
      },
      select: { id: true }
    });

    await writeAuditLog({
      adminId: admin.id,
      targetType: AuditTargetType.LICENSE_APPLICATION,
      targetId: id,
      action: `review_license_application:${status}`,
      note
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true, data: application };
  } catch (error) {
    return actionError(error);
  }
}
