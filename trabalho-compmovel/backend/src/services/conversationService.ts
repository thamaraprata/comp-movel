import { pool } from "../database/postgres.js";

export async function getOrCreateConversation(
  userId: number,
  city?: string
): Promise<number> {
  // Buscar conversa ativa
  const result = await pool.query(
    `SELECT id FROM conversations
     WHERE user_id = $1
     ORDER BY last_message_at DESC NULLS LAST
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length > 0) {
    return result.rows[0].id;
  }

  // Criar nova conversa
  const insert = await pool.query(
    `INSERT INTO conversations (user_id, title, weather_city, context_type)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    [userId, "Nova conversa", city, city ? "weather" : "general"]
  );

  return insert.rows[0].id;
}

export async function getConversationMessages(
  conversationId: number,
  limit = 30
): Promise<Array<{ role: string; content: string }>> {
  const result = await pool.query(
    `SELECT role, content
     FROM messages
     WHERE conversation_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [conversationId, limit]
  );

  return result.rows.reverse();
}

export async function saveMessage(
  conversationId: number,
  userId: number,
  role: "user" | "assistant",
  content: string,
  platform: "web" | "telegram",
  metadata?: any
): Promise<void> {
  await pool.query(
    `INSERT INTO messages (conversation_id, user_id, role, content, platform, metadata)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [conversationId, userId, role, content, platform, JSON.stringify(metadata || {})]
  );

  // Atualizar last_message_at
  await pool.query(
    `UPDATE conversations SET last_message_at = NOW() WHERE id = $1`,
    [conversationId]
  );
}

export async function getConversationSummary(conversationId: number): Promise<string | null> {
  const result = await pool.query(
    "SELECT summary FROM conversations WHERE id = $1",
    [conversationId]
  );
  return result.rows[0]?.summary || null;
}

export async function shouldGenerateSummary(conversationId: number): Promise<boolean> {
  const result = await pool.query(
    "SELECT COUNT(*) as count FROM messages WHERE conversation_id = $1",
    [conversationId]
  );
  const count = parseInt(result.rows[0].count);
  return count > 30 && count % 10 === 1;
}

export async function updateConversationSummary(
  conversationId: number,
  summary: string
): Promise<void> {
  await pool.query(
    "UPDATE conversations SET summary = $1 WHERE id = $2",
    [summary, conversationId]
  );
}
