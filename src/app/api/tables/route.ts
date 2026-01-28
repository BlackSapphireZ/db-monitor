import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getTableListWithCounts } from '@/lib/db';

export async function GET() {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Single optimized query with caching - NO MORE N+1!
        const tables = await getTableListWithCounts();

        const formattedTables = tables.map(table => ({
            name: table.table_name,
            columns: table.column_count,
            rows: table.row_count,
        }));

        // Sort by row count descending
        formattedTables.sort((a, b) => b.rows - a.rows);

        return NextResponse.json({ tables: formattedTables });
    } catch (error) {
        console.error('Tables error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: 'Failed to get tables' },
            { status: 500 }
        );
    }
}
