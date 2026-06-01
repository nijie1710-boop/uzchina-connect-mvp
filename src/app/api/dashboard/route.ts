import { NextResponse } from "next/server";
import { getCurrentUser } from "@/actions/auth";
import { getMyDemands } from "@/actions/demands";
import { getMyLicenseApplications } from "@/actions/licenses";
import { getMyMatchRequests } from "@/actions/matches";
import { getMyResources } from "@/actions/resources";
import { getMyVerifications } from "@/actions/verifications";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [resources, demands, matches, licenses, verifications] = await Promise.all([
    getMyResources(),
    getMyDemands(),
    getMyMatchRequests(),
    getMyLicenseApplications(),
    getMyVerifications()
  ]);

  return NextResponse.json({ user, resources, demands, matches, licenses, verifications });
}
