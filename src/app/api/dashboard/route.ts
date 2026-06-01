import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/auth";
import { getMyDemands } from "@/actions/demands";
import { getMyLicenseApplications } from "@/actions/licenses";
import { getMyMatchRequests } from "@/actions/matches";
import { getMyResources } from "@/actions/resources";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resources, demands, matches, licenses] = await Promise.all([
    getMyResources(),
    getMyDemands(),
    getMyMatchRequests(),
    getMyLicenseApplications()
  ]);

  return NextResponse.json({ user, resources, demands, matches, licenses });
}
