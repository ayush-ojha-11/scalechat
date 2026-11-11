import { z } from "zod";

export const createDirectConversationSchema = z.object({
  targetUserId: z.string().uuid("Invalid user ID"),
});
