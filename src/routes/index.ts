import { Router } from "express";
import authRoute from "./authRoute.js";
import verifyRoute from "./verifyRoute.js";

const router = Router();

router.use("/api/auth", authRoute);
router.use("/", verifyRoute);

export default router;
