"use server";

import { AuditTargetType, LicenseApplicationStatus, MatchRequestStatus, ResourceStatus, ReviewStatus, VerifyStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { mapAdminUser, mapAuditLog, mapDemand, mapLicenseApplication, mapMatchRequest, mapResource, mapVerification } from "@/lib/db-mappers";
import { actionError, type ActionResult } from "./types";
import { writeAuditLog } from "./audit";

export async function getAdminDashboardStats() {
  await requireAdmin();
  const [pendingResources, approvedResources, pendingDemands, pendingMatches, pendingLicenses, pendingVerifications, users, auditLogs] =
    await Promise.all([
      prisma.resource.count({
        where: { status: { in: [ResourceStatus.PENDING, ResourceStatus.NEEDS_MORE_INFO, ResourceStatus.HIGH_RISK] } }
      }),
      prisma.resource.count({
        where: { OR: [{ status: { in: [ResourceStatus.APPROVED, ResourceStatus.FEATURED] } }, { isFeatured: true }] }
      }),
      prisma.demand.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.matchRequest.count({ where: { status: MatchRequestStatus.PENDING } }),
      prisma.licenseApplication.count({ where: { status: LicenseApplicationStatus.PENDING } }),
      prisma.verification.count({ where: { status: ReviewStatus.PENDING } }),
      prisma.user.count(),
      prisma.adminAuditLog.count()
    ]);

  return {
    pendingResources,
    approvedResources,
    pendingDemands,
    pendingMatches,
    pendingLicenses,
    pendingVerifications,
    users,
    auditLogs
  };
}

export async function getPendingResources() {
  await requireAdmin();
  const resources = await prisma.resource.findMany({
    where: { status: { in: [ResourceStatus.PENDING, ResourceStatus.NEEDS_MORE_INFO, ResourceStatus.HIGH_RISK] } },
    include: { user: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: { createdAt: "desc" }
  });
  return resources.map((resource) => mapResource(resource, { includeContact: true }));
}

export async function getPendingDemands() {
  await requireAdmin();
  const demands = await prisma.demand.findMany({
    where: { status: { in: [ReviewStatus.PENDING, ReviewStatus.NEEDS_MORE_INFO] } },
    orderBy: { createdAt: "desc" }
  });
  return demands.map(mapDemand);
}

export async function getPendingMatchRequests() {
  await requireAdmin();
  const requests = await prisma.matchRequest.findMany({
    where: { status: { in: [MatchRequestStatus.PENDING, MatchRequestStatus.APPROVED, MatchRequestStatus.CONTACT_UNLOCKED] } },
    include: {
      requester: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          telegram: true,
          whatsapp: true,
          wechat: true,
          companyName: true
        }
      },
      resource: {
        include: { user: { select: { id: true, name: true, email: true, companyName: true } } }
      },
      followUps: {
        include: { author: { select: { id: true, name: true, email: true, companyName: true } } },
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return requests.map((request) => ({
    ...mapMatchRequest(request),
    resource: mapResource(request.resource, { includeContact: true })
  }));
}

export async function getPendingLicenseApplications() {
  await requireAdmin();
  const applications = await prisma.licenseApplication.findMany({
    where: { status: { in: [LicenseApplicationStatus.PENDING, LicenseApplicationStatus.CONTACTED, LicenseApplicationStatus.NEEDS_MORE_INFO] } },
    orderBy: { createdAt: "desc" }
  });
  return applications.map(mapLicenseApplication);
}

export async function getPendingVerifications() {
  await requireAdmin();
  const verifications = await prisma.verification.findMany({
    where: { status: { in: [ReviewStatus.PENDING, ReviewStatus.NEEDS_MORE_INFO] } },
    include: { user: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: { createdAt: "desc" }
  });
  return verifications.map(mapVerification);
}

export async function getAdminUsers() {
  await requireAdmin();
  const users = await prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      telegram: true,
      whatsapp: true,
      wechat: true,
      country: true,
      city: true,
      companyName: true,
      role: true,
      verifyStatus: true,
      createdAt: true
    },
    orderBy: { createdAt: "desc" },
    take: 100
  });
  return users.map(mapAdminUser);
}

type UserVerifyStatus = "unverified" | "pending" | "verified" | "rejected" | "needs_more_info";

const verifyStatusMap: Record<UserVerifyStatus, VerifyStatus> = {
  unverified: VerifyStatus.UNVERIFIED,
  pending: VerifyStatus.PENDING,
  verified: VerifyStatus.VERIFIED,
  rejected: VerifyStatus.REJECTED,
  needs_more_info: VerifyStatus.NEEDS_MORE_INFO
};

export async function adminUpdateUserVerifyStatus(
  id: string,
  status: UserVerifyStatus,
  note?: string
): Promise<ActionResult<{ id: string }>> {
  try {
    const admin = await requireAdmin();
    const user = await prisma.user.update({
      where: { id },
      data: { verifyStatus: verifyStatusMap[status] },
      select: { id: true }
    });

    await writeAuditLog({
      adminId: admin.id,
      targetType: AuditTargetType.USER,
      targetId: id,
      action: `review_user:${status}`,
      note
    });

    revalidatePath("/admin");
    revalidatePath("/dashboard");
    return { ok: true, data: user };
  } catch (error) {
    return actionError(error);
  }
}

export async function getAuditLogs() {
  await requireAdmin();
  const logs = await prisma.adminAuditLog.findMany({
    include: { admin: { select: { id: true, name: true, email: true, companyName: true } } },
    orderBy: { createdAt: "desc" },
    take: 50
  });
  return logs.map(mapAuditLog);
}
