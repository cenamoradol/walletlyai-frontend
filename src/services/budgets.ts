// src/services/budgets.ts
import { api } from '../api/client';

export type BudgetScope = 'CATEGORY' | 'TYPE' | 'GLOBAL' | 'ACCOUNT';
export type BudgetType = 'INCOME' | 'EXPENSE' | null;

export interface BudgetCategoryRef {
  id: number;
  name: string;
  // en tu app he visto tipos 'gasto' | 'ingreso' para categorías
  type: 'gasto' | 'ingreso';
}

export interface BudgetDTO {
  id: number;
  name: string;
  scope: BudgetScope;         // p.ej. 'TYPE'
  type: BudgetType;           // 'EXPENSE' | 'INCOME' | null
  category: BudgetCategoryRef | null; // null si es global por tipo
  amount: number;             // asignado
  spent: number;              // gastado
  remaining: number;          // restante
  percent: number;            // p.ej. 0..120
  period: { start: string; end: string };
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBudgetBody {
  type?: Exclude<BudgetType, null>; // 'INCOME' | 'EXPENSE' (global por tipo)
  amount: number;
  categoryId?: number;              // presupuesto por categoría
  periodStart: string;              // ISO (00:00:00.000Z)
  periodEnd: string;                // ISO (23:59:59.000Z)
  name?: string;                    // opcional si el backend lo admite
}

export const BudgetsService = {
  async getList(): Promise<BudgetDTO[]> {
    const { data } = await api.get<BudgetDTO[]>('/budgets');
    return data;
  },

  async create(body: CreateBudgetBody): Promise<BudgetDTO> {
    const { data } = await api.post<BudgetDTO>('/budgets', body);
    return data;
  },
};
