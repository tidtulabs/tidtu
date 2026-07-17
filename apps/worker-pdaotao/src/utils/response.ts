import { Context } from "hono";

export const success = (c: Context, data: any, meta?: object) => {
  c.status(200);
  const response: any = {
    success: true,
    data,
  };

  if (meta) {
    response.meta = meta;
  }
  return c.json(response);
};

export const error = (c: Context, message: string) => {
  c.status(500);
  return c.json({
    success: false,
    data: null,
    typeError: "SERVER_ERROR",
    message,
  });
};

export const notFound = (c: Context, message: string) => {
  c.status(404);
  return c.json({
    success: false,
    data: null,
    typeError: "NOT_FOUND",
    message,
  });
};

export const timeout = (c: Context, message: string) => {
  c.status(408);
  return c.json({
    success: false,
    data: null,
    typeError: "TIMEOUT",
    message,
  });
};

export const serverError = (c: Context, message: string) => {
  c.status(500);
  return c.json({
    success: false,
    data: null,
    typeError: "INTERNAL_ERROR",
    message,
  });
};

export const badRequest = (c: Context, message: string) => {
  c.status(400);
  return c.json({
    success: false,
    data: null,
    typeError: "BAD_REQUEST",
    message,
  });
};

export const limitExceeded = (c: Context, message: string) => {
  c.status(429);
  return c.json({
    success: false,
    data: null,
    typeError: "RATE_LIMIT_EXCEEDED",
    message,
  });
};
