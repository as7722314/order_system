export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly details: unknown[];

  public constructor(code: string, message: string, status = 400, details: unknown[] = []) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}
