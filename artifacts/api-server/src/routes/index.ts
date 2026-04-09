import { Router, type IRouter } from "express";
import healthRouter from "./health";
import leadsRouter from "./leads";
import quotesRouter from "./quotes";
import projectsRouter from "./projects";
import testimonialsRouter from "./testimonials";
import servicesRouter from "./services";
import dashboardRouter from "./dashboard";

const router: IRouter = Router();

router.use(healthRouter);
router.use(leadsRouter);
router.use(quotesRouter);
router.use(projectsRouter);
router.use(testimonialsRouter);
router.use(servicesRouter);
router.use(dashboardRouter);

export default router;
