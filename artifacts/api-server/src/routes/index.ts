import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import towRequestsRouter from "./tow-requests";
import driversRouter from "./drivers";
import tripsRouter from "./trips";
import paymentsRouter from "./payments";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(towRequestsRouter);
router.use(driversRouter);
router.use(tripsRouter);
router.use(paymentsRouter);
router.use(statsRouter);

export default router;
