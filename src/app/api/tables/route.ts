import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getTableList, query } from '@/lib/db';

export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const tables = await getTableList();

        // Get row counts for each table
        const tablesWithCounts = await Promise.all(
            tables.map(async (table: { table_name: string; column_count: number }) => {
                try {
                    const result = await query(`SELECT COUNT(*) as count FROM "${table.table_name}"`);
                    return {
                        name: table.table_name,
                        columns: parseInt(table.column_count as unknown as string),
                        rows: parseInt(result.rows[0].count),
                    };
                } catch {
                    return {
                        name: table.table_name,
                        columns: parseInt(table.column_count as unknown as string),
                        rows: 0,
                    };
                }
            })
        );

        return NextResponse.json({ tables: tablesWithCounts });
    } catch (error) {
        console.error('Tables error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'Failed to get tables' },
            { status: 500 }
        );
    }
}
