import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ============ IN-MEMORY CACHE ============
interface CacheEntry<T> {
    data: T;
    expiry: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCache<T>(key: string): T | null {
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiry) {
        cache.delete(key);
        return null;
    }
    return entry.data as T;
}

function setCache<T>(key: string, data: T, ttlSeconds: number): void {
    cache.set(key, {
        data,
        expiry: Date.now() + ttlSeconds * 1000,
    });
}

// ============ BASE QUERY ============
export async function query(text: string, params?: unknown[]) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

// ============ OPTIMIZED: Get table list with row counts in 1 query ============
interface TableInfo {
    table_name: string;
    column_count: number;
    row_count: number;
}

export async function getTableListWithCounts(): Promise<TableInfo[]> {
    const CACHE_KEY = 'table_list_with_counts';
    const cached = getCache<TableInfo[]>(CACHE_KEY);
    if (cached) return cached;

    // Single query using pg_stat_user_tables for row counts
    const result = await query(`
        SELECT 
            t.table_name,
            (SELECT COUNT(*) FROM information_schema.columns c WHERE c.table_name = t.table_name) as column_count,
            COALESCE(s.n_live_tup, 0) as row_count
        FROM information_schema.tables t
        LEFT JOIN pg_stat_user_tables s ON s.relname = t.table_name
        WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
        ORDER BY t.table_name
    `);

    const tables = result.rows.map(row => ({
        table_name: row.table_name,
        column_count: parseInt(row.column_count),
        row_count: parseInt(row.row_count) || 0,
    }));

    setCache(CACHE_KEY, tables, 60); // Cache for 60 seconds
    return tables;
}

// ============ LEGACY: Keep for backward compatibility ============
export async function getTableList() {
    const tables = await getTableListWithCounts();
    return tables.map(t => ({
        table_name: t.table_name,
        column_count: t.column_count,
    }));
}

// ============ OPTIMIZED: Validate table with cache ============
async function isValidTable(tableName: string): Promise<boolean> {
    const tables = await getTableListWithCounts();
    return tables.some(t => t.table_name === tableName);
}

export async function getTableData(tableName: string, page: number = 1, limit: number = 50) {
    // Use cached validation instead of fresh query
    if (!(await isValidTable(tableName))) {
        throw new Error('Invalid table name');
    }

    const offset = (page - 1) * limit;

    // Run both queries in parallel
    const [countResult, dataResult] = await Promise.all([
        query(`SELECT COUNT(*) FROM "${tableName}"`),
        query(`SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`, [limit, offset]),
    ]);

    return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
}

export async function getTableColumns(tableName: string) {
    const CACHE_KEY = `table_columns_${tableName}`;
    const cached = getCache<{ column_name: string; data_type: string; is_nullable: string }[]>(CACHE_KEY);
    if (cached) return cached;

    const result = await query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
    `, [tableName]);

    setCache(CACHE_KEY, result.rows, 300); // Cache for 5 minutes (columns rarely change)
    return result.rows;
}

// ============ OPTIMIZED: Single query for database stats ============
interface DatabaseStats {
    size: string;
    tableCount: number;
    activeConnections: number;
}

export async function getDatabaseStats(): Promise<DatabaseStats> {
    const CACHE_KEY = 'database_stats';
    const cached = getCache<DatabaseStats>(CACHE_KEY);
    if (cached) return cached;

    // Combined into single query with subqueries
    const result = await query(`
        SELECT 
            pg_size_pretty(pg_database_size(current_database())) as size,
            (SELECT COUNT(*) FROM information_schema.tables 
             WHERE table_schema = 'public' AND table_type = 'BASE TABLE') as table_count,
            (SELECT COUNT(*) FROM pg_stat_activity 
             WHERE datname = current_database()) as active_connections
    `);

    const stats = {
        size: result.rows[0].size,
        tableCount: parseInt(result.rows[0].table_count),
        activeConnections: parseInt(result.rows[0].active_connections),
    };

    setCache(CACHE_KEY, stats, 30); // Cache for 30 seconds
    return stats;
}

export async function runSelectQuery(sql: string) {
    // Only allow SELECT queries
    const trimmed = sql.trim().toUpperCase();
    if (!trimmed.startsWith('SELECT')) {
        throw new Error('Only SELECT queries are allowed');
    }

    // Prevent dangerous keywords
    const dangerous = ['DROP', 'DELETE', 'UPDATE', 'INSERT', 'ALTER', 'TRUNCATE', 'CREATE'];
    for (const keyword of dangerous) {
        if (trimmed.includes(keyword)) {
            throw new Error(`${keyword} queries are not allowed`);
        }
    }

    const result = await query(sql);
    return {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields.map(f => f.name)
    };
}

// ============ CACHE MANAGEMENT ============
export function clearCache(pattern?: string): void {
    if (!pattern) {
        cache.clear();
        return;
    }
    for (const key of Array.from(cache.keys())) {
        if (key.includes(pattern)) {
            cache.delete(key);
        }
    }
}

export function getCacheStats() {
    return {
        size: cache.size,
        keys: Array.from(cache.keys()),
    };
}

export default pool;
