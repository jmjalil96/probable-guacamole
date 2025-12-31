import { Router } from "express";
import { env } from "../../config/env.js";
import { validate } from "../../middleware/validate.js";
import { SESSION_COOKIE_NAME } from "./constants.js";
import { loginSchema } from "./schemas.js";
import { login } from "./service.js";

const router = Router();

router.post(
  "/login",
  validate({ body: loginSchema }),
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

      res.cookie(SESSION_COOKIE_NAME, sessionToken, {
        httpOnly: true,
        secure: env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        expires: expiresAt,
      });

      res.json({ success: true });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
