import express, { Express } from "express";
import "dotenv/config";
import cors from "cors";
import routes from "./routes";
import { logger } from "@utils/winston";

const app: Express = express();
const port = process.env.PORT || 3000;

app.use(
	cors({
		origin: process.env.CORS_ORIGIN,
		optionsSuccessStatus: 200,
	}),
);

app.use(express.json());
app.use("/api/v1", routes);

app.listen(port, () => {
	logger.info(`[server]: is running at http://localhost:${port}`);
});
