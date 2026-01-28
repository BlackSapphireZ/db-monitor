'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Table {
    name: string;
    columns: number;
    rows: number;
}

const tableIcons: Record<string, string> = {
    Message: '💬',
    Conversation: '🗨️',
    Employee: '👥',
    Admin: '🔐',
    BonusEvaluation: '💰',
    BonusDetail: '📋',
    PerformanceAppraisal: '📊',
    _prisma_migrations: '⚙️',
};

function getTableIcon(name: string): string {
    return tableIcons[name] || '📄';
}

function formatNumber(num: number): string {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
}

export default function TablesPage() {
    const [tables, setTables] = useState<Table[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchTables = async () => {
            try {
                const res = await fetch('/api/tables');
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setTables(data.tables);
            } catch (err) {
                setError('Failed to fetch tables');
            } finally {
                setLoading(false);
            }
        };

        fetchTables();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="relative">
                    <div className="w-16 h-16 border-4 border-purple-500/20 rounded-full"></div>
                    <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin absolute top-0"></div>
                </div>
                <div className="text-gray-400 mt-6">Loading tables...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="glass-card p-8 text-center">
                <div className="text-5xl mb-4">⚠️</div>
                <div className="text-red-400">{error}</div>
            </div>
        );
    }

    const totalRows = tables.reduce((sum, t) => sum + t.rows, 0);
    const sortedTables = [...tables].sort((a, b) => b.rows - a.rows);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">Database Tables</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Browse and explore PostgreSQL tables
                    </p>
                </div>
                <div className="flex gap-3">
                    <div className="glass-card px-4 py-2">
                        <div className="text-xs text-gray-500">Tables</div>
                        <div className="text-lg font-bold text-white">{tables.length}</div>
                    </div>
                    <div className="glass-card px-4 py-2">
                        <div className="text-xs text-gray-500">Total Rows</div>
                        <div className="text-lg font-bold text-white">{totalRows.toLocaleString()}</div>
                    </div>
                </div>
            </div>

            {/* Tables Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedTables.map((table) => (
                    <Link
                        key={table.name}
                        href={`/dashboard/tables/${table.name}`}
                        className="glass-card glass-card-hover p-5 transition group"
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-xl">
                                    {getTableIcon(table.name)}
                                </div>
                                <div>
                                    <div className="font-medium text-white group-hover:text-blue-400 transition">
                                        {table.name}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {table.columns} columns
                                    </div>
                                </div>
                            </div>
                            <span className="text-gray-600 group-hover:text-gray-400 transition">→</span>
                        </div>
                        <div className="flex items-center justify-between pt-3 border-t border-[#222]">
                            <span className="text-sm text-gray-500">Rows</span>
                            <span className="text-lg font-semibold text-white">
                                {table.rows.toLocaleString()}
                            </span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
