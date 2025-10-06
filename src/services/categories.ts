import { api } from '../api/client';
import { Category } from '../types';

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>('/categories');
  return data;
}

export async function createCategory(payload: { name: string; type: 'gasto' | 'ingreso' }): Promise<Category> {
  const { data } = await api.post<Category>('/categories', payload);
  return data;
}

export async function updateCategory(id: number, payload: { name: string }): Promise<Category> {
  const { data } = await api.put<Category>(`/categories/${id}`, payload);
  return data;
}

export async function deleteCategory(id: number): Promise<void> {
  await api.delete(`/categories/${id}`);
}
