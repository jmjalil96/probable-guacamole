import { z } from "zod";
import "dotenv/config";

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .optional(),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  CORS_ORIGIN: z.string().default("*"),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().default(900_000), // 15 min
  RATE_LIMIT_MAX: z.coerce.number().default(100),
  SMTP_HOST: z.string().default("localhost"),
  SMTP_PORT: z.coerce.number().default(2500),
  SMTP_SECURE: z
    .enum(["true", "false", "1", "0"])
    .default("false")
    .transform((v) => v === "true" || v === "1"),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  EMAIL_FROM: z.string().default("noreply@example.com"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),

  // R2 Object Storage
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_PUBLIC_URL: z.string().url().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

// Production environment validation - fail fast if using dev defaults
if (parsed.data.NODE_ENV === "production") {
  const errors: string[] = [];

  if (parsed.data.SMTP_HOST === "localhost") {
    errors.push("SMTP_HOST cannot be 'localhost' in production");
  }

  if (parsed.data.EMAIL_FROM.includes("example.com")) {
    errors.push("EMAIL_FROM cannot contain 'example.com' in production");
  }

  if (parsed.data.APP_BASE_URL.includes("localhost")) {
    errors.push("APP_BASE_URL cannot contain 'localhost' in production");
  }

  if (errors.length > 0) {
    console.error("Production environment validation failed:");
    errors.forEach((e) => console.error(`  - ${e}`));
    process.exit(1);
  }
}

export const env = parsed.data;
