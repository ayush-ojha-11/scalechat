import { Router } from "express";
import { authenticate } from "../../shared/middleware/authenticate.middleware.js";
import {
  getMe,
  searchUsersController,
  getPublicUserProfileController,
} from "./users.controller.js";
import { searchUsersSchema, getUserProfileSchema } from "./users.validation.js";
import { validate } from "../../shared/middleware/validate.middleware.js";

const router = Router();
router.get("/me", authenticate, getMe);

// Search users
router.get(
  "/search",
  authenticate,
  validate(searchUsersSchema, "query"),
  searchUsersController,
);

// Get public user profile
router.get(
  "/:userId",
  authenticate,
  validate(getUserProfileSchema, "params"),
  getPublicUserProfileController,
);
export default router;
