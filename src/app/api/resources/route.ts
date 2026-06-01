import { NextRequest, NextResponse } from "next/server";
import { getApprovedResources } from "@/actions/resources";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const resources = await getApprovedResources({
    search: searchParams.get("search") ?? undefined,
    country: searchParams.get("country") ?? undefined,
    city: searchParams.get("city") ?? undefined,
    category: searchParams.get("category") ?? undefined,
    type: searchParams.get("type") ?? undefined
  });

  return NextResponse.json(resources);
}
