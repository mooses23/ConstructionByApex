import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsPublicRouter from "./leads-public";
import leadsRouter from "./leads";
import quotesRouter from "./quotes";
import projectsRouter from "./projects";
import testimonialsRouter from "./testimonials";
import servicesRouter from "./services";
import dashboardRouter from "./dashboard";
import opportunitiesRouter from "./opportunities";
import authRouter from "./auth";
import { requireAdmin } from "../middleware/auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);

router.use(projectsRouter);
router.use(testimonialsRouter);
router.use(servicesRouter);
router.use(leadsPublicRouter);

router.use(requireAdmin, leadsRouter);
router.use(requireAdmin, quotesRouter);
router.use(requireAdmin, dashboardRouter);
router.use(requireAdmin, opportunitiesRouter);

export default router;
