import express from "express";
import cors from "cors";
import healthRoutes from "./modules/health/health.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import userRoutes from "./modules/users/users.routes.js";
import { errorHandler } from "./shared/middleware/error.middleware.js";

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());

//Routes
app.use("/health", healthRoutes);
app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/users", userRoutes);

// Error middleware should be registered after all routes
app.use(errorHandler);

export default app;
