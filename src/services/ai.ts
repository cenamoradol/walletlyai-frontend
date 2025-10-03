// src/services/ai.ts
import { api } from '../api/client';

export async function saveTransactionFromText(text: string) {
  const { data } = await api.post('/ai/save-transaction', { text });
  return data; // asume que backend retorna la transacción creada o algún resumen
}
