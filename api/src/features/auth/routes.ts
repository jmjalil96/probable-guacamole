import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { loginRequestSchema, type LoginResponse } from "shared";
import { login } from "./service.js";
import { setSessionCookie } from "./utils.js";

const router = Router();

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

export default router;
