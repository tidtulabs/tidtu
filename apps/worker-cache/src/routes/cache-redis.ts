import { Router } from "express";
import * as pdaotao from "@controllers/cache-redis";
const router: Router = Router();

router.put("/examlist", pdaotao.cachedRedis);

export default router;
