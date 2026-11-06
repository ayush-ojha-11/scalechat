import express from "express";
import cors from "cors";
import healthRoutes from "./modules/health/health.routes.js";

const app = express();

// Global middlewares
app.use(cors());
app.use(express.json());

//Routes
app.use("/health", healthRoutes);
export default app;
