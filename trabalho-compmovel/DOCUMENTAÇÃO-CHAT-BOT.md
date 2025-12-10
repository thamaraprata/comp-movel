# Plano de Implementação: Sistema de Autenticação + Chatbot com Continuidade

## Visão Geral

Implementar um sistema completo de autenticação JWT com chatbot conversacional integrado ao Gemini AI, que mantém continuidade de contexto entre web app e Telegram Bot, seguindo princípios de computação móvel e ubíqua.

## Decisões do Usuário

- **Autenticação**: JWT simples (email + senha) com refresh tokens
- **Vinculação Telegram**: Código de verificação de 6 dígitos
- **Chatbot**: Conversacional livre usando Gemini AI
- **Contexto**: Últimas 30 mensagens + resumo inteligente

---

## Fase 1: Schema do Banco + Autenticação Backend

### 1.1 Criar Migração SQL

**Arquivo**: `backend/database/migrations/001_create_auth_tables.sql`

```sql
-- Tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    telegram_chat_id BIGINT UNIQUE,
    verification_code VARCHAR(6),
    verification_expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_telegram_chat_id ON users(telegram_chat_id);
CREATE INDEX idx_users_verification_code ON users(verification_code);

-- Refresh tokens
CREATE TABLE IF NOT EXISTS refresh_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);

-- Conversas
CREATE TABLE IF NOT EXISTS conversations (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    context_type VARCHAR(50) DEFAULT 'general',
    weather_city VARCHAR(100),
    summary TEXT,
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id, updated_at DESC);
CREATE INDEX idx_conversations_last_message ON conversations(last_message_at DESC);

-- Mensagens
CREATE TABLE IF NOT EXISTS messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    platform VARCHAR(20) DEFAULT 'web' CHECK (platform IN ('web', 'telegram')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id, created_at DESC);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
```

**Executar**: Adicionar ao `backend/database/migrate.ts` ou executar manualmente.

### 1.2 Serviço de Autenticação

**Arquivo**: `backend/src/services/authService.ts`

```typescript
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../database/connection";
import { ENV } from "../config/env";

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
```

### 1.3 Middleware de Autenticação

**Arquivo**: `backend/src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../services/authService";

export interface AuthRequest extends Request {
  user?: { userId: number; email: string };
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ status: "error", message: "Token não fornecido" });
  }

  const token = authHeader.substring(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ status: "error", message: "Token inválido ou expirado" });
  }
}
```

### 1.4 Rotas de Autenticação

**Arquivo**: `backend/src/routes/modules/auth.ts`

```typescript
import { Router } from "express";
import { z } from "zod";
import { pool } from "../../database/connection";
import * as authService from "../../services/authService";
import { authMiddleware, AuthRequest } from "../../middleware/auth";

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
```

### 1.5 Atualizar Configuração

**Modificar**: `backend/src/config/env.ts`

```typescript
const envSchema = z.object({
  // ... existentes
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default("15m"),
  REFRESH_TOKEN_EXPIRES_DAYS: z.coerce.number().default(7)
});
```

**Adicionar ao `.env`**:
```
JWT_SECRET=seu_secret_super_seguro_aqui_minimo_32_caracteres
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_DAYS=7
```

### 1.6 Registrar Rotas

**Modificar**: `backend/src/routes/index.ts`

```typescript
import { authRouter } from "./modules/auth";

routes.use("/auth", authRouter);
```

### 1.7 Dependências

```bash
cd backend
npm install bcrypt jsonwebtoken uuid
npm install -D @types/bcrypt @types/jsonwebtoken @types/uuid
```

---

## Fase 2: Frontend de Autenticação

### 2.1 Serviço de Autenticação

**Arquivo**: `frontend/src/services/authApi.ts`

```typescript
import api from "./api";

export async function register(email: string, password: string, name: string) {
  const { data } = await api.post("/auth/register", { email, password, name });
  return data.data;
}

export async function login(email: string, password: string) {
  const { data } = await api.post("/auth/login", { email, password });
  return data.data;
}

export async function getCurrentUser() {
  const { data } = await api.get("/auth/me");
  return data.data.user;
}

export async function refreshAccessToken(refreshToken: string) {
  const { data } = await api.post("/auth/refresh", { refreshToken });
  return data.data.accessToken;
}
```

### 2.2 Interceptores Axios

**Modificar**: `frontend/src/services/api.ts`

```typescript
// Adicionar após criação da instância api

// Request interceptor: Adicionar token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: Refresh automático
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refreshToken");
      if (refreshToken) {
        try {
          const { refreshAccessToken } = await import("./authApi");
          const newAccessToken = await refreshAccessToken(refreshToken);
          localStorage.setItem("accessToken", newAccessToken);

          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Logout
          localStorage.clear();
          window.location.href = "/";
        }
      }
    }

    return Promise.reject(error);
  }
);
```

### 2.3 Atualizar Login

**Modificar**: `frontend/src/pages/Login.tsx`

```typescript
import { login } from "../services/authApi";

// Substituir handleSubmit:
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError("");
  setLoading(true);

  try {
    const response = await login(email, password);
    localStorage.setItem("accessToken", response.accessToken);
    localStorage.setItem("refreshToken", response.refreshToken);
    onLogin(response.user);
  } catch (err: any) {
    setError(err.response?.data?.message || "Erro ao fazer login");
  } finally {
    setLoading(false);
  }
};
```

### 2.4 Criar Página de Registro

**Arquivo**: `frontend/src/pages/Register.tsx`

```typescript
import { useState } from "react";
import { register } from "../services/authApi";

interface RegisterProps {
  onRegister: (user: any) => void;
  onBackToLogin: () => void;
}

export function Register({ onRegister, onBackToLogin }: RegisterProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("As senhas não coincidem");
      return;
    }

    if (password.length < 6) {
      setError("A senha deve ter no mínimo 6 caracteres");
      return;
    }

    setLoading(true);

    try {
      const response = await register(email, password, name);
      localStorage.setItem("accessToken", response.accessToken);
      localStorage.setItem("refreshToken", response.refreshToken);
      onRegister(response.user);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao criar conta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900">
      <div className="card p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6">Criar Conta</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Confirmar Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2 border rounded"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>

        <button
          onClick={onBackToLogin}
          className="mt-4 text-blue-600 hover:underline text-sm"
        >
          ← Voltar para Login
        </button>
      </div>
    </div>
  );
}
```

### 2.5 Atualizar App.tsx

**Modificar**: `frontend/src/App.tsx`

```typescript
import { Register } from "./pages/Register";

// Adicionar estado de view
const [view, setView] = useState<"login" | "register" | "dashboard">("login");

// Renderizar condicionalmente
if (!isAuthenticated || !user) {
  if (view === "register") {
    return (
      <Register
        onRegister={handleLogin}
        onBackToLogin={() => setView("login")}
      />
    );
  }
  return (
    <Login
      onLogin={handleLogin}
      onRegister={() => setView("register")}
    />
  );
}
```

---

## Fase 3: Chatbot Backend + Integração Gemini

### 3.1 Serviço de Conversas

**Arquivo**: `backend/src/services/conversationService.ts`

```typescript
import { pool } from "../database/connection";

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

export async function generateAndSaveSummary(conversationId: number): Promise<void> {
  // Será implementado na integração com Gemini
}
```

### 3.2 Integração Gemini para Chat

**Arquivo**: `backend/src/integrations/geminiChat.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../config/logger";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const client = GEMINI_API_KEY ? new GoogleGenerativeAI(GEMINI_API_KEY) : null;

interface ChatContext {
  summary?: string;
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  weatherData?: {
    temperature: number;
    humidity: number;
    conditions: string;
    windSpeed: number;
    city: string;
  };
  userMessage: string;
}

export async function generateChatResponse(context: ChatContext): Promise<string> {
  if (!client) {
    return "Serviço de chat temporariamente indisponível.";
  }

  const model = client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = buildPrompt(context);

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error(error, "Erro ao gerar resposta do chat");
    return "Desculpe, tive um problema ao processar sua mensagem. Pode tentar novamente?";
  }
}

function buildPrompt(context: ChatContext): string {
  let prompt = `Você é um assistente climático conversacional e prestativo. Responda de forma natural e contextualizada.

`;

  if (context.summary) {
    prompt += `RESUMO DA CONVERSA ANTERIOR:
${context.summary}

`;
  }

  if (context.weatherData) {
    prompt += `DADOS CLIMÁTICOS ATUAIS EM ${context.weatherData.city}:
- Temperatura: ${context.weatherData.temperature}°C
- Umidade: ${context.weatherData.humidity}%
- Condições: ${context.weatherData.conditions}
- Vento: ${context.weatherData.windSpeed} km/h

`;
  }

  if (context.messages.length > 0) {
    prompt += `HISTÓRICO RECENTE DA CONVERSA:
${context.messages.map((m) => `${m.role === "user" ? "Usuário" : "Você"}: ${m.content}`).join("\n")}

`;
  }

  prompt += `Usuário: ${context.userMessage}

Responda de forma útil, natural e contextualizada:`;

  return prompt;
}

export async function generateConversationSummary(
  messages: Array<{ role: string; content: string }>
): Promise<string> {
  if (!client) {
    return "Resumo indisponível";
  }

  const model = client.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

  const prompt = `Resuma esta conversa em um parágrafo conciso (máximo 200 palavras):

${messages.map((m) => `${m.role === "user" ? "Usuário" : "Assistente"}: ${m.content}`).join("\n")}

Foque em: tópicos discutidos, informações climáticas, dúvidas do usuário, e recomendações dadas.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    logger.error(error, "Erro ao gerar resumo");
    return "Resumo indisponível";
  }
}
```

### 3.3 Serviço de Chat

**Arquivo**: `backend/src/services/chatService.ts`

```typescript
import * as conversationService from "./conversationService";
import * as geminiChat from "../integrations/geminiChat";
import { getWeatherData } from "../integrations/openweather";
import { logger } from "../config/logger";

export async function processMessage(
  userId: number,
  userMessage: string,
  city?: string,
  platform: "web" | "telegram" = "web"
): Promise<{ conversationId: number; aiResponse: string }> {
  try {
    // 1. Buscar ou criar conversa
    const conversationId = await conversationService.getOrCreateConversation(userId, city);

    // 2. Salvar mensagem do usuário
    await conversationService.saveMessage(
      conversationId,
      userId,
      "user",
      userMessage,
      platform
    );

    // 3. Buscar contexto
    const messages = await conversationService.getConversationMessages(conversationId, 30);
    const summary = await conversationService.getConversationSummary(conversationId);

    // 4. Buscar dados climáticos (se cidade fornecida)
    let weatherData;
    if (city) {
      const weather = await getWeatherData(city);
      if (weather) {
        weatherData = { ...weather, city };
      }
    }

    // 5. Gerar resposta da IA
    const aiResponse = await geminiChat.generateChatResponse({
      summary: summary || undefined,
      messages,
      weatherData,
      userMessage
    });

    // 6. Salvar resposta da IA
    await conversationService.saveMessage(
      conversationId,
      userId,
      "assistant",
      aiResponse,
      platform,
      weatherData
    );

    // 7. Verificar se precisa gerar resumo (em background)
    if (await conversationService.shouldGenerateSummary(conversationId)) {
      generateSummaryInBackground(conversationId);
    }

    return { conversationId, aiResponse };
  } catch (error) {
    logger.error(error, "Erro ao processar mensagem");
    throw error;
  }
}

async function generateSummaryInBackground(conversationId: number): Promise<void> {
  try {
    const allMessages = await conversationService.getConversationMessages(conversationId, 1000);
    const summary = await geminiChat.generateConversationSummary(allMessages);

    await pool.query("UPDATE conversations SET summary = $1 WHERE id = $2", [
      summary,
      conversationId
    ]);

    logger.info({ conversationId }, "Resumo gerado com sucesso");
  } catch (error) {
    logger.error(error, "Erro ao gerar resumo em background");
  }
}
```

### 3.4 Rotas de Chat

**Arquivo**: `backend/src/routes/modules/chat.ts`

```typescript
import { Router } from "express";
import { z } from "zod";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import * as chatService from "../../services/chatService";
import { pool } from "../../database/connection";

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
```

**Registrar**: `backend/src/routes/index.ts`

```typescript
import { chatRouter } from "./modules/chat";
routes.use("/chat", chatRouter);
```

---

## Fase 4: Interface de Chat Frontend

### 4.1 Store de Chat

**Arquivo**: `frontend/src/stores/chatStore.ts`

```typescript
import { create } from "zustand";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  platform: "web" | "telegram";
  created_at: string;
}

interface Conversation {
  id: number;
  title: string;
  weather_city?: string;
  last_message_at?: string;
  created_at: string;
}

interface ChatState {
  conversations: Conversation[];
  currentConversationId: number | null;
  messages: Message[];
  loading: boolean;
  setConversations: (conversations: Conversation[]) => void;
  setCurrentConversation: (id: number) => void;
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
  setLoading: (loading: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  loading: false,
  setConversations: (conversations) => set({ conversations }),
  setCurrentConversation: (id) => set({ currentConversationId: id }),
  setMessages: (messages) => set({ messages }),
  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),
  setLoading: (loading) => set({ loading })
}));
```

### 4.2 API de Chat

**Arquivo**: `frontend/src/services/chatApi.ts`

```typescript
import api from "./api";

export async function sendMessage(message: string, city?: string) {
  const { data } = await api.post("/chat/message", { message, city });
  return data.data;
}

export async function getUserConversations() {
  const { data } = await api.get("/chat/conversations");
  return data.data;
}

export async function getConversationMessages(conversationId: number) {
  const { data } = await api.get(`/chat/conversations/${conversationId}/messages`);
  return data.data;
}
```

### 4.3 Componente de Chat

**Arquivo**: `frontend/src/components/ChatInterface.tsx`

```typescript
import { useState, useEffect, useRef } from "react";
import { useChatStore } from "../stores/chatStore";
import { sendMessage, getUserConversations, getConversationMessages } from "../services/chatApi";
import { Send } from "lucide-react";

export function ChatInterface() {
  const [inputMessage, setInputMessage] = useState("");
  const [selectedCity, setSelectedCity] = useState("São Paulo");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, loading, setMessages, addMessage, setLoading } = useChatStore();

  useEffect(() => {
    // Carregar conversas ao montar
    loadConversations();
  }, []);

  useEffect(() => {
    // Auto-scroll para última mensagem
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function loadConversations() {
    const convs = await getUserConversations();
    if (convs.length > 0) {
      const msgs = await getConversationMessages(convs[0].id);
      setMessages(msgs);
    }
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputMessage.trim() || loading) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setLoading(true);

    try {
      const result = await sendMessage(userMessage, selectedCity);

      // Adicionar mensagens localmente
      addMessage({
        id: Date.now(),
        role: "user",
        content: userMessage,
        platform: "web",
        created_at: new Date().toISOString()
      });

      addMessage({
        id: Date.now() + 1,
        role: "assistant",
        content: result.response,
        platform: "web",
        created_at: new Date().toISOString()
      });
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-[600px] card overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <h2 className="font-semibold">Chat Climático</h2>
        <select
          value={selectedCity}
          onChange={(e) => setSelectedCity(e.target.value)}
          className="px-3 py-1 border rounded text-sm"
        >
          <option>São Paulo</option>
          <option>Rio de Janeiro</option>
          <option>Belo Horizonte</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            Envie uma mensagem para começar a conversar! 💬
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                msg.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
              {msg.platform === "telegram" && (
                <div className="text-xs opacity-70 mt-1">📱 Telegram</div>
              )}
            </div>
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
        <input
          type="text"
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          placeholder="Digite sua mensagem..."
          disabled={loading}
          className="flex-1 px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading || !inputMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Send size={18} />
          {loading ? "..." : "Enviar"}
        </button>
      </form>
    </div>
  );
}
```

### 4.4 Integrar no Dashboard

**Modificar**: `frontend/src/pages/Dashboard.tsx`

```typescript
import { ChatInterface } from "../components/ChatInterface";

// Adicionar seção no layout:
<section className="mt-6">
  <h2 className="text-lg font-semibold mb-4">Chat com IA</h2>
  <ChatInterface />
</section>
```

---

## Fase 5: Vinculação Telegram

### 5.1 Rotas de Vinculação

**Arquivo**: `backend/src/routes/modules/telegram-link.ts`

```typescript
import { Router } from "express";
import { authMiddleware, AuthRequest } from "../../middleware/auth";
import { pool } from "../../database/connection";

export const telegramLinkRouter = Router();

// POST /api/telegram/generate-code
telegramLinkRouter.post("/generate-code", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  // Gerar código de 6 dígitos
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10); // 10 minutos

  await pool.query(
    "UPDATE users SET verification_code = $1, verification_expires_at = $2 WHERE id = $3",
    [code, expiresAt, userId]
  );

  res.json({
    status: "success",
    data: { code, expiresAt }
  });
});

// GET /api/telegram/status
telegramLinkRouter.get("/status", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const result = await pool.query(
    "SELECT telegram_chat_id FROM users WHERE id = $1",
    [userId]
  );

  const linked = result.rows[0]?.telegram_chat_id ? true : false;

  res.json({
    status: "success",
    data: { linked, chatId: result.rows[0]?.telegram_chat_id }
  });
});

// POST /api/telegram/unlink
telegramLinkRouter.post("/unlink", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  await pool.query(
    "UPDATE users SET telegram_chat_id = NULL WHERE id = $1",
    [userId]
  );

  res.json({ status: "success" });
});
```

**Registrar**: `backend/src/routes/index.ts`

```typescript
import { telegramLinkRouter } from "./modules/telegram-link";
routes.use("/telegram", telegramLinkRouter);
```

### 5.2 Atualizar Bot Telegram

**Modificar**: `backend/src/integrations/telegram.ts`

```typescript
import { pool } from "../database/connection";
import * as chatService from "../services/chatService";

// Função helper
async function getUserByTelegramId(chatId: number): Promise<any | null> {
  const result = await pool.query(
    "SELECT id, email, name FROM users WHERE telegram_chat_id = $1",
    [chatId]
  );
  return result.rows[0] || null;
}

// COMANDO: /vincular
bot.command("vincular", async (ctx) => {
  await ctx.reply(
    "🔐 *Vinculação de Conta*\n\n" +
      "Para vincular sua conta:\n\n" +
      "1. Acesse o aplicativo web\n" +
      "2. Vá em 'Vincular Telegram'\n" +
      "3. Gere o código de 6 dígitos\n" +
      "4. Envie: `/codigo SEU_CODIGO`\n\n" +
      "Exemplo: `/codigo 123456`",
    { parse_mode: "Markdown" }
  );
});

// COMANDO: /codigo
bot.command("codigo", async (ctx) => {
  const chatId = ctx.from?.id;
  const text = ctx.message?.text || "";
  const code = text.split(" ")[1]?.trim();

  if (!chatId || !code || code.length !== 6) {
    await ctx.reply("❌ Use: /codigo 123456");
    return;
  }

  try {
    // Buscar usuário com esse código
    const result = await pool.query(
      `SELECT id, email, name FROM users
       WHERE verification_code = $1
         AND verification_expires_at > NOW()`,
      [code]
    );

    if (result.rows.length === 0) {
      await ctx.reply("❌ Código inválido ou expirado.");
      return;
    }

    const user = result.rows[0];

    // Vincular telegram_chat_id
    await pool.query(
      `UPDATE users
       SET telegram_chat_id = $1,
           verification_code = NULL,
           verification_expires_at = NULL
       WHERE id = $2`,
      [chatId, user.id]
    );

    await ctx.reply(
      `✅ *Conta vinculada!*\n\n` +
        `📧 ${user.email}\n` +
        `👤 ${user.name}\n\n` +
        `Agora você pode usar o /chat para conversar!`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    logger.error(error, "Erro ao vincular");
    await ctx.reply("❌ Erro ao vincular. Tente novamente.");
  }
});

// COMANDO: /chat (conversacional)
bot.command("chat", async (ctx) => {
  const chatId = ctx.from?.id;
  const user = chatId ? await getUserByTelegramId(chatId) : null;

  if (!user) {
    await ctx.reply("❌ Use /vincular primeiro para conectar sua conta.");
    return;
  }

  const text = ctx.message?.text || "";
  const message = text.replace("/chat", "").trim();

  if (!message) {
    await ctx.reply("💬 Use: /chat Sua mensagem aqui");
    return;
  }

  await ctx.reply("💭 Processando...");

  try {
    const response = await chatService.processMessage(user.id, message, undefined, "telegram");
    await ctx.reply(response.aiResponse);
  } catch (error) {
    logger.error(error, "Erro no /chat");
    await ctx.reply("❌ Erro ao processar mensagem.");
  }
});

// Atualizar outros comandos para verificar vinculação
bot.command("clima", async (ctx) => {
  const chatId = ctx.from?.id;
  const user = chatId ? await getUserByTelegramId(chatId) : null;

  if (!user) {
    await ctx.reply("❌ Use /vincular primeiro.");
    return;
  }

  // ... resto do código
});
```

### 5.3 Componente de Vinculação Frontend

**Arquivo**: `frontend/src/components/TelegramLink.tsx`

```typescript
import { useState, useEffect } from "react";
import api from "../services/api";

export function TelegramLink() {
  const [linked, setLinked] = useState(false);
  const [code, setCode] = useState("");
  const [expiresAt, setExpiresAt] = useState<Date | null>(null);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    checkStatus();
  }, []);

  useEffect(() => {
    if (!expiresAt) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
      setCountdown(remaining);

      if (remaining === 0) {
        setCode("");
        setExpiresAt(null);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  async function checkStatus() {
    const { data } = await api.get("/telegram/status");
    setLinked(data.data.linked);
  }

  async function generateCode() {
    const { data } = await api.post("/telegram/generate-code");
    setCode(data.data.code);
    setExpiresAt(new Date(data.data.expiresAt));
  }

  async function unlink() {
    await api.post("/telegram/unlink");
    setLinked(false);
  }

  if (linked) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">✅</span>
          <div>
            <h3 className="font-semibold">Telegram Vinculado</h3>
            <p className="text-sm text-gray-600">Sua conta está conectada ao Telegram</p>
          </div>
        </div>
        <button
          onClick={unlink}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Desvincular
        </button>
      </div>
    );
  }

  return (
    <div className="card p-6">
      <h3 className="font-semibold mb-2">Vincular Telegram</h3>
      <p className="text-sm text-gray-600 mb-4">
        Conecte sua conta ao Telegram para continuar conversas entre plataformas
      </p>

      {!code ? (
        <button
          onClick={generateCode}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Gerar Código de Vinculação
        </button>
      ) : (
        <div>
          <div className="bg-blue-100 dark:bg-blue-900 p-4 rounded mb-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Seu código de vinculação:
              </div>
              <div className="text-4xl font-bold font-mono text-blue-600 dark:text-blue-400 mb-2">
                {code}
              </div>
              <div className="text-sm text-gray-500">
                Expira em: {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, "0")}
              </div>
            </div>
          </div>

          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded text-sm space-y-2">
            <p className="font-semibold">Como vincular:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra o Telegram</li>
              <li>Encontre nosso bot</li>
              <li>Envie: <code>/codigo {code}</code></li>
              <li>Pronto! Suas conversas estarão sincronizadas</li>
            </ol>
          </div>

          <button
            onClick={() => {
              setCode("");
              setExpiresAt(null);
            }}
            className="mt-4 text-sm text-gray-600 hover:underline"
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
```

**Adicionar ao Dashboard**: `frontend/src/pages/Dashboard.tsx`

```typescript
import { TelegramLink } from "../components/TelegramLink";

<section className="mt-6">
  <h2 className="text-lg font-semibold mb-4">Integração Telegram</h2>
  <TelegramLink />
</section>
```

---

## Fase 6: Sistema de Continuidade

### 6.1 WebSocket para Sincronização

**Modificar**: `backend/src/realtime/socket.ts`

```typescript
export function broadcastNewMessage(userId: number, message: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit("chat:new-message", message);
}

io.on("connection", (socket) => {
  socket.on("join-user-room", (userId: number) => {
    socket.join(`user:${userId}`);
    logger.info({ userId }, "Usuário entrou na sala de chat");
  });
});
```

**Modificar**: `backend/src/services/chatService.ts`

```typescript
import { broadcastNewMessage } from "../realtime/socket";

// Após salvar mensagem:
broadcastNewMessage(userId, {
  conversationId,
  role: "assistant",
  content: aiResponse,
  platform,
  created_at: new Date()
});
```

**Modificar**: `frontend/src/hooks/useRealtime.ts`

```typescript
import { useChatStore } from "../stores/chatStore";

// Adicionar listener:
socket.on("chat:new-message", (message) => {
  useChatStore.getState().addMessage(message);
});

// Ao conectar, entrar na sala do usuário:
socket.emit("join-user-room", userId);
```

### 6.2 Resumos Automáticos

Já implementado em `conversationService.ts` e `chatService.ts` - resumo gerado automaticamente quando conversa ultrapassa 30 mensagens.

---

## Arquivos Críticos por Fase

### Fase 1 (Auth Backend):
- `backend/database/migrations/001_create_auth_tables.sql`
- `backend/src/services/authService.ts`
- `backend/src/middleware/auth.ts`
- `backend/src/routes/modules/auth.ts`
- `backend/src/config/env.ts`
- `backend/.env`

### Fase 2 (Auth Frontend):
- `frontend/src/services/authApi.ts`
- `frontend/src/services/api.ts`
- `frontend/src/pages/Login.tsx`
- `frontend/src/pages/Register.tsx`
- `frontend/src/App.tsx`

### Fase 3 (Chatbot Backend):
- `backend/src/services/conversationService.ts`
- `backend/src/services/chatService.ts`
- `backend/src/integrations/geminiChat.ts`
- `backend/src/routes/modules/chat.ts`

### Fase 4 (Chat Frontend):
- `frontend/src/stores/chatStore.ts`
- `frontend/src/services/chatApi.ts`
- `frontend/src/components/ChatInterface.tsx`
- `frontend/src/pages/Dashboard.tsx`

### Fase 5 (Telegram):
- `backend/src/routes/modules/telegram-link.ts`
- `backend/src/integrations/telegram.ts`
- `frontend/src/components/TelegramLink.tsx`

### Fase 6 (Continuidade):
- `backend/src/realtime/socket.ts`
- `frontend/src/hooks/useRealtime.ts`

---

## Dependências Necessárias

### Backend:
```bash
npm install bcrypt jsonwebtoken uuid
npm install -D @types/bcrypt @types/jsonwebtoken @types/uuid
```

### Frontend:
Nenhuma dependência adicional (já tem axios, zustand, socket.io-client)

---

## Teste de Ponta a Ponta

1. **Registro**: Criar conta no web app
2. **Login**: Fazer login e receber tokens
3. **Chat Web**: Enviar mensagens e receber respostas da IA
4. **Vinculação**: Gerar código e vincular Telegram
5. **Chat Telegram**: Enviar `/chat Como está o clima?`
6. **Sincronização**: Ver mensagem do Telegram aparecer no web
7. **Continuidade**: Continuar conversa em ambas plataformas
8. **Resumo**: Enviar 35+ mensagens e verificar geração de resumo

---

## Notas Importantes

- Tokens JWT expiram em 15 minutos (ajustável)
- Código de vinculação expira em 10 minutos
- Resumos gerados automaticamente a cada 10 mensagens após 30
- Contexto mantém últimas 30 mensagens + resumo
- Mensagens sincronizadas em tempo real via WebSocket
- Plataforma de origem rastreada (web/telegram)

---

## Próximos Passos Opcionais

- Rate limiting para APIs
- Paginação de mensagens antigas
- Busca em conversas
- Exportar conversas
- Análise de sentimento
- Notificações push
- Suporte a múltiplas línguas
