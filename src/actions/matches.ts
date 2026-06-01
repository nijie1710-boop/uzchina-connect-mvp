"use server";

import { AuditTargetType, MatchRequestStatus, ResourceStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireUser } from "@/lib/session";
import { mapMatchRequest } from "@/lib/db-mappers";
import { actionError, type ActionResult } from "./types";
import { writeAuditLog } from "./audit";

type MatchReviewStatus = "pending" | "approved" | "rejected" | "contact_unlocked";

const statusMap: Record<MatchReviewStatus, MatchRequestStatus> = {
  pending: MatchRequestStatus.PENDING,
  approved: MatchRequestStatus.APPROVED,
  rejected: MatchRequestStatus.REJECTED,
  contact_unlocked: MatchRequestStatus.CONTACT_UNLOCKED
};

export async function createMatchRequest(
  resourceId: string,
  message: string
): Promise<ActionResult<{ id: string; status: string }>> {
  try {
    const user = await requireUser();
    const resource = await prisma.resource.findUnique({
      where: { id: resourceId },
      select: { id: true, userId: true, status: true, isFeatured: true }
    });
    if (!resource) throw new Error("资源不存在。");
    if (resource.userId === user.id) throw new Error("不能对自己发布的资源申请对接。");
    if (resource.status !== ResourceStatus.APPROVED && resource.status !== ResourceStatus.FEATURED && !resource.isFeatured) {
      throw new Error("该资源尚未通过审核，暂不能申请对接。");
    }

    const existing = await prisma.matchRequest.findUnique({
      where: { resourceId_requesterId: { resourceId, requesterId: user.id } },
      select: { id: true, status: true }
    });
    if (existing) return { ok: true, data: { id: existing.id, status: existing.status.toLowerCase() } };

    const created = await prisma.$transaction(async (tx) => {
      const request = await tx.matchRequest.create({
        data: {
          resourceId,
          requesterId: user.id,
          message: message.trim() || "希望申请对接该资源。"
        },
        select: { id: true, status: true }
      });
      await tx.resource.update({
        where: { id: resourceId },
        data: { matchCount: { increment: 1 } }
      });
      return request;
    });

    revalidatePath(`/resources/${resourceId}`);
    revalidatePath("/dashboard");
    revalidatePath("/admin");
    return { ok: true, data: { id: created.id, status: created.status.toLowerCase() } };
  } catch (error) {
    return actionError(error);
  }
}

export async function getMyMatchRequests() {
  const user = await requireUser();
  const requests = await prisma.matchRequest.findMany({
    where: { requesterId: user.id },
    include: { requester: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: { createdAt: "desc" }
  });
  return requests.map(mapMatchRequest);
}

export async function adminReviewMatchRequest(
  id: string,
  status: MatchReviewStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const request = await prisma.matchRequest.update({
      where: { id },
      data: {
        status: statusMap[status],
        adminNote: note?.trim() || null,
        reviewedBy: admin.id,
        reviewedAt: new Date(),
        contactUnlockedAt: status === "contact_unlocked" ? new Date() : null
      },
      select: { id: true, resourceId: true }
    });

    await writeAuditLog({
      adminId: admin.id,
      targetType: AuditTargetType.MATCH_REQUEST,
      targetId: id,
      action: `review_match_request:${status}`,
      note
    });

    revalidatePath(`/resources/${request.resourceId}`);
    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true, data: { id: request.id } };
  } catch (error) {
    return actionError(error);
  }
}

export async function unlockContactForMatchRequest(id: string, note?: string) {
  return adminReviewMatchRequest(id, "contact_unlocked", note);
}
