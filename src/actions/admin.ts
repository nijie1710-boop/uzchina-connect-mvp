"use server";

import { LicenseApplicationStatus, MatchRequestStatus, ResourceStatus, ReviewStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { mapAuditLog, mapDemand, mapLicenseApplication, mapMatchRequest, mapResource } from "@/lib/db-mappers";

export async function getAdminDashboardStats() {
  await requireAdmin();
  const [pendingResources, approvedResources, pendingDemands, pendingMatches, pendingLicenses, auditLogs] =
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
      prisma.adminAuditLog.count()
    ]);

  return {
    pendingResources,
    approvedResources,
    pendingDemands,
    pendingMatches,
    pendingLicenses,
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
  return resources.map(mapResource);
}

export async function getPendingDemands() {
  await requireAdmin();
  const demands = await prisma.demand.findMany({
    where: { status: ReviewStatus.PENDING },
    orderBy: { createdAt: "desc" }
  });
  return demands.map(mapDemand);
}

export async function getPendingMatchRequests() {
  await requireAdmin();
  const requests = await prisma.matchRequest.findMany({
    where: { status: { in: [MatchRequestStatus.PENDING, MatchRequestStatus.APPROVED] } },
    include: {
      requester: { select: { id: true, name: true, email: true, companyName: true } },
      resource: {
        include: { user: { select: { id: true, name: true, email: true, companyName: true } } }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return requests.map((request) => ({
    ...mapMatchRequest(request),
    resource: mapResource(request.resource)
  }));
}

export async function getPendingLicenseApplications() {
  await requireAdmin();
  const applications = await prisma.licenseApplication.findMany({
    where: { status: { in: [LicenseApplicationStatus.PENDING, LicenseApplicationStatus.CONTACTED] } },
    orderBy: { createdAt: "desc" }
  });
  return applications.map(mapLicenseApplication);
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
