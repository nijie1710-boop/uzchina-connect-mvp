import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/session";

const allowedTargetTypes = new Set(["resource", "demand", "license_application", "verification"]);
const maxRecordedFileSize = 20 * 1024 * 1024;

type UploadInput = {
  targetType?: string;
  targetId?: string;
  fileUrl?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
};

async function ownsTarget(userId: string, targetType: string, targetId: string) {
  if (targetType === "resource") {
    return Boolean(await prisma.resource.findFirst({ where: { id: targetId, userId }, select: { id: true } }));
  }
  if (targetType === "demand") {
    return Boolean(await prisma.demand.findFirst({ where: { id: targetId, userId }, select: { id: true } }));
  }
  if (targetType === "license_application") {
    return Boolean(await prisma.licenseApplication.findFirst({ where: { id: targetId, userId }, select: { id: true } }));
  }
  if (targetType === "verification") {
    return Boolean(await prisma.verification.findFirst({ where: { id: targetId, userId }, select: { id: true } }));
  }
  return false;
}

function validateInput(input: UploadInput) {
  const targetType = input.targetType?.trim();
  const targetId = input.targetId?.trim();
  const fileUrl = input.fileUrl?.trim();
  const fileName = input.fileName?.trim();

  if (!targetType || !allowedTargetTypes.has(targetType)) throw new Error("Invalid upload target type.");
  if (!targetId) throw new Error("Upload target id is required.");
  if (!fileName) throw new Error("File name is required.");
  if (!fileUrl) throw new Error("File URL is required.");
  if (process.env.NODE_ENV === "production" && !fileUrl.startsWith("https://")) {
    throw new Error("Production file URLs must use HTTPS object storage.");
  }
  if (input.size && input.size > maxRecordedFileSize) throw new Error("File is too large.");

  return {
    targetType,
    targetId,
    fileUrl,
    fileName,
    mimeType: input.mimeType?.trim() || null,
    size: input.size ?? null
  };
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireUser();
    const input = validateInput((await request.json()) as UploadInput);
    const isAdmin = user.role === "ADMIN";

    if (!isAdmin && !(await ownsTarget(user.id, input.targetType, input.targetId))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const file = await prisma.uploadFile.create({
      data: {
        userId: user.id,
        targetType: input.targetType,
        targetId: input.targetId,
        fileUrl: input.fileUrl,
        fileName: input.fileName,
        mimeType: input.mimeType,
        size: input.size
      },
      select: {
        id: true,
        targetType: true,
        targetId: true,
        fileName: true,
        mimeType: true,
        size: true,
        createdAt: true
      }
    });

    return NextResponse.json(file, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Upload failed" }, { status: 400 });
  }
}
