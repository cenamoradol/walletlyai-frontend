import { api } from '../api/client';
import { CreateTransactionDto, Transaction } from '../types';

export async function getTransactions(params?: { start?: string; end?: string }): Promise<Transaction[]> {
  const res = await api.get<Transaction[]>('/transactions', { params });
  return res.data;
}

export async function createTransaction(dto: CreateTransactionDto): Promise<Transaction> {
  const res = await api.post<Transaction>('/transactions', dto);
  return res.data;
}
