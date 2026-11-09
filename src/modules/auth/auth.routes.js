import { Router } from "express";
import { validate } from "../../shared/middleware/validate.middleware.js";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  logoutSchema,
} from "./auth.validation.js";
import { register, login, refresh, logout } from "./auth.controller.js";
import {
  loginLimiter,
  refreshLimiter,
  registerLimiter,
} from "../../shared/middleware/rate-limit.middleware.js";
const router = Router();

router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refreshLimiter, validate(refreshTokenSchema), refresh);
router.post("/logout", validate(logoutSchema), logout);

export default router;
