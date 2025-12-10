import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../../middleware/auth.js";
import * as chatService from "../../services/chatService.js";
import { pool } from "../../database/postgres.js";

export const chatRouter = Router();

const sendMessageSchema = z.object({
  message: z.string().min(1),
  city: z.string().optional()
});

// POST /api/chat/message
chatRouter.post("/message", authMiddleware, async (req: AuthRequest, res) => {
  try {
    const { message, city } = sendMessageSchema.parse(req.body);
    const userId = req.user!.userId;

    const result = await chatService.processMessage(userId, message, city, "web");

    res.json({
      status: "success",
      data: {
        conversationId: result.conversationId,
        response: result.aiResponse,
        timestamp: new Date()
      }
    });
  } catch (error: any) {
    res.status(500).json({ status: "error", message: error.message });
  }
});

// GET /api/chat/conversations
chatRouter.get("/conversations", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const result = await pool.query(
    `SELECT id, title, weather_city, last_message_at, created_at
     FROM conversations
     WHERE user_id = $1
     ORDER BY last_message_at DESC NULLS LAST`,
    [userId]
  );

  res.json({ status: "success", data: result.rows });
});

// GET /api/chat/conversations/:id/messages
chatRouter.get(
  "/conversations/:id/messages",
  authMiddleware,
  async (req: AuthRequest, res) => {
    const conversationId = parseInt(req.params.id);
    const userId = req.user!.userId;

    // Verificar se conversa pertence ao usuário
    const conv = await pool.query(
      "SELECT id FROM conversations WHERE id = $1 AND user_id = $2",
      [conversationId, userId]
    );

    if (conv.rows.length === 0) {
      return res.status(404).json({ status: "error", message: "Conversa não encontrada" });
    }

    const result = await pool.query(
      `SELECT id, role, content, platform, created_at
       FROM messages
       WHERE conversation_id = $1
       ORDER BY created_at ASC`,
      [conversationId]
    );

    res.json({ status: "success", data: result.rows });
  }
);
