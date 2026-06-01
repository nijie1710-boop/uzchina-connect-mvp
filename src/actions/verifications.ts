"use server";

import { AuditTargetType, ReviewStatus, VerificationType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { mapVerification } from "@/lib/db-mappers";
import { actionError, type ActionResult } from "./types";
import { writeAuditLog } from "./audit";

type VerificationInput = {
  type: "personal" | "company" | "license";
  documentUrl?: string;
};

type VerificationReviewStatus = "pending" | "approved" | "rejected" | "needs_more_info";

const typeMap: Record<VerificationInput["type"], VerificationType> = {
  personal: VerificationType.PERSONAL,
  company: VerificationType.COMPANY,
  license: VerificationType.LICENSE
};

const statusMap: Record<VerificationReviewStatus, ReviewStatus> = {
  pending: ReviewStatus.PENDING,
  approved: ReviewStatus.APPROVED,
  rejected: ReviewStatus.REJECTED,
  needs_more_info: ReviewStatus.NEEDS_MORE_INFO
};

export async function createVerification(input: VerificationInput): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const verification = await prisma.verification.create({
      data: {
        userId: user.id,
        type: typeMap[input.type],
        documentUrl: input.documentUrl?.trim() || null,
        status: ReviewStatus.PENDING
      },
      select: { id: true }
    });

    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: verification };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMyVerifications() {
  const user = await requireUser();
  const verifications = await prisma.verification.findMany({
    where: { userId: user.id },
    include: { user: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: { createdAt: "desc" }
  });
  return verifications.map(mapVerification);
}

export async function adminReviewVerification(
  id: string,
  status: VerificationReviewStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const verification = await prisma.verification.update({
      where: { id },
      data: {
        status: statusMap[status],
        adminNote: note?.trim() || null,
        reviewedBy: admin.id,
        reviewedAt: new Date()
      },
      select: { id: true, userId: true }
    });

    await writeAuditLog({
      adminId: admin.id,
      targetType: AuditTargetType.VERIFICATION,
      targetId: id,
      action: `review_verification:${status}`,
      note
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: verification.id } };
  } catch (error) {
    return actionError(error);
  }
}
