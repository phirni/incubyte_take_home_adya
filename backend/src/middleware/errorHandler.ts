import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../errors';

function sendError(
  res: Parameters<RequestHandler>[1],
  status: number,
  code: string,
  message: string,
): void {
  res.status(status).json({ error: { code, message } });
}

export const notFoundHandler: RequestHandler = (_req, res) => {
  sendError(res, 404, 'NOT_FOUND', 'Route not found');
};

/** Last middleware: turns every thrown error into the uniform envelope. */
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    sendError(res, err.status, err.code, err.message);
    return;
  }
  if (err instanceof ZodError) {
    const issue = err.issues[0];
    const field = issue.path.join('.');
    sendError(res, 400, 'VALIDATION_ERROR', field ? `${field}: ${issue.message}` : issue.message);
    return;
  }
  if ((err as { type?: string })?.type === 'entity.parse.failed') {
    sendError(res, 400, 'VALIDATION_ERROR', 'Request body is not valid JSON');
    return;
  }
  console.error(err); // server-side only; never sent to the client
  sendError(res, 500, 'INTERNAL_ERROR', 'Something went wrong');
};
