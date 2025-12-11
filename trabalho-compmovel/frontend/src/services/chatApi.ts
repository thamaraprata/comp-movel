import api from "./api";

export interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  platform: string;
  created_at: string;
}

export interface Conversation {
  id: number;
  title: string;
  weather_city: string | null;
  last_message_at: string | null;
  created_at: string;
}

export interface SendMessageResponse {
  conversationId: number;
  response: string;
  timestamp: string;
}

export async function sendMessage(message: string, city?: string): Promise<SendMessageResponse> {
  const { data } = await api.post<{ status: string; data: SendMessageResponse }>("/chat/message", {
    message,
    city
  });
  return data.data;
}

export async function getConversations(): Promise<Conversation[]> {
  const { data } = await api.get<{ status: string; data: Conversation[] }>("/chat/conversations");
  return data.data;
}

export async function getConversationMessages(conversationId: number): Promise<Message[]> {
  const { data } = await api.get<{ status: string; data: Message[] }>(
    `/chat/conversations/${conversationId}/messages`
  );
  return data.data;
}
