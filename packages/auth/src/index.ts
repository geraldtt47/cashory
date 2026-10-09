import { expo } from "@better-auth/expo";
import { db } from "@cashory-demo/db";
import * as schema from "@cashory-demo/db/schema/auth";
import { env } from "@cashory-demo/env/server";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

const devOrigins = env.NODE_ENV === "development" ? ["*"] : [];

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",

    schema: schema,
  }),
  trustedOrigins: [
    env.CORS_ORIGIN,
    "cashory-demo://",
    "cashory://",
    "cashory.exp.direct://",
    "mybettertapp://",
    ...devOrigins,
  ],
  emailAndPassword: {
    enabled: true,
  },
  user: {
    additionalFields: {
      onboardingCompleted: {
        type: "boolean",
        required: false,
        input: true,
      },
      country: {
        type: "string",
        required: false,
        input: true,
      },
      phone: {
        type: "string",
        required: false,
        input: true,
      },
      image: {
        type: "string",
        required: false,
        input: true,
      },
      currency: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  advanced: {
    defaultCookieAttributes: {
      sameSite: "none",
      secure: true,
      httpOnly: true,
    },
    disableCSRFCheck: env.NODE_ENV === "development",
  },
  plugins: [expo()],
});
