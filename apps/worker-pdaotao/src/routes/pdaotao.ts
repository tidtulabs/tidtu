import * as pdaotao from "controllers/pdaotao";
import { Hono } from "hono";
const router = new Hono();

router.get("/scraping/examlist", pdaotao.getExamList);
router.get("/scraping/examlist/:examId", pdaotao.fetchExamDownloadLink);

export default router;
