export default class AppError extends Error {
  code: string;

  statusCode: number;

  details?: { [key: string]: any };

  constructor(
    code: string,
    statusCode: number,
    message: string,
    details?: { [key: string]: any },
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}
