import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useState,
} from 'react';
import { jwtDecode } from 'jwt-decode';
import { persist } from '../utils/persist';
// ⬇️ usamos el servicio unificado que ya expusiste
import { TransactionsService } from '../services/transactions';
import { getCategories } from '../services/categories';
import { ApiTransaction, Category, Transaction } from '../types';
import { useAuth } from '../context/AuthContext';

type Meta = {
  lastSyncISO?: string;   // última sincronización
  windowStart?: string;   // YYYY-MM-DD del inicio de ventana cacheada (LOCAL)
};

type Dashboard = {
  income: number;
  expense: number;
  balance: number;
  byCategory: { category: string; total: number; count: number }[];
};

type Ctx = {
  userKey: string | null;
  ready: boolean;
  txs: Transaction[];
  loadInitial: () => Promise<void>;
  refresh: (opts?: { silent?: boolean }) => Promise<void>;
  addLocalTx: (tx: Transaction) => Promise<void>;
  getDashboard: (start: string, end: string) => Dashboard;
  getRecent: (start: string, end: string, limit?: number) => Transaction[];
  getRecentAll: (limit?: number) => Transaction[];
};

const DataCacheContext = createContext<Ctx | null>(null);

const DAYS_BACK = 365;

// ---------- helpers de clave/fechas ----------
function safeUserKeyFromToken(token?: string | null): string | null {
  if (!token) return null;
  try {
    const dec: any = jwtDecode(token);
    return String(dec?.sub ?? dec?.email ?? `tok_${String(token).slice(0, 12)}`);
  } catch {
    return `tok_${String(token).slice(0, 12)}`;
  }
}
function toKey(userKey: string, which: 'TXS' | 'META') {
  return `${which}_v1_${userKey}`;
}

/** Convierte YYYY-MM-DD (LOCAL) → [startUTCms, endUTCms] */
function localDayWindowToUTC(startYMD: string, endYMD: string) {
  const [y1, m1, d1] = startYMD.split('-').map(Number);
  const [y2, m2, d2] = endYMD.split('-').map(Number);
  // construir Date en zona LOCAL y dejar que convierta a epoch (UTC ms)
  const startLocal = new Date(y1, (m1 - 1), d1, 0, 0, 0, 0);
  const endLocal   = new Date(y2, (m2 - 1), d2, 23, 59, 59, 999);
  return { s: startLocal.getTime(), e: endLocal.getTime() }; // ya en UTC ms
}

/** ¿tx.date (ISO UTC) cae dentro de la ventana correspondiente al día LOCAL [start..end]? */
function inRangeLocalWindow(txISO: string, startYMD: string, endYMD: string) {
  const { s, e } = localDayWindowToUTC(startYMD, endYMD);
  const d = Date.parse(txISO);
  return d >= s && d <= e;
}

/** Cuenta ocurrencias de una recurrencia dentro del rango LOCAL transformado a UTC */
function countOccurrencesUTC(
  startISO: string,            // fecha base de la transacción (UTC ISO)
  untilISO: string,            // endDate de la transacción (UTC ISO)
  recurrence: '' | 'daily' | 'weekly' | 'biweekly' | 'monthly',
  rangeStartYMD: string,       // YYYY-MM-DD (LOCAL)
  rangeEndYMD: string,         // YYYY-MM-DD (LOCAL)
): number {
  if (!recurrence) return inRangeLocalWindow(startISO, rangeStartYMD, rangeEndYMD) ? 1 : 0;

  const base = Date.parse(startISO); // UTC ms
  const until = Date.parse(untilISO);

  // Ventana efectiva del rango (LOCAL → UTC)
  const { s: rs, e: re } = localDayWindowToUTC(rangeStartYMD, rangeEndYMD);
  const from = Math.max(base, rs);
  const to = Math.min(until, re);
  if (to < from) return 0;

  let stepDays = 0;
  let count = 0;

  if (recurrence === 'monthly') {
    const dateFrom = new Date(from);
    const first = new Date(base);
    let months = (dateFrom.getUTCFullYear() - first.getUTCFullYear()) * 12
               + (dateFrom.getUTCMonth() - first.getUTCMonth());
    if (months < 0) months = 0;

    let cand = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + months, first.getUTCDate(),
                                 first.getUTCHours(), first.getUTCMinutes(), first.getUTCSeconds(), first.getUTCMilliseconds()));
    if (cand.getTime() < from) {
      cand = new Date(Date.UTC(cand.getUTCFullYear(), cand.getUTCMonth() + 1, cand.getUTCDate(),
                                cand.getUTCHours(), cand.getUTCMinutes(), cand.getUTCSeconds(), cand.getUTCMilliseconds()));
      months += 1;
    }

    while (cand.getTime() <= to) {
      count++;
      cand = new Date(Date.UTC(cand.getUTCFullYear(), cand.getUTCMonth() + 1, cand.getUTCDate(),
                                cand.getUTCHours(), cand.getUTCMinutes(), cand.getUTCSeconds(), cand.getUTCMilliseconds()));
    }
    return count;
  }

  if (recurrence === 'daily') stepDays = 1;
  else if (recurrence === 'weekly') stepDays = 7;
  else if (recurrence === 'biweekly') stepDays = 14;

  const msPerDay = 24 * 60 * 60 * 1000;
  const deltaDays = Math.ceil((from - base) / msPerDay);
  const k0 = Math.max(0, Math.ceil(deltaDays / stepDays));
  let occ = base + k0 * stepDays * msPerDay;

  while (occ <= to) {
    count++;
    occ += stepDays * msPerDay;
  }
  return count;
}
// --------------------------------------------

function normalizeTransactions(apiTxs: ApiTransaction[], cats: Category[]): Transaction[] {
  const nameById = new Map<number, string>(cats.map(c => [c.id, c.name]));
  return apiTxs.map(t => ({
    ...t,
    category: nameById.get(t.categoryId) ?? 'Sin categoría',
  }));
}

// Dashboard con expansión de recurrencias (suma todas las ocurrencias dentro del rango LOCAL)
function deriveDashboard(txs: Transaction[], startYMD: string, endYMD: string): Dashboard {
  let income = 0, expense = 0;
  const catMap = new Map<string, { total: number; count: number }>();

  for (const t of txs) {
    if (!t.isRecurring) {
      if (!inRangeLocalWindow(t.date, startYMD, endYMD)) continue;
      if (t.type === 'ingreso') income += t.amount; else expense += t.amount;

      const key = t.category || 'Sin categoría';
      const agg = catMap.get(key) ?? { total: 0, count: 0 };
      agg.total += t.amount;
      agg.count += 1;
      catMap.set(key, agg);
      continue;
    }

    const n = countOccurrencesUTC(t.date, t.endDate, t.recurrence, startYMD, endYMD);
    if (n <= 0) continue;

    const totalAmount = t.amount * n;
    if (t.type === 'ingreso') income += totalAmount;
    else expense += totalAmount;

    const key = t.category || 'Sin categoría';
    const agg = catMap.get(key) ?? { total: 0, count: 0 };
    agg.total += totalAmount;
    agg.count += n;
    catMap.set(key, agg);
  }

  const byCategory = Array.from(catMap.entries())
    .map(([category, v]) => ({ category, total: v.total, count: v.count }))
    .sort((a, b) => b.total - a.total);

  return { income, expense, balance: income - expense, byCategory };
}

export function DataCacheProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const userKey = safeUserKeyFromToken(token);

  const [txs, setTxs] = useState<Transaction[]>([]);
  const [meta, setMeta] = useState<Meta>({});
  const [ready, setReady] = useState(false);

  const loadInitial = useCallback(async () => {
    if (!userKey) { setReady(false); return; }

    setReady(false);
    const [cachedTxs, cachedMeta] = await Promise.all([
      persist.get<Transaction[]>(toKey(userKey, 'TXS')),
      persist.get<Meta>(toKey(userKey, 'META')),
    ]);

    if (cachedTxs) setTxs(cachedTxs);
    if (cachedMeta) setMeta(cachedMeta);

    if (!cachedTxs) {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - DAYS_BACK);
      const startISO = start.toISOString().slice(0, 10); // YYYY-MM-DD
      const endISO = end.toISOString().slice(0, 10);

      const [cats, apiTxs] = await Promise.all([
        getCategories(),
        // ⬇️ BACKEND espera from/to, no start/end
        TransactionsService.getList({ from: startISO, to: endISO }),
      ]);

      const list = Array.isArray(apiTxs) ? apiTxs : apiTxs.items;
      const normalized = normalizeTransactions(list as unknown as ApiTransaction[], cats);

      setTxs(normalized);
      const m: Meta = { lastSyncISO: new Date().toISOString(), windowStart: startISO };
      setMeta(m);
      await Promise.all([
        persist.set<Transaction[]>(toKey(userKey, 'TXS'), normalized),
        persist.set<Meta>(toKey(userKey, 'META'), m),
      ]);
    }

    setReady(true);
  }, [userKey]);

  const refresh = useCallback(async ({ silent }: { silent?: boolean } = {}) => {
    if (!userKey) return;

    const end = new Date();
    const start = meta.windowStart
      ? new Date(meta.windowStart + 'T00:00:00')
      : new Date(new Date().setDate(end.getDate() - DAYS_BACK));

    const startISO = start.toISOString().slice(0, 10);
    const endISO = end.toISOString().slice(0, 10);

    if (!silent) {
      // opcional: spinner
    }

    const [cats, apiTxs] = await Promise.all([
      getCategories(),
      // ⬇️ BACKEND espera from/to, no start/end
      TransactionsService.getList({ from: startISO, to: endISO }),
    ]);

    const list = Array.isArray(apiTxs) ? apiTxs : apiTxs.items;
    const normalized = normalizeTransactions(list as unknown as ApiTransaction[], cats);
    setTxs(normalized);

    const m: Meta = { lastSyncISO: new Date().toISOString(), windowStart: startISO };
    setMeta(m);
    await Promise.all([
      persist.set<Transaction[]>(toKey(userKey, 'TXS'), normalized),
      persist.set<Meta>(toKey(userKey, 'META'), m),
    ]);
  }, [userKey, meta.windowStart]);

  const addLocalTx = useCallback(async (tx: Transaction) => {
    if (!userKey) return;
    setTxs(prev => [tx, ...prev]);
    const key = toKey(userKey, 'TXS');
    const current = (await persist.get<Transaction[]>(key)) ?? [];
    await persist.set<Transaction[]>(key, [tx, ...current]);
  }, [userKey]);

  const getDashboard = useCallback((start: string, end: string): Dashboard => {
    return deriveDashboard(txs, start, end);
  }, [txs]);

  const recentSort = (a: Transaction, b: Transaction) => {
    const da = +new Date(a.date);
    const db = +new Date(b.date);
    if (db !== da) return db - da;
    // desempate estable: createdAt desc, luego id desc
    const ca = a.createdAt ? +new Date(a.createdAt) : 0;
    const cb = b.createdAt ? +new Date(b.createdAt) : 0;
    if (cb !== ca) return cb - ca;
    return (b.id || 0) - (a.id || 0);
  };

  const getRecent = useCallback((start: string, end: string, limit = 10): Transaction[] => {
    return txs
      .filter(t => inRangeLocalWindow(t.date, start, end))
      .sort(recentSort)
      .slice(0, limit);
  }, [txs]);

  const getRecentAll = useCallback((limit = 10): Transaction[] => {
    return [...txs].sort(recentSort).slice(0, limit);
  }, [txs]);

  const value = useMemo<Ctx>(() => ({
    userKey, ready, txs, loadInitial, refresh, addLocalTx, getDashboard, getRecent, getRecentAll,
  }), [userKey, ready, txs, loadInitial, refresh, addLocalTx, getDashboard, getRecent, getRecentAll]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!userKey) {
        setTxs([]);
        setMeta({});
        setReady(false);
        return;
      }
      await loadInitial();
      if (!cancelled) {
        await refresh({ silent: true });
      }
    })();

    return () => { cancelled = true; };
  }, [userKey, loadInitial, refresh]);

  return (
    <DataCacheContext.Provider value={value}>
      {children}
    </DataCacheContext.Provider>
  );
}

export function useDataCache() {
  const ctx = useContext(DataCacheContext);
  if (!ctx) throw new Error('useDataCache debe usarse dentro de DataCacheProvider');
  return ctx;
}
