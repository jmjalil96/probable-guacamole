import type { EmailTemplate, PasswordResetTemplateData } from "../types.js";
import { wrapHtml, buttonHtml, styles } from "./base.js";

export const passwordResetTemplate: EmailTemplate<PasswordResetTemplateData> = {
  subject: "Reset your password",

  html: (data) => {
    const resetUrl = `${data.baseUrl}/reset-password?token=${encodeURIComponent(data.token)}`;

    return wrapHtml(`
      <div style="${styles.header}">
        <h1 style="color: #333333; margin: 0;">Reset your password</h1>
      </div>
      <div style="${styles.content}">
        <p>We received a request to reset your password. Click the button below to choose a new password:</p>
        <div style="text-align: center;">
          ${buttonHtml(resetUrl, "Reset Password")}
        </div>
        <p style="${styles.muted}">This link will expire in 1 hour.</p>
        <p style="${styles.muted}">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
        <p style="${styles.muted}">Or copy and paste this link into your browser:</p>
        <p style="${styles.muted}; word-break: break-all;">${resetUrl}</p>
      </div>
    `);
  },

  text: (data) => {
    const resetUrl = `${data.baseUrl}/reset-password?token=${encodeURIComponent(data.token)}`;

    return `Reset your password

We received a request to reset your password. Visit the link below to choose a new password:

${resetUrl}

This link will expire in 1 hour.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

This is an automated message. Please do not reply directly to this email.`;
  },
};
