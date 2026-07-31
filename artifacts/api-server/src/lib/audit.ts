import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { JWTPayload } from "./auth";

export async function createAuditLog(
  user: JWTPayload,
  action: string,
  tableName: string,
  recordId?: number,
  oldValues?: unknown,
  newValues?: unknown,
  ipAddress?: string
): Promise<void> {
  try {
    await db.insert(auditLogsTable).values({
      userId: user.userId,
      userName: user.fullName,
      action,
      tableName,
      recordId,
      oldValues: oldValues ? JSON.stringify(oldValues) : null,
      newValues: newValues ? JSON.stringify(newValues) : null,
      ipAddress: ipAddress || null,
    });
  } catch {
    // Audit log failures should not break the main operation
  }
}

export function getSeqNumber(prefix: string, id: number): string {
  return `${prefix}-${new Date().getFullYear()}-${String(id).padStart(5, "0")}`;
}
