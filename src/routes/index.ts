import { Router } from "express";
import authRoute from "./authRoute.js";
import verifyRoute from "./verifyRoute.js";
import PasswordRoutes from "./passwordRoutes.js";
import routerClash from "./clashRoute.js";
import authMiddleware from "../middlewares/AuthMiddlewares.js";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/api/auth", PasswordRoutes);
router.use("/", verifyRoute);
router.use("/api/clash", authMiddleware, routerClash);

export default router;
