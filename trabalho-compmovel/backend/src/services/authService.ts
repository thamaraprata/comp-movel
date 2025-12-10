import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../database/postgres.js";
import { ENV } from "../config/env.js";

const SALT_ROUNDS = 10;
const ACCESS_TOKEN_EXPIRES = "15m";
const REFRESH_TOKEN_EXPIRES_DAYS = 7;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function generateAccessToken(userId: number, email: string): string {
  return jwt.sign({ userId, email }, ENV.JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRES
  });
}

export function generateRefreshToken(): string {
  return uuidv4();
}

export async function saveRefreshToken(userId: number, token: string): Promise<void> {
  const tokenHash = await bcrypt.hash(token, 10);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRES_DAYS);

  await pool.query(
    "INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
    [userId, tokenHash, expiresAt]
  );
}

export async function verifyRefreshToken(token: string): Promise<{ userId: number } | null> {
  const result = await pool.query(
    "SELECT user_id, token_hash FROM refresh_tokens WHERE expires_at > NOW()"
  );

  for (const row of result.rows) {
    const isValid = await bcrypt.compare(token, row.token_hash);
    if (isValid) {
      return { userId: row.user_id };
    }
  }

  return null;
}

export function verifyAccessToken(token: string): { userId: number; email: string } {
  return jwt.verify(token, ENV.JWT_SECRET) as { userId: number; email: string };
}
