import { Router } from "express";
import { createDirect, listConversations } from "./conversations.controller.js";
import {
  createDirectConversationSchema,
  listConversationsSchema,
} from "./conversations.validation.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { authenticate } from "../../shared/middleware/authenticate.middleware.js";

const router = Router();

router.post(
  "/direct",
  authenticate,
  validate(createDirectConversationSchema),
  createDirect,
);

router.get(
  "/",
  authenticate,
  validate(listConversationsSchema, "query"),
  listConversations,
);

export default router;
