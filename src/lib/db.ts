import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

export async function query(text: string, params?: unknown[]) {
    const client = await pool.connect();
    try {
        const result = await client.query(text, params);
        return result;
    } finally {
        client.release();
    }
}

export async function getTableList() {
    const result = await query(`
    SELECT 
      table_name,
      (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
    FROM information_schema.tables t
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    ORDER BY table_name
  `);
    return result.rows;
}

export async function getTableData(tableName: string, page: number = 1, limit: number = 50) {
    // Validate table name to prevent SQL injection
    const validTables = await getTableList();
    const isValid = validTables.some((t: { table_name: string }) => t.table_name === tableName);
    if (!isValid) {
        throw new Error('Invalid table name');
    }

    const offset = (page - 1) * limit;
    const countResult = await query(`SELECT COUNT(*) FROM "${tableName}"`);
    const dataResult = await query(`SELECT * FROM "${tableName}" LIMIT $1 OFFSET $2`, [limit, offset]);

    return {
        data: dataResult.rows,
        total: parseInt(countResult.rows[0].count),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit)
    };
}

export async function getTableColumns(tableName: string) {
    const result = await query(`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_name = $1
    ORDER BY ordinal_position
  `, [tableName]);
    return result.rows;
}

export async function getDatabaseStats() {
    const sizeResult = await query(`
    SELECT pg_size_pretty(pg_database_size(current_database())) as size
  `);

    const tableCountResult = await query(`
    SELECT COUNT(*) as count FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  `);

    const connectionResult = await query(`
    SELECT COUNT(*) as count FROM pg_stat_activity 
    WHERE datname = current_database()
  `);

    return {
        size: sizeResult.rows[0].size,
        tableCount: parseInt(tableCountResult.rows[0].count),
        activeConnections: parseInt(connectionResult.rows[0].count)
    };
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

export default pool;
