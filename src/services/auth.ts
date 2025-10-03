import { z } from 'zod';
import { api } from '../api/client';
import { AuthResponse, LoginPayload, RegisterPayload } from '../types';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
});

export async function login(data: LoginPayload): Promise<AuthResponse> {
  const parsed = loginSchema.parse(data);
  const res = await api.post<AuthResponse>('/auth/login', parsed);
  return res.data;
}

export async function register(data: RegisterPayload): Promise<AuthResponse> {
  const parsed = registerSchema.parse(data);
  const res = await api.post<AuthResponse>('/auth/register', parsed);
  return res.data;
}
