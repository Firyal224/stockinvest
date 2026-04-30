import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./db/schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  secret: process.env.BETTER_AUTH_SECRET!,
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
  user: {
    additionalFields: {
      riskProfile: {
        type: "string",
        required: false,
        input: false,
      },
      initialCapital: {
        type: "number",
        required: false,
        input: false,
        defaultValue: 0,
      },
      virtualBalance: {
        type: "number",
        required: false,
        input: false,
        defaultValue: 0,
      },
      onboardingCompleted: {
        type: "boolean",
        required: false,
        input: false,
        defaultValue: false,
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
