import { create } from "zustand";
import * as chatApi from "../services/chatApi";
import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

interface Message {
  id?: number;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatState {
  messages: Message[];
  conversations: chatApi.Conversation[];
  currentConversationId: number | null;
  isLoading: boolean;
  error: string | null;
  selectedCity: string | null;

  initSocket: () => void;
  setSelectedCity: (city: string | null) => void;
  sendMessage: (message: string) => Promise<void>;
  loadConversations: () => Promise<void>;
  loadConversation: (conversationId: number) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  conversations: [],
  currentConversationId: null,
  isLoading: false,
  error: null,
  selectedCity: null,

  setSelectedCity: (city) => set({ selectedCity: city }),

  initSocket: () => {
    if (socket) return;

    socket = io("http://localhost:3334", {
      path: "/ws"
    });

    socket.on("connect", () => {
      console.log("Socket.IO conectado");
    });

    socket.on("chat:message", (data: any) => {
      // Adicionar mensagem recebida via Socket.IO
      const message: Message = {
        role: data.role,
        content: data.content,
        timestamp: data.timestamp
      };

      set((state) => ({
        messages: [...state.messages, message]
      }));
    });

    socket.on("disconnect", () => {
      console.log("Socket.IO desconectado");
    });
  },

  sendMessage: async (message: string) => {
    const { selectedCity } = get();

    // Adicionar mensagem do usuário otimisticamente
    const userMessage: Message = {
      role: "user",
      content: message,
      timestamp: new Date().toISOString()
    };

    set((state) => ({
      messages: [...state.messages, userMessage],
      isLoading: true,
      error: null
    }));

    try {
      const response = await chatApi.sendMessage(message, selectedCity || undefined);

      // Adicionar resposta do assistente
      const assistantMessage: Message = {
        role: "assistant",
        content: response.response,
        timestamp: response.timestamp
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        currentConversationId: response.conversationId,
        isLoading: false
      }));
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erro ao enviar mensagem",
        isLoading: false
      });
    }
  },

  loadConversations: async () => {
    try {
      const conversations = await chatApi.getConversations();
      set({ conversations });
    } catch (error: any) {
      set({ error: error.response?.data?.message || "Erro ao carregar conversas" });
    }
  },

  loadConversation: async (conversationId: number) => {
    set({ isLoading: true });
    try {
      const messages = await chatApi.getConversationMessages(conversationId);
      set({
        messages: messages.map((m) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          timestamp: m.created_at
        })),
        currentConversationId: conversationId,
        isLoading: false
      });
    } catch (error: any) {
      set({
        error: error.response?.data?.message || "Erro ao carregar conversa",
        isLoading: false
      });
    }
  },

  clearMessages: () => set({ messages: [], currentConversationId: null })
}));
