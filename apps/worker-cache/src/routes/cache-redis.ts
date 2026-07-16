import { Router } from "express";
import * as pdaotao from "@controllers/cache-redis";
const router: Router = Router();

router.post("/cache/exams", pdaotao.cachedRedis);

export default router;
