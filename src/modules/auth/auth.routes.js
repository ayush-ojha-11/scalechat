import { Router } from "express";
import { validate } from "../../shared/middleware/validate.middleware.js";
import { registerSchema } from "./auth.validation.js";
import { register } from "./auth.controller.js";
const router = Router();

router.post("/register", validate(registerSchema), register);

export default router;
