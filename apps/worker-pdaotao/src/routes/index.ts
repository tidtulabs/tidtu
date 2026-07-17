import { Hono } from "hono";
import pdaotao from "./pdaotao";

const router = new Hono<{ Bindings: CloudflareBindings }>();
router.route("/pdaotao", pdaotao);

export default router;
