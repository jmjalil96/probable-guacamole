import type { Job } from "bullmq";
import { z } from "zod";
import { createJobLogger } from "../../../lib/logger.js";
import { sendEmail } from "../../email/index.js";
import type { JobDataByType, JobType } from "../types.js";

type EmailJobType = Extract<JobType, `email:${string}`>;
type EmailJob = Job<JobDataByType<EmailJobType>, void, EmailJobType>;

const verificationSchema = z.object({
  to: z.string().email(),
  userId: z.string().min(1),
  token: z.string().min(1),
});

const passwordResetSchema = z.object({
  to: z.string().email(),
  userId: z.string().min(1),
  token: z.string().min(1),
});

const welcomeSchema = z.object({
  to: z.string().email(),
  userId: z.string().min(1),
});

const accountLockedSchema = z.object({
  to: z.string().email(),
  userId: z.string().min(1),
});

export const handleEmailJob = async (job: EmailJob) => {
  const log = createJobLogger(job.id ?? "unknown", job.name);
  const jobId = job.id;

  switch (job.name) {
    case "email:verification": {
      const data = verificationSchema.parse(job.data);
      await sendEmail(data.to, "verification", { token: data.token }, jobId);
      log.info({ to: data.to }, "verification email sent");
      return;
    }
    case "email:password-reset": {
      const data = passwordResetSchema.parse(job.data);
      await sendEmail(data.to, "password-reset", { token: data.token }, jobId);
      log.info({ to: data.to }, "password reset email sent");
      return;
    }
    case "email:welcome": {
      const data = welcomeSchema.parse(job.data);
      await sendEmail(data.to, "welcome", {}, jobId);
      log.info({ to: data.to }, "welcome email sent");
      return;
    }
    case "email:account-locked": {
      const data = accountLockedSchema.parse(job.data);
      await sendEmail(data.to, "account-locked", {}, jobId);
      log.info({ to: data.to }, "account locked email sent");
      return;
    }
    default: {
      const _exhaustive: never = job.name;
      throw new Error(`Unhandled email job: ${String(_exhaustive)}`);
    }
  }
};
