// Tipos base del backend
export type BackendTxType = 'ingreso' | 'gasto';

export interface ApiTransaction {
  id: number | string;
  userId: number;
  type: BackendTxType;
  amount: number;
  date: string; // ISO
  categoryId: number;
  paymentMethod: string;
  note?: string;
  isRecurring: boolean;
  recurrence: '' | 'daily' | 'weekly' | 'biweekly' | 'monthly';
  endDate: string; // ISO
}

export interface Category {
  id: number;
  userId: number;
  name: string;
  type: BackendTxType; // 'ingreso' | 'gasto'
}

// Transacción normalizada para la app (enriquecida con nombre de categoría)
export interface Transaction extends ApiTransaction {
  category: string; // <-- agregado para UI
}

export type RecurrenceKind = '' | 'daily' | 'weekly' | 'biweekly' | 'monthly';

// DTO de creación
export interface CreateTransactionDto {
  type: BackendTxType;
  amount: number;
  categoryId: number;
  paymentMethod: string;
  note?: string;
  date: string;          // ISO
  isRecurring: boolean;
  recurrence?: Exclude<RecurrenceKind, ''>; // <- opcional si no recurrente
  endDate?: string;      // ISO opcional si no recurrente
}

// Auth
export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { name: string; email: string; password: string; }
export interface AuthResponse { access_token: string; }
