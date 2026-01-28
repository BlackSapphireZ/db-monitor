import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { runSelectQuery } from '@/lib/db';

export async function POST(request: Request) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { sql } = await request.json();

        if (!sql || typeof sql !== 'string') {
            return NextResponse.json(
                { error: 'SQL query is required' },
                { status: 400 }
            );
        }

        const result = await runSelectQuery(sql);
        return NextResponse.json(result);
    } catch (error) {
        console.error('Query error:', error instanceof Error ? error.message : 'Unknown error');
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Query failed' },
            { status: 500 }
        );
    }
}
