import type { EmailTemplate, WelcomeTemplateData } from "../types.js";
import { wrapHtml, buttonHtml, styles } from "./base.js";

export const welcomeTemplate: EmailTemplate<WelcomeTemplateData> = {
  subject: "Welcome!",

  html: (data) => {
    const dashboardUrl = `${data.baseUrl}/dashboard`;

    return wrapHtml(`
      <div style="${styles.header}">
        <h1 style="color: #333333; margin: 0;">Welcome!</h1>
      </div>
      <div style="${styles.content}">
        <p>Your account has been created successfully. We're excited to have you on board.</p>
        <p>Get started by visiting your dashboard:</p>
        <div style="text-align: center;">
          ${buttonHtml(dashboardUrl, "Go to Dashboard")}
        </div>
        <p style="${styles.muted}">If you have any questions, feel free to reach out to our support team.</p>
      </div>
    `);
  },

  text: (data) => {
    const dashboardUrl = `${data.baseUrl}/dashboard`;

    return `Welcome!

Your account has been created successfully. We're excited to have you on board.

Get started by visiting your dashboard:

${dashboardUrl}

If you have any questions, feel free to reach out to our support team.

This is an automated message. Please do not reply directly to this email.`;
  },
};
