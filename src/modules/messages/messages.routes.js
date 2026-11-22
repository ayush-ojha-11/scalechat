import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { sendMessageSchema, getMessageSchema } from "./messages.validation.js";
import { createMessage, listMessages } from "./messages.controller.js";

const router = Router();
router.post(
  "/:conversationId/messages",
  authenticate,
  validate(sendMessageSchema),
  createMessage,
);

router.get(
  "/:conversationId/messages",
  authenticate,
  validate(getMessageSchema, "query"),
  listMessages,
);

export default router;
