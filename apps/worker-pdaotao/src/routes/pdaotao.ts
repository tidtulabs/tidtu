import * as pdaotao from "controllers/pdaotao";
import { Hono } from "hono";
const router = new Hono();

router.get("/exams", pdaotao.getExamList);
router.get("/exams/:examId/download", pdaotao.fetchExamDownloadLink);

export default router;
