import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";
import { resolve } from "path";

export default defineWorkersConfig({
	resolve: {
		alias: [
			{
				find: "lib",
				replacement: resolve(__dirname, "./src/lib/"),
			},
			{ find: "utils", replacement: resolve(__dirname, "./src/utils/") },
			{
				find: "controllers",
				replacement: resolve(__dirname, "./src/controllers/"),
			},
			{ find: "routes", replacement: resolve(__dirname, "./src/routes/") },
			{ find: "services", replacement: resolve(__dirname, "./src/services/") },
		],
	},
	test: {
		poolOptions: {
			workers: {
				wrangler: { configPath: "./wrangler.toml" },
			},
		},
	},
});
