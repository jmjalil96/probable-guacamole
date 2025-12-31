import { env } from "../../../config/env.js";
import type { TemplateId, EmailMessage } from "../types.js";
import { verificationTemplate } from "./verification.js";
import { passwordResetTemplate } from "./password-reset.js";
import { welcomeTemplate } from "./welcome.js";
import { accountLockedTemplate } from "./account-locked.js";
import { invitationTemplate } from "./invitation.js";

const templates = {
  verification: verificationTemplate,
  "password-reset": passwordResetTemplate,
  welcome: welcomeTemplate,
  "account-locked": accountLockedTemplate,
  invitation: invitationTemplate,
} as const;

export const renderTemplate = (
  templateId: TemplateId,
  data: Record<string, unknown>
): Omit<EmailMessage, "to"> => {
  const template = templates[templateId];
  const fullData = { ...data, baseUrl: env.APP_BASE_URL };

  const renderHtml = template.html as unknown as (
    data: Record<string, unknown>
  ) => string;
  const renderText = template.text as unknown as (
    data: Record<string, unknown>
  ) => string;

  return {
    subject: template.subject,
    html: renderHtml(fullData),
    text: renderText(fullData),
  };
};
