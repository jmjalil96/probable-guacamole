import { createTransport } from "nodemailer";
import { env } from "../../config/env.js";

export const transporter = createTransport({
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  secure: env.SMTP_SECURE,
  ...(env.SMTP_USER && env.SMTP_PASS
    ? {
        auth: {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        },
      }
    : {}),
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
});

export const verifySmtpConnection = async (): Promise<void> => {
  await transporter.verify();
};
