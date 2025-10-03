import { api } from '../api/client';
import { DashboardSummary } from '../types';

/**
 * Tu backend devuelve:
 * {
 *   balance: { ingresos, gastos, balance },
 *   categories: [{ categoryId, category, total }],
 *   trend: [...]
 * }
 * Omitimos trend.
 */
export async function getDashboard(start: string, end: string): Promise<DashboardSummary> {
  const res = await api.get('/reports/dashboard', { params: { start, end } });
  const b = res.data?.balance ?? {};
  const cats = Array.isArray(res.data?.categories) ? res.data.categories : [];

  return {
    income: Number(b.ingresos ?? 0),
    expense: Number(b.gastos ?? 0),
    balance: Number(b.balance ?? 0),
    byCategory: cats.map((c: any) => ({
      categoryId: c.categoryId,
      category: String(c.category ?? ''),
      total: Number(c.total ?? 0),
      // count no viene en tu API; lo dejamos undefined
    })),
  };
}
