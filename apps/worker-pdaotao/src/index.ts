import { Hono, HonoRequest } from "hono";
import { cors } from "hono/cors";
import router from "routes";
import * as response from "utils/response";

const app = new Hono<{ Bindings: CloudflareBindings }>();


app.use("*", async (c, next) => {
	const corsMiddlewareHandler = cors({
		origin: c.env.NODE_ENV === "dev"
			? (origin) => origin || c.env.CORS_ORIGIN || "https://tidtu.pages.dev"
			: (c.env.CORS_ORIGIN || "https://tidtu.pages.dev"),
		credentials: true,
	});
	return corsMiddlewareHandler(c, next);
});

app.route("/api/v1", router);

export default app;
