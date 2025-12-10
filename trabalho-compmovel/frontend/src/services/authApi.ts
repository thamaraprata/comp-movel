import api from "./api";

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

interface LoginData {
  email: string;
  password: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    email: string;
    name: string;
  };
}

interface User {
  id: number;
  email: string;
  name: string;
  telegram_chat_id?: number | null;
}

export async function register(email: string, password: string, name: string): Promise<AuthResponse> {
  const { data } = await api.post<{ status: string; data: AuthResponse }>("/auth/register", {
    email,
    password,
    name
  });
  return data.data;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const { data } = await api.post<{ status: string; data: AuthResponse }>("/auth/login", {
    email,
    password
  });
  return data.data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<{ status: string; data: { user: User } }>("/auth/me");
  return data.data.user;
}

export async function refreshAccessToken(refreshToken: string): Promise<string> {
  const { data } = await api.post<{ status: string; data: { accessToken: string } }>("/auth/refresh", {
    refreshToken
  });
  return data.data.accessToken;
}
