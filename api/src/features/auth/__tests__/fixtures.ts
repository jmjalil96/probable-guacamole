export const TEST_PASSWORD = "TestPassword123!";
export const WRONG_PASSWORD = "WrongPassword456!";

export const validLoginPayload = {
  email: "test@example.com",
  password: TEST_PASSWORD,
};

export const invalidPayloads = {
  missingEmail: { password: TEST_PASSWORD },
  missingPassword: { email: "test@example.com" },
  invalidEmail: { email: "not-an-email", password: TEST_PASSWORD },
  emptyPassword: { email: "test@example.com", password: "" },
};
