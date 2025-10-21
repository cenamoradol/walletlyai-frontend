// src/services/transactions.ts
import { api } from '../api/client';
import type { CreateTransactionDto, Transaction } from '../types';

export type TransactionUpdate = Partial<
  Omit<Transaction, 'id' | 'userId' | 'createdAt' | 'updatedAt'>
> & {
  date?: string;    // "YYYY-MM-DD" o ISO con hora
  endDate?: string; // idem
};

export const TransactionsService = {
  async getList(params?: {
    from?: string;
    to?: string;
    type?: 'ingreso' | 'gasto';
    categoryId?: number;
    page?: number;
    pageSize?: number;
  }): Promise<Transaction[] | { items: Transaction[]; meta: any }> {
    const res = await api.get('/transactions', { params });
    return res.data;
  },

  async getById(id: number): Promise<Transaction> {
    const res = await api.get(`/transactions/${id}`);
    return res.data;
  },

  async create(dto: CreateTransactionDto): Promise<Transaction> {
    const res = await api.post('/transactions', dto);
    return res.data;
  },

  async update(id: number, payload: TransactionUpdate): Promise<Transaction> {
    const res = await api.patch(`/transactions/${id}`, payload);
    return res.data;
  },

  async remove(id: number): Promise<{ ok: true } | Transaction> {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
};
