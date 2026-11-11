import { Router } from "express";
import { createDirect } from "./conversations.controller.js";
import { createDirectConversationSchema } from "./conversations.validation.js";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { authenticate } from "../../shared/middleware/authenticate.middleware.js";

const router = Router();

router.post(
  "/direct",
  authenticate,
  validate(createDirectConversationSchema),
  createDirect,
);

export default router;
