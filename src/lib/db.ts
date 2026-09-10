import pg from "pg";

const { Pool, types } = pg;

/*
 * ضبط طريقة تحويل أنواع بيانات PostgreSQL إلى JavaScript
 * حتى نتجنب مشاكل المناطق الزمنية في التواريخ والمواعيد.
 */
types.setTypeParser(types.builtins.DATE, (v: string) => v); // 'YYYY-MM-DD' كما هي
types.setTypeParser(types.builtins.TIME, (v: string) => (v ? v.slice(0, 5) : v)); // 'HH:MM'
types.setTypeParser(types.builtins.NUMERIC, (v: string) => (v === null ? null : Number(v)));
types.setTypeParser(types.builtins.INT8, (v: string) => Number(v));

const globalForPg = globalThis as unknown as { __carsystemPool?: pg.Pool };

export const pool =
  globalForPg.__carsystemPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPg.__carsystemPool = pool;
}

export async function query<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params: unknown[] = []
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}

/** هل قاعدة البيانات متاحة؟ (تُستخدم لعرض رسالة واضحة بدل شاشة خطأ) */
export async function pingDatabase(): Promise<boolean> {
  try {
    await pool.query("SELECT 1");
    return true;
  } catch {
    return false;
  }
}
