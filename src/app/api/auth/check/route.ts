import { NextResponse } from 'next/server';
import { isAuthenticated } from '@/lib/auth';

export async function GET() {
    const authenticated = await isAuthenticated();

    if (!authenticated) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({ authenticated: true });
}
