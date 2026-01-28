import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';
import { getTableData, getTableColumns } from '@/lib/db';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ name: string }> }
) {
    if (!(await isAuthenticated())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const { name } = await params;
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');

        const [data, columns] = await Promise.all([
            getTableData(name, page, limit),
            getTableColumns(name),
        ]);

        return NextResponse.json({
            ...data,
            columns,
        });
    } catch (error) {
        console.error('Table data error:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Failed to get table data' },
            { status: 500 }
        );
    }
}
