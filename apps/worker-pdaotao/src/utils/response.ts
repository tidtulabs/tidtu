import { Context } from "hono";

export const success = (
	c: Context,
	message: string,
	data: any,
	meta?: object,
) => {
	c.status(200);
	const response: any = {
		success: true,
		message,
		response: {
			data,
		},
	};

	if (meta) {
		response.meta = meta;
	}
	return c.json(response);
};

//  errror
export const error = (c: Context, message: string, error: any = null) => {
	c.status(500);
	return c.json({
		success: false,
		message,
		error,
	});
};

export const notFound = (c: Context, message: string, typeError?:string) => {
	c.status(404);
	return c.json({
		success: false,
		message,
    typeError: typeError || "NOT_FOUND",
		data: null,
	});
};
export const timeout = (c: Context, message: string) => {
	c.status(408);
	return c.json({
		success: false,
		message,
		data: null,
	});
};

/**
 @param {Context} c
 @param {string} message
 */
export const serverError = (c: Context, message: string) => {
	c.status(500);
	return c.json({
		success: false,
    typeError: "SERVER_ERROR",
		message,
		data: null,
	});
};

export const badRequest = (c: Context, message: string) => {
	c.status(400);
	return c.json({
		success: false,
		message,
		data: null,
	});
};


export const limitExceeded = (c: Context, message: string) => {
  c.status(429);
  return c.json({
    success: false,
    typeError: "RATE_LIMIT_EXCEEDED",
    message,
    data: null,
  });
}
