export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface EmailTemplate<T = unknown> {
  subject: string;
  html: (data: T) => string;
  text: (data: T) => string;
}

export type TemplateId =
  | "verification"
  | "password-reset"
  | "welcome"
  | "account-locked";

export interface VerificationTemplateData {
  token: string;
  baseUrl: string;
}

export interface PasswordResetTemplateData {
  token: string;
  baseUrl: string;
}

export interface WelcomeTemplateData {
  baseUrl: string;
}

export interface AccountLockedTemplateData {
  baseUrl: string;
}

export type TemplateDataMap = {
  verification: VerificationTemplateData;
  "password-reset": PasswordResetTemplateData;
  welcome: WelcomeTemplateData;
  "account-locked": AccountLockedTemplateData;
};
