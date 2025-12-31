import { Router, type Request } from "express";
import { validate } from "../../middleware/validate.js";
import { requireAuth } from "../../middleware/require-auth.js";
import { getAuditContext } from "../../services/audit/audit.js";
import {
  loginRequestSchema,
  passwordResetRequestSchema,
  validateResetTokenParamsSchema,
  passwordResetConfirmSchema,
  type LoginResponse,
  type MeResponse,
  type PasswordResetRequestResponse,
  type ValidateResetTokenResponse,
  type PasswordResetConfirmResponse,
} from "shared";
import {
  login,
  logout,
  logoutAll,
  getCurrentUser,
  requestPasswordReset,
  validateResetToken,
  confirmPasswordReset,
} from "./service.js";
import { setSessionCookie, clearSessionCookie } from "./utils.js";

const router = Router();

// =============================================================================
// POST /login
// =============================================================================

router.post(
  "/login",
  validate({ body: loginRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const { sessionToken, expiresAt } = await login({
        email: req.body.email,
        password: req.body.password,
        ip: req.ip ?? null,
        userAgent: req.get("user-agent") ?? null,
        ...(requestId && { requestId }),
      });

      setSessionCookie(res, sessionToken, expiresAt);

      const response: LoginResponse = { success: true };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /logout
// =============================================================================

router.post("/logout", requireAuth, async (req, res, next) => {
  try {
    const requestId = res.locals.requestId as string | undefined;
    const context = getAuditContext(req, res);

    await logout(
      { sessionId: req.user!.sessionId, ...(requestId && { requestId }) },
      context
    );

    clearSessionCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// POST /logout-all
// =============================================================================

router.post("/logout-all", requireAuth, async (req, res, next) => {
  try {
    const requestId = res.locals.requestId as string | undefined;
    const context = getAuditContext(req, res);

    await logoutAll(
      {
        userId: req.user!.id,
        sessionId: req.user!.sessionId,
        ...(requestId && { requestId }),
      },
      context
    );

    clearSessionCookie(res);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// GET /me
// =============================================================================

router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const requestId = res.locals.requestId as string | undefined;

    const result = await getCurrentUser({
      userId: req.user!.id,
      ...(requestId && { requestId }),
    });

    res.set("Cache-Control", "no-store");
    const response: MeResponse = result;
    res.json(response);
  } catch (err) {
    next(err);
  }
});

// =============================================================================
// POST /password-reset/request
// =============================================================================

router.post(
  "/password-reset/request",
  validate({ body: passwordResetRequestSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req as Request, res);

      await requestPasswordReset(
        { email: req.body.email, ...(requestId && { requestId }) },
        context
      );

      const response: PasswordResetRequestResponse = {
        message: "If an account exists, you will receive an email",
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// GET /password-reset/:token
// =============================================================================

router.get(
  "/password-reset/:token",
  validate({ params: validateResetTokenParamsSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;

      const result = await validateResetToken({
        token: req.params.token,
        ...(requestId && { requestId }),
      });

      const response: ValidateResetTokenResponse = {
        expiresAt: result.expiresAt.toISOString(),
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

// =============================================================================
// POST /password-reset/confirm
// =============================================================================

router.post(
  "/password-reset/confirm",
  validate({ body: passwordResetConfirmSchema }),
  async (req, res, next) => {
    try {
      const requestId = res.locals.requestId as string | undefined;
      const context = getAuditContext(req as Request, res);

      await confirmPasswordReset(
        {
          token: req.body.token,
          password: req.body.password,
          ...(requestId && { requestId }),
        },
        context
      );

      clearSessionCookie(res);

      const response: PasswordResetConfirmResponse = {
        message: "Password reset successful",
      };
      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
