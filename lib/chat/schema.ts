import { z } from "zod";

/** Validates the body of POST /api/chat. Never trust the client. */
export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      }),
    )
    .min(1)
    .max(40)
    // zod 4 runs refine even when min(1) failed, so guard against an empty array
    .refine((m) => m.at(-1)?.role === "user", { message: "last message must be from the user" }),
  lang: z.enum(["en-US", "ur-PK"]).default("en-US"),
  // Checked again by sanitizeUserName before it reaches the prompt
  userName: z.string().max(60).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
