import { transporter } from "./transport.js";
import { renderTemplate } from "./templates/index.js";
import { isEmailSent, markEmailSent } from "./redis.js";
import { logger } from "../../lib/logger.js";
import { AppError } from "../../lib/errors.js";
import { env } from "../../config/env.js";
import type { TemplateId } from "./types.js";

export const sendEmail = async (
  to: string,
  templateId: TemplateId,
  data: Record<string, unknown>,
  jobId?: string
): Promise<void> => {
  // Idempotency check - prevent duplicate sends on retry
  if (jobId) {
    const alreadySent = await isEmailSent(jobId);
    if (alreadySent) {
      logger.warn({ jobId, to }, "email already sent, skipping duplicate");
      return;
    }
  }

  const { subject, html, text } = renderTemplate(templateId, data);

  try {
    await transporter.sendMail({
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });

    // Mark as sent AFTER successful send
    if (jobId) {
      try {
        await markEmailSent(jobId);
      } catch (error) {
        logger.error(
          { err: error, jobId, to },
          "failed to mark email sent - duplicate possible on retry"
        );
      }
    }

    logger.info({ to, subject }, "email sent");
  } catch (error) {
    logger.error({ err: error, to, templateId }, "email send failed");
    throw AppError.serviceUnavailable("Failed to send email", {
      code: "EMAIL_SEND_FAILED",
      cause: error,
    });
  }
};

export type { TemplateId } from "./types.js";
