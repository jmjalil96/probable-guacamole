import type { EmailTemplate, VerificationTemplateData } from "../types.js";
import { wrapHtml, buttonHtml, styles } from "./base.js";

export const verificationTemplate: EmailTemplate<VerificationTemplateData> = {
  subject: "Verify your email",

  html: (data) => {
    const verifyUrl = `${data.baseUrl}/verify?token=${encodeURIComponent(data.token)}`;

    return wrapHtml(`
      <div style="${styles.header}">
        <h1 style="color: #333333; margin: 0;">Verify your email</h1>
      </div>
      <div style="${styles.content}">
        <p>Thank you for signing up. Please verify your email address by clicking the button below:</p>
        <div style="text-align: center;">
          ${buttonHtml(verifyUrl, "Verify Email")}
        </div>
        <p style="${styles.muted}">If you didn't create an account, you can safely ignore this email.</p>
        <p style="${styles.muted}">Or copy and paste this link into your browser:</p>
        <p style="${styles.muted}; word-break: break-all;">${verifyUrl}</p>
      </div>
    `);
  },

  text: (data) => {
    const verifyUrl = `${data.baseUrl}/verify?token=${encodeURIComponent(data.token)}`;

    return `Verify your email

Thank you for signing up. Please verify your email address by visiting the link below:

${verifyUrl}

If you didn't create an account, you can safely ignore this email.

This is an automated message. Please do not reply directly to this email.`;
  },
};
