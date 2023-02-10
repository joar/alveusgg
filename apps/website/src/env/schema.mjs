// @ts-check
import { z } from "zod";

/**
 * Specify your chatbot-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 */
export const serverSchema = z.object({
  DATABASE_URL: z.string().url(),
  NODE_ENV: z.enum(["development", "test", "production"]),
  NEXTAUTH_SECRET:
    process.env.NODE_ENV === "production"
      ? z.string().min(1)
      : z.string().min(1).optional(),
  NEXTAUTH_URL: z.preprocess(
    // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    // Since NextAuth.js automatically uses the VERCEL_URL if present.
    (str) => process.env.VERCEL_URL ?? str,
    // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    process.env.VERCEL ? z.string() : z.string().url()
  ),
  TWITCH_CLIENT_ID: z.string(),
  TWITCH_CLIENT_SECRET: z.string(),
  TWITCH_EVENTSUB_SECRET: z.string(),
  TWITCH_EVENTSUB_CALLBACK: z.string(),
  ACTION_API_SECRET: z.string(),
  SUPER_USER_IDS: z.string(),
  WEB_PUSH_VAPID_PRIVATE_KEY: z.string().regex(/^[A-Za-z0-9\-_]+$/),
  WEB_PUSH_VAPID_SUBJECT: z.string(),
  OPEN_WEATHER_MAP_API_KEY: z.string().optional(),
  OPEN_WEATHER_MAP_API_LAT: z.string().optional(),
  OPEN_WEATHER_MAP_API_LON: z.string().optional(),
});

/**
 * Specify your client-side environment variables schema here.
 * This way you can ensure the app isn't built with invalid env vars.
 * To expose them to the client, prefix them with `NEXT_PUBLIC_`.
 */
export const clientSchema = z.object({
  NEXT_PUBLIC_NODE_ENV: z
    .enum(["development", "test", "production"])
    .optional(),
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY: z.string().regex(/^[A-Za-z0-9\-_]+$/),
  NEXT_PUBLIC_COOKIEBOT_ID: z.string().optional(),
});

/**
 * You can't destruct `process.env` as a regular object, so you have to do
 * it manually here. This is because Next.js evaluates this at build time,
 * and only used environment variables are included in the build.
 * @type {{ [k in keyof z.infer<typeof clientSchema>]: z.infer<typeof clientSchema>[k] | undefined }}
 */
export const clientEnv = {
  NEXT_PUBLIC_NODE_ENV: process.env.NODE_ENV ?? "development",
  NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY:
    process.env.NEXT_PUBLIC_WEB_PUSH_VAPID_PUBLIC_KEY,
  NEXT_PUBLIC_COOKIEBOT_ID: process.env.NEXT_PUBLIC_COOKIEBOT_ID,
};
