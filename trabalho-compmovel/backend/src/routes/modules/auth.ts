import { Router } from "express";
import { z } from "zod";
import { pool } from "../../database/postgres.js";
import * as authService from "../../services/authService.js";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// POST /api/auth/register
authRouter.post("/register", async (req, res) => {
  try {
    const { email, password, name } = registerSchema.parse(req.body);

    // Verificar se email já existe
    const existing = await pool.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ status: "error", message: "Email já cadastrado" });
    }

    // Criar usuário
    const passwordHash = await authService.hashPassword(password);
    const result = await pool.query(
      "INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name",
      [email, passwordHash, name]
    );

    const user = result.rows[0];

    // Gerar tokens
    const accessToken = authService.generateAccessToken(user.id, user.email);
    const refreshToken = authService.generateRefreshToken();
    await authService.saveRefreshToken(user.id, refreshToken);

    res.json({
      status: "success",
      data: { accessToken, refreshToken, user }
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// POST /api/auth/login
authRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Buscar usuário
    const result = await pool.query(
      "SELECT id, email, name, password_hash FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ status: "error", message: "Email ou senha inválidos" });
    }

    const user = result.rows[0];

    // Verificar senha
    const isValid = await authService.comparePassword(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ status: "error", message: "Email ou senha inválidos" });
    }

    // Gerar tokens
    const accessToken = authService.generateAccessToken(user.id, user.email);
    const refreshToken = authService.generateRefreshToken();
    await authService.saveRefreshToken(user.id, refreshToken);

    res.json({
      status: "success",
      data: {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, name: user.name }
      }
    });
  } catch (error: any) {
    res.status(400).json({ status: "error", message: error.message });
  }
});

// POST /api/auth/refresh
authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ status: "error", message: "Refresh token obrigatório" });
  }

  try {
    const payload = await authService.verifyRefreshToken(refreshToken);
    if (!payload) {
      return res.status(401).json({ status: "error", message: "Refresh token inválido" });
    }

    // Buscar usuário
    const result = await pool.query("SELECT email FROM users WHERE id = $1", [payload.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Usuário não encontrado" });
    }

    // Gerar novo access token
    const accessToken = authService.generateAccessToken(payload.userId, result.rows[0].email);

    res.json({ status: "success", data: { accessToken } });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/auth/me
authRouter.get("/me", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const result = await pool.query(
    "SELECT id, email, name, telegram_chat_id FROM users WHERE id = $1",
    [userId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ status: "error", message: "Usuário não encontrado" });
  }

  res.json({ status: "success", data: { user: result.rows[0] } });
});

// POST /api/auth/generate-telegram-code
authRouter.post("/generate-telegram-code", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  // Gerar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

  await pool.query(
    "UPDATE users SET verification_code = $1, verification_expires_at = $2 WHERE id = $3",
    [code, expiresAt, userId]
  );

  res.json({ status: "success", data: { code, expiresAt } });
});

// POST /api/auth/verify-telegram-code (usado pelo bot)
authRouter.post("/verify-telegram-code", async (req, res) => {
  const { code, telegramChatId } = req.body;

  if (!code || !telegramChatId) {
    return res.status(400).json({ status: "error", message: "Código e chat_id obrigatórios" });
  }

  const result = await pool.query(
    `SELECT id, name, email FROM users
     WHERE verification_code = $1
     AND verification_expires_at > NOW()`,
    [code]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ status: "error", message: "Código inválido ou expirado" });
  }

  const user = result.rows[0];

  // Vincular Telegram
  await pool.query(
    "UPDATE users SET telegram_chat_id = $1, verification_code = NULL WHERE id = $2",
    [telegramChatId, user.id]
  );

  res.json({
    status: "success",
    data: { user: { id: user.id, name: user.name, email: user.email } }
  });
});
