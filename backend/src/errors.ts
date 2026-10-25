/** An expected failure that maps to a 4xx response with the standard envelope. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

export const unauthorized = (message = 'Authentication required') =>
  new AppError(401, 'UNAUTHORIZED', message);
export const forbidden = (message = 'You do not have permission to do this') =>
  new AppError(403, 'FORBIDDEN', message);
export const vehicleNotFound = () => new AppError(404, 'VEHICLE_NOT_FOUND', 'Vehicle not found');
export const emailInUse = () => new AppError(409, 'EMAIL_IN_USE', 'Email already in use');
export const outOfStock = () =>
  new AppError(409, 'OUT_OF_STOCK', 'This vehicle is out of stock');
