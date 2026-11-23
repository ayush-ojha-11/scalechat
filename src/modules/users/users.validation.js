import { z } from "zod";

export const searchUsersSchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, "Search must contain at least 2 characters")
    .max(30, "Search cannot exceed 30 characters"),

  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export const getUserProfileSchema = z.object({
  userId: z.string().uuid("Invalid user ID"),
});
