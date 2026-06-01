import { NextResponse } from "next/server";
import {
  getAdminDashboardStats,
  getAuditLogs,
  getAdminUsers,
  getPendingDemands,
  getPendingLicenseApplications,
  getPendingMatchRequests,
  getPendingResources,
  getPendingVerifications
} from "@/actions/admin";

export async function GET() {
  try {
    const [stats, resources, demands, matches, licenses, verifications, users, logs] = await Promise.all([
      getAdminDashboardStats(),
      getPendingResources(),
      getPendingDemands(),
      getPendingMatchRequests(),
      getPendingLicenseApplications(),
      getPendingVerifications(),
      getAdminUsers(),
      getAuditLogs()
    ]);

    return NextResponse.json({ stats, resources, demands, matches, licenses, verifications, users, logs });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
