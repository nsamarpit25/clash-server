import { Router } from "express";
import authRoute from "./authRoute.js";
import verifyRoute from "./verifyRoute.js";
import PasswordRoutes from "./passwordRoutes.js";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/api/auth", PasswordRoutes);
router.use("/", verifyRoute);

export default router;
