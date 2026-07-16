import express, { Express } from "express";
import "dotenv/config";
import cors from "cors";
import routes from "./routes";
import { getKV } from "@config/cloudflare";
import { logger } from "@utils/winston";

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
	cors({
		origin: process.env.NODE_ENV === "dev"
			? true
			: (process.env.CORS_ORIGIN || "https://tidtu.pages.dev"),
		optionsSuccessStatus: 200,
	}),
);

app.use(express.json());
app.use("/api/v1", routes);

app.listen(port, async () => {
	try {
		await getKV();
		const mode = process.env.NODE_ENV === "dev" ? "Miniflare" : "Cloudflare API";
		logger.info(`[kv]: connected using ${mode}`);
	} catch (error: any) {
		logger.error(`[kv]: failed to initialize — ${error.message}`);
	}
	logger.info(`[server]: is running at http://localhost:${port}`);
});
