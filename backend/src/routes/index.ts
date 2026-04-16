import { Router } from "express";
import { achievementsRouter } from "./achievements.routes.js";
import { adminRouter } from "./admin.routes.js";
import { appointmentsRouter } from "./appointments.routes.js";
import { authRouter } from "./auth.routes.js";
import { bioimpedanceRouter } from "./bioimpedance.routes.js";
import { injectablesRouter } from "./injectables.routes.js";
import { paymentsRouter } from "./payments.routes.js";
import { profileRouter } from "./profile.routes.js";
import { workoutsRouter } from "./workouts.routes.js";

const router = Router();

router.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

router.use("/auth", authRouter);
router.use("/profile", profileRouter);
router.use("/achievements", achievementsRouter);
router.use("/appointments", appointmentsRouter);
router.use("/injectables", injectablesRouter);
router.use("/payments", paymentsRouter);
router.use("/workouts", workoutsRouter);
router.use("/bioimpedance", bioimpedanceRouter);
router.use("/admin", adminRouter);

export { router as apiRouter };
