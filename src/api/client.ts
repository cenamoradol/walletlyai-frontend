// src/api/client.ts
import axios from 'axios';
import { ENV } from '../config/env';

let AUTH_TOKEN: string | null = null;
let onUnauthorized: (() => void) | null = null;

export const setAuthToken = (token: string | null) => { AUTH_TOKEN = token; };
export const setOnUnauthorized = (fn: (() => void) | null) => { onUnauthorized = fn; };

export const api = axios.create({
  baseURL: ENV.BASE_URL,
  timeout: 35000,
});

api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};
  if (AUTH_TOKEN) config.headers.Authorization = `Bearer ${AUTH_TOKEN}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    if (status === 401 && typeof onUnauthorized === 'function') {
      try { onUnauthorized(); } catch {}
    }
    return Promise.reject(error);
  }
);
