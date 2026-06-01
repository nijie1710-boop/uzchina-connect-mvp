import { NextResponse } from "next/server";
import {
  getAdminDashboardStats,
  getAuditLogs,
  getPendingDemands,
  getPendingLicenseApplications,
  getPendingMatchRequests,
  getPendingResources
} from "@/actions/admin";

export async function GET() {
  try {
    const [stats, resources, demands, matches, licenses, logs] = await Promise.all([
      getAdminDashboardStats(),
      getPendingResources(),
      getPendingDemands(),
      getPendingMatchRequests(),
      getPendingLicenseApplications(),
      getAuditLogs()
    ]);

    return NextResponse.json({ stats, resources, demands, matches, licenses, logs });
  } catch {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
}
