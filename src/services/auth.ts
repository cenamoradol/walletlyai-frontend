// src/services/auth.ts
import { z } from 'zod';
import { api } from '../api/client';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export type LoginPayload = z.infer<typeof loginSchema>;
export type RegisterPayload = z.infer<typeof registerSchema>;

export type AuthResponse = {
  access_token: string;
};

export async function login(payload: LoginPayload): Promise<AuthResponse> {
  const parsed = loginSchema.parse(payload);
  const { data } = await api.post<AuthResponse>('/auth/login', parsed);
  return data;
}

export async function register(payload: RegisterPayload): Promise<void> {
  const parsed = registerSchema.parse(payload);
  await api.post('/auth/register', parsed);
}
