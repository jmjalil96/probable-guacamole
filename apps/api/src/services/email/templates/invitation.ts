import type { EmailTemplate, InvitationTemplateData } from "../types.js";
import { wrapHtml, buttonHtml, styles } from "./base.js";

export const invitationTemplate: EmailTemplate<InvitationTemplateData> = {
  subject: "You've been invited to join",

  html: (data) => {
    const acceptUrl = `${data.baseUrl}/accept-invitation?token=${encodeURIComponent(data.token)}`;
    const expiresDate = new Date(data.expiresAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return wrapHtml(`
      <div style="${styles.header}">
        <h1 style="color: #333333; margin: 0;">You've been invited</h1>
      </div>
      <div style="${styles.content}">
        <p>You've been invited to join as a <strong>${data.roleName}</strong>.</p>
        <p>Click the button below to create your account:</p>
        <div style="text-align: center;">
          ${buttonHtml(acceptUrl, "Accept Invitation")}
        </div>
        <p style="${styles.muted}">This invitation expires on ${expiresDate}.</p>
        <p style="${styles.muted}">If you weren't expecting this invitation, you can safely ignore this email.</p>
        <p style="${styles.muted}">Or copy and paste this link into your browser:</p>
        <p style="${styles.muted}; word-break: break-all;">${acceptUrl}</p>
      </div>
    `);
  },

  text: (data) => {
    const acceptUrl = `${data.baseUrl}/accept-invitation?token=${encodeURIComponent(data.token)}`;
    const expiresDate = new Date(data.expiresAt).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `You've been invited

You've been invited to join as a ${data.roleName}.

Click the link below to create your account:

${acceptUrl}

This invitation expires on ${expiresDate}.

If you weren't expecting this invitation, you can safely ignore this email.

This is an automated message. Please do not reply directly to this email.`;
  },
};
