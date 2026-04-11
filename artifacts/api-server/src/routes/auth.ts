import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { db, adminUsersTable, adminSessionsTable } from "@workspace/db";
import { eq, and, gt } from "drizzle-orm";
import {
  getSessionToken,
  setSessionCookie,
  clearSessionCookie,
  requireAdmin,
} from "../middleware/auth";
import { logger } from "../lib/logger";

const router = Router();

const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

router.post("/auth/login", async (req, res) => {
  const { username, password } = req.body ?? {};

  if (!username || !password) {
    logger.warn({ username: username ?? "(empty)" }, "Login attempt with missing fields");
    res.status(400).json({ message: "Username and password are required" });
    return;
  }

  try {
    const users = await db
      .select()
      .from(adminUsersTable)
      .where(eq(adminUsersTable.username, username))
      .limit(1);

    if (users.length === 0) {
      logger.warn({ username }, "Login failed: user not found");
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const user = users[0];
    const valid = await bcrypt.compare(password, user.passwordHash);

    if (!valid) {
      logger.warn({ username }, "Login failed: incorrect password");
      res.status(401).json({ message: "Invalid credentials" });
      return;
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

    await db.insert(adminSessionsTable).values({
      userId: user.id,
      token,
      expiresAt,
    });

    setSessionCookie(res, token, SESSION_DURATION_MS);

    logger.info({ username, userId: user.id }, "Login successful");

    res.json({
      user: { id: user.id, username: user.username },
    });
  } catch (err) {
    logger.error({ err, username }, "Login failed: database error");
    res.status(500).json({ message: "Internal server error" });
  }
});

router.post("/auth/logout", async (req, res) => {
  const token = getSessionToken(req);

  if (!token) {
    logger.debug("Logout called without session cookie");
    res.json({ ok: true });
    return;
  }

  try {
    await db
      .delete(adminSessionsTable)
      .where(eq(adminSessionsTable.token, token));
    clearSessionCookie(res);
    logger.info("Admin logged out");
  } catch (err) {
    logger.error({ err }, "Logout failed: database error");
  }

  res.json({ ok: true });
});

router.get("/auth/me", async (req, res) => {
  const token = getSessionToken(req);

  if (!token) {
    logger.debug("Session check: no cookie present");
    res.status(401).json({ message: "Not authenticated" });
    return;
  }

  try {
    const sessions = await db
      .select({
        userId: adminUsersTable.id,
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
      logger.warn("Session check: token invalid or expired");
      clearSessionCookie(res);
      res.status(401).json({ message: "Session expired" });
      return;
    }

    res.json({
      user: { id: sessions[0].userId, username: sessions[0].username },
    });
  } catch (err) {
    logger.error({ err }, "Session check: database error");
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
