import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate.middleware.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { sendMessageSchema } from "./messages.validation.js";
import { createMessage } from "./messages.controller.js";

const router = Router();
router.post(
  "/:conversationId/messages",
  authenticate,
  validate(sendMessageSchema),
  createMessage,
);

export default router;
