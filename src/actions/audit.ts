import type { AuditTargetType } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function writeAuditLog(input: {
  adminId: string;
  targetType: AuditTargetType;
  targetId: string;
  action: string;
  note?: string;
}) {
  await prisma.adminAuditLog.create({
    data: {
      adminId: input.adminId,
      targetType: input.targetType,
      targetId: input.targetId,
      action: input.action,
      note: input.note
    }
  });
}
