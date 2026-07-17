export class HttpError extends Error {
  status: number;
  typeError: string | null;
  constructor(message: string, status: number, typeError: string | null = null) {
    super(message);
    this.status = status;
    this.typeError = typeError;
    this.name = "HttpError";
  }
}
