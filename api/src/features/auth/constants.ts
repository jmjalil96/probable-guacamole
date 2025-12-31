export const MAX_FAILED_LOGIN_ATTEMPTS = 5;
export const SESSION_EXPIRY_DAYS = 30;
export const SESSION_TOKEN_BYTES = 32;
export const SESSION_COOKIE_NAME = "sid";
export const SESSION_ACTIVITY_STALENESS_MS = 5 * 60 * 1000;

// Pre-computed argon2 hash for timing attack prevention.
// Used when user doesn't exist to keep response time constant.
export const DUMMY_PASSWORD_HASH =
  "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$RdescudvJCsgt3ube/FQZEB8F0rHk7FXeTs9w/n/ges";
