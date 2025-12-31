import type { EmailTemplate, AccountLockedTemplateData } from "../types.js";
import { wrapHtml, buttonHtml, styles } from "./base.js";

export const accountLockedTemplate: EmailTemplate<AccountLockedTemplateData> = {
  subject: "Account locked - Action required",

  html: (data) => {
    const resetUrl = `${data.baseUrl}/reset-password`;
    return wrapHtml(`
      <div style="${styles.header}">
        <h1 style="color: #333333; margin: 0;">Account locked</h1>
      </div>
      <div style="${styles.content}">
        <p>Your account has been locked due to too many failed login attempts.</p>
        <p>To unlock your account, please reset your password:</p>
        <div style="text-align: center;">
          ${buttonHtml(resetUrl, "Reset Password")}
        </div>
        <p style="${styles.muted}">If this wasn't you, please reset your password immediately.</p>
      </div>
    `);
  },

  text: (data) => {
    const resetUrl = `${data.baseUrl}/reset-password`;
    return `Account locked

Your account has been locked due to too many failed login attempts.

To unlock your account, please reset your password:
${resetUrl}

If this wasn't you, please reset your password immediately.`;
  },
};
