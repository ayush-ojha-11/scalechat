import { z } from "zod";

export const sendMessageSchema = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message cannot be empty")
    .max(5000, "Message cannot exceed 5000 characters"),
});

export const getMessageSchema = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(50),
    cursor: z.string().min(1).max(500).optional(),
    after: z.string().min(1).max(500).optional(),
  })
  .refine((data) => !(data.cursor && data.after), {
    message: "Use either cursor or after, not both",
  });
