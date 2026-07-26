import { Hono } from "hono";
import { Env } from "../types";
import { scanExams } from "../controllers/scan";

const router = new Hono<{ Bindings: Env }>();

router.post("/scan", scanExams);

export default router;
