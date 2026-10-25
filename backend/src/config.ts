function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required environment variable: ${name}`);
  return value;
}

/** Read once at startup; fails fast if the JWT secret is missing. */
export const config = {
  jwtSecret: required('JWT_SECRET'),
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
  port: Number(process.env.PORT ?? 3000),
};
