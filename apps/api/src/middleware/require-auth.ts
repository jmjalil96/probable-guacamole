import type { NextFunction, Request, Response } from "express";
import { db } from "../config/db.js";
import { hashToken } from "../features/auth/utils.js";
import {
  SESSION_COOKIE_NAME,
  SESSION_ACTIVITY_STALENESS_MS,
} from "../features/auth/constants.js";
import { AppError } from "../lib/errors.js";

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
    if (!token) {
      throw AppError.unauthorized();
    }

    const tokenHash = hashToken(token);
    const session = await db.session.findUnique({
      where: { tokenHash },
      include: {
        user: {
          include: { role: true },
        },
      },
    });

    if (!session) {
      throw AppError.unauthorized();
    }

    if (session.revokedAt !== null) {
      throw AppError.unauthorized();
    }

    if (session.expiresAt < new Date()) {
      throw AppError.unauthorized();
    }

    const { user } = session;

    if (!user.isActive) {
      throw AppError.unauthorized();
    }

    if (user.lockedAt !== null) {
      throw AppError.unauthorized();
    }

    if (
      user.sessionsInvalidBefore !== null &&
      session.createdAt < user.sessionsInvalidBefore
    ) {
      throw AppError.unauthorized();
    }

    req.user = {
      id: user.id,
      sessionId: session.id,
      role: {
        id: user.role.id,
        name: user.role.name,
        scopeType: user.role.scopeType,
      },
    };

    // Update lastActiveAt if stale (fire-and-forget)
    const staleThreshold = new Date(Date.now() - SESSION_ACTIVITY_STALENESS_MS);
    if (session.lastActiveAt < staleThreshold) {
      db.session
        .update({
          where: { id: session.id },
          data: { lastActiveAt: new Date() },
        })
        .catch(() => {});
    }

    next();
  } catch (err) {
    next(err);
  }
};
