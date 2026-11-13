import { z } from "zod";

export const createDirectConversationSchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID"),
});

export const listConversationsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().min(1).max(500).optional(),
});
