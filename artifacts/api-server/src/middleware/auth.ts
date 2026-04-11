import { type Request, type Response, type NextFunction } from "express";
import { db, adminSessionsTable, adminUsersTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";

const SESSION_COOKIE = "apex_admin_sid";

export function getSessionToken(req: Request): string | undefined {
  return (req as unknown as Record<string, unknown>).cookies?.[SESSION_COOKIE] as string | undefined;
}

export function setSessionCookie(res: Response, token: string, maxAgeMs: number): void {
  const isProduction = process.env.NODE_ENV === "production";
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    maxAge: maxAgeMs,
    path: "/",
  });
}

export function clearSessionCookie(res: Response): void {
  const isProduction = process.env.NODE_ENV === "production";
  res.clearCookie(SESSION_COOKIE, {
    path: "/",
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
  });
}

export function csrfProtection(req: Request, res: Response, next: NextFunction): void {
  const safeMethods = ["GET", "HEAD", "OPTIONS"];
  if (safeMethods.includes(req.method)) {
    next();
    return;
  }

  const corsOrigin = process.env.CORS_ORIGIN;
  if (!corsOrigin) {
    next();
    return;
  }

  const allowed = corsOrigin.split(",").map((o) => o.trim());
  const origin = req.headers.origin;

  if (!origin || !allowed.includes(origin)) {
    res.status(403).json({ message: "Forbidden: invalid origin" });
    return;
  }

  next();
}

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  const token = getSessionToken(req);
  if (!token) {
    res.status(401).json({ message: "Authentication required" });
    return;
  }

  const sessions = await db
    .select({
      sessionId: adminSessionsTable.id,
      userId: adminSessionsTable.userId,
      username: adminUsersTable.username,
    })
    .from(adminSessionsTable)
    .innerJoin(adminUsersTable, eq(adminSessionsTable.userId, adminUsersTable.id))
    .where(
      and(
        eq(adminSessionsTable.token, token),
        gt(adminSessionsTable.expiresAt, new Date()),
      ),
    )
    .limit(1);

  if (sessions.length === 0) {
    clearSessionCookie(res);
    res.status(401).json({ message: "Session expired or invalid" });
    return;
  }

  (req as unknown as Record<string, unknown>).adminUser = {
    id: sessions[0].userId,
    username: sessions[0].username,
  };

  next();
}
