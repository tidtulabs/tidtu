import { Hono } from "hono";
import { cors } from "hono/cors";
import { getCookie } from "hono/cookie";

const app = new Hono<{
	Bindings: CloudflareBindings;
	Variables: {
		deviceId: string;
		isNewDevice: boolean;
	};
}>();

app.use("*", async (c, next) => {
	const allowedOrigin = c.env.CORS_ORIGIN || "https://tidtu.pages.dev";
	const corsMiddlewareHandler = cors({
		origin: (origin) => {
			const isLocal = origin === "http://localhost:5173" || origin?.startsWith("http://localhost:");
			if (isLocal || origin === allowedOrigin) {
				return origin;
			}
			return allowedOrigin;
		},
		credentials: true,
		allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
		allowHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
		exposeHeaders: ["Content-Length", "X-Gateway-Handled-By"],
	});
	return corsMiddlewareHandler(c, next);
});

app.use("*", async (c, next) => {
	if (c.req.method === "OPTIONS") {
		return next();
	}

	const allGetCookie = getCookie(c);
	let deviceId = allGetCookie.deviceId;
	let isNewDevice = false;
	let limitKey = "";

	if (deviceId) {
		limitKey = deviceId;
	} else {
		deviceId = crypto.randomUUID();
		isNewDevice = true;

		const clientIP = c.req.header("CF-Connecting-IP") || "anonymous";
		const userAgent = c.req.header("User-Agent") || "";
		limitKey = `anon:${clientIP}:${userAgent}`;
	}

	c.set("deviceId", deviceId);
	c.set("isNewDevice", isNewDevice);

	const { success } = await c.env.MY_RATE_LIMITER.limit({ key: limitKey });
	if (!success) {
		return c.json({ error: "Too Many Requests", message: "Rate limit exceeded" }, 429);
	}

	await next();
});

app.all("*", async (c) => {
	const clones = [c.env.CLONE_1, c.env.CLONE_2, c.env.CLONE_3].filter(
		(clone): clone is Fetcher => clone !== undefined
	);

	if (clones.length === 0) {
		return c.json({ error: "No worker clones configured or bound to Gateway" }, 500);
	}

	// Load balancing: pick a random starting index
	const startIndex = Math.floor(Math.random() * clones.length);
	let lastError: any = null;

	for (let i = 0; i < clones.length; i++) {
		const currentIndex = (startIndex + i) % clones.length;
		const clone = clones[currentIndex];
		const cloneName = `CLONE_${currentIndex + 1}`;

		try {
			// Clone the request for this attempt to allow retries
			const reqClone = c.req.raw.clone();
			const response = await clone.fetch(reqClone);

			// If response is successful or a normal client error (not 5xx), return it immediately
			if (response.status < 500) {
				// Set custom tracking header on the context response
				c.header("X-Gateway-Handled-By", cloneName);

				// Strip clone's CORS headers to avoid duplicates with Hono's cors middleware
				const headers = new Headers(response.headers);
				headers.delete("Access-Control-Allow-Origin");
				headers.delete("Access-Control-Allow-Credentials");
				headers.delete("Access-Control-Allow-Methods");
				headers.delete("Access-Control-Allow-Headers");
				headers.delete("Access-Control-Max-Age");

				const responseHeaders: Record<string, string> = {};
				headers.forEach((value, key) => {
					responseHeaders[key] = value;
				});

				if (c.var.isNewDevice) {
					responseHeaders["Set-Cookie"] = `deviceId=${c.var.deviceId}; Path=/; Secure; HttpOnly; SameSite=Lax`;
				}

				// Return using c.body so Hono's middleware executes on the response
				return c.body(response.body as any, response.status as any, responseHeaders as any);
			}

			lastError = new Error(`Clone ${cloneName} returned status ${response.status}`);
		} catch (err: any) {
			console.error(`Error forwarding to clone ${cloneName}:`, err);
			lastError = err;
		}
	}

	return c.json({
		error: "All worker clones failed to respond",
		details: lastError?.message || String(lastError),
	}, 502);
});

export default app;
