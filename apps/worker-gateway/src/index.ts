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
    origin: c.env.NODE_ENV === "dev" ? (origin) => origin || allowedOrigin : allowedOrigin,
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

// ──────────────────────────────────────────
// POST /api/v1/feedback
// ──────────────────────────────────────────
app.post("/api/v1/feedback", async (c) => {
  const contentType = c.req.header("Content-Type") || "";
  const isMultipart = contentType.includes("multipart/form-data");

  let type: "feedback" | "bug" = "feedback";
  let title: string | undefined;
  let content: string;
  let turnstileToken: string;
  let quick: boolean = false;
  const images: { file: File; name: string }[] = [];

  if (isMultipart) {
    const formData = await c.req.formData();
    type = (formData.get("type") as "feedback" | "bug") || "feedback";
    title = (formData.get("title") as string) || undefined;
    content = (formData.get("content") as string) || "";
    turnstileToken = (formData.get("turnstileToken") as string) || "";
    quick = formData.get("quick") === "true";

    {
      const file = formData.get("image0") as File | null;
      if (file && file.size > 0 && file.type.startsWith("image/")) {
        const ext = (file.name?.split(".").pop() || "png").toLowerCase();
        images.push({ file, name: `feedback_img.${ext}` });
      }
    }
  } else {
    try {
      const body = await c.req.json<any>();
      type = body.type || "feedback";
      title = body.title || undefined;
      content = body.content;
      turnstileToken = body.turnstileToken;
      quick = body.quick === true;
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
  }

  if (!content?.trim()) {
    return c.json({ error: "Nội dung không được để trống" }, 400);
  }

  // Quick auto-reports skip Turnstile (rate limiter still applies)
  if (!quick) {
    if (!turnstileToken) {
      return c.json({ error: "Thiếu mã xác thực Turnstile" }, 400);
    }

    const turnstileForm = new FormData();
    turnstileForm.append("secret", c.env.TURNSTILE_SECRET_KEY);
    turnstileForm.append("response", turnstileToken);
    const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      body: turnstileForm,
    });
    const { success: tokenValid } = await verifyRes.json<{ success: boolean }>();
    if (!tokenValid) {
      return c.json({ error: "Xác thực bảo mật thất bại" }, 400);
    }
  }

  // 2. Forward to Discord webhook
  const isBug = type === "bug";
  const embeds: Record<string, any>[] = [
    {
      title: title?.trim()
        ? isBug
          ? `🐞 ${title.trim()}`
          : `💡 ${title.trim()}`
        : isBug
          ? "🐞 Báo cáo lỗi mới"
          : "💡 Ý kiến góp ý mới",
      description: content.trim(),
      color: isBug ? 0xff4444 : 0x5865f2,
      footer: { text: quick ? "TIDTU Hệ thống" : "TIDTU Feedback" },
      timestamp: new Date().toISOString(),
    },
  ];

  if (images.length > 0) {
    embeds.push({
      image: { url: `attachment://${images[0].name}` },
      color: isBug ? 0xff4444 : 0x5865f2,
    });
  }

  const discordForm = new FormData();
  discordForm.append("payload_json", JSON.stringify({ embeds }));
  for (const img of images) {
    const buffer = await img.file.arrayBuffer();
    const blob = new Blob([buffer], { type: img.file.type });
    discordForm.append("file", blob, img.name);
  }

  const webhookRes = await fetch(c.env.DISCORD_WEBHOOK_URL, {
    method: "POST",
    body: discordForm,
  });

  if (!webhookRes.ok) {
    console.error("Discord webhook failed:", await webhookRes.text());
    return c.json({ error: "Không thể gửi feedback, vui lòng thử lại" }, 502);
  }

  return c.json({ success: true }, 200);
});

app.all("*", async (c) => {
  const clones = [c.env.CLONE_1, c.env.CLONE_2, c.env.CLONE_3].filter(
    (clone): clone is Fetcher => clone !== undefined,
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
          responseHeaders["Set-Cookie"] =
            `deviceId=${c.var.deviceId}; Path=/; Secure; HttpOnly; SameSite=Lax`;
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

  return c.json(
    {
      error: "All worker clones failed to respond",
      details: lastError?.message || String(lastError),
    },
    502,
  );
});

export default app;
