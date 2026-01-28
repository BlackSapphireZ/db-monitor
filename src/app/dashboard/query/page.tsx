'use client';

import { useState } from 'react';

interface QueryResult {
    rows: Record<string, unknown>[];
    rowCount: number;
    fields: string[];
    executionTime?: number;
}

const exampleQueries = [
    { name: 'Count Messages', sql: 'SELECT COUNT(*) as total FROM "Message"' },
    { name: 'Recent Conversations', sql: 'SELECT * FROM "Conversation" ORDER BY "createdAt" DESC LIMIT 10' },
    { name: 'Message Types', sql: 'SELECT type, COUNT(*) as count FROM "Message" GROUP BY type' },
    { name: 'Top Operators', sql: 'SELECT "userNickname", COUNT(*) as messages FROM "Message" WHERE origin = \'operator\' GROUP BY "userNickname" ORDER BY messages DESC LIMIT 10' },
    { name: 'Image Messages', sql: 'SELECT * FROM "Message" WHERE type = \'file\' LIMIT 20' },
];

export default function QueryPage() {
    const [sql, setSql] = useState('SELECT * FROM "Conversation" LIMIT 10');
    const [result, setResult] = useState<QueryResult | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<string[]>([]);

    const runQuery = async () => {
        setLoading(true);
        setError('');
        setResult(null);

        const startTime = Date.now();

        try {
            const res = await fetch('/api/query', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sql }),
            });

            const data = await res.json();
            const executionTime = Date.now() - startTime;

            if (!res.ok) {
                setError(data.error || 'Query failed');
                return;
            }

            setResult({ ...data, executionTime });

            if (!history.includes(sql)) {
                setHistory(prev => [sql, ...prev].slice(0, 5));
            }
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
            runQuery();
        }
    };

    return (
        <div className="space-y-5">
            {/* Header */}
            <div>
                <h1 className="text-xl font-semibold text-white">SQL Query</h1>
                <p className="text-gray-600 text-sm mt-0.5">Execute read-only queries</p>
            </div>

            {/* Quick Queries */}
            <div className="flex flex-wrap gap-2">
                {exampleQueries.map((q, i) => (
                    <button
                        key={i}
                        onClick={() => setSql(q.sql)}
                        className="px-3 py-1.5 bg-[#111] hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300 text-xs rounded border border-[#1a1a1a] transition"
                    >
                        {q.name}
                    </button>
                ))}
            </div>

            {/* Query Editor */}
            <div className="bg-[#0d0d0d] rounded-lg border border-[#1a1a1a] p-4">
                <div className="flex items-center justify-between mb-2">
                    <label className="text-xs text-gray-500 font-medium uppercase tracking-wide">SQL Query</label>
                    <div className="text-[10px] text-gray-700">Cmd+Enter to run</div>
                </div>
                <textarea
                    value={sql}
                    onChange={(e) => setSql(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full h-28 px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white font-mono text-sm focus:outline-none focus:border-blue-500/50 resize-none"
                    placeholder='SELECT * FROM "TableName" LIMIT 10'
                    spellCheck={false}
                />
                <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-3">
                        <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded text-xs">
                            SELECT only
                        </span>
                        {result && (
                            <span className="text-xs text-gray-600">
                                {result.executionTime}ms
                            </span>
                        )}
                    </div>
                    <button
                        onClick={runQuery}
                        disabled={loading || !sql.trim()}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded transition flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>Running...</span>
                            </>
                        ) : (
                            <span>Run Query</span>
                        )}
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-900/10 rounded-lg p-4 border border-red-800/30">
                    <div className="flex items-start gap-3">
                        <svg className="w-4 h-4 text-red-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <div className="text-red-400 text-sm font-medium">Query Error</div>
                            <div className="text-gray-500 text-xs mt-1">{error}</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Results */}
            {result && (
                <div className="bg-[#0d0d0d] rounded-lg border border-[#1a1a1a] overflow-hidden">
                    <div className="px-4 py-3 border-b border-[#1a1a1a] flex items-center justify-between bg-[#0a0a0a]">
                        <div className="flex items-center gap-3">
                            <span className="text-white text-sm font-medium">Results</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded text-xs">
                                {result.rowCount} rows
                            </span>
                        </div>
                        <button
                            onClick={() => {
                                const csv = [
                                    result.fields.join(','),
                                    ...result.rows.map(row =>
                                        result.fields.map(f => JSON.stringify(row[f] ?? '')).join(',')
                                    )
                                ].join('\n');
                                navigator.clipboard.writeText(csv);
                            }}
                            className="px-3 py-1 bg-[#141414] hover:bg-[#1a1a1a] text-gray-500 hover:text-gray-300 text-xs rounded transition"
                        >
                            Copy CSV
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-[350px] overflow-y-auto">
                        <table className="w-full">
                            <thead className="sticky top-0">
                                <tr className="border-b border-[#1a1a1a]">
                                    <th className="px-3 py-2 text-center text-xs text-gray-600 bg-[#0a0a0a] w-10">#</th>
                                    {result.fields.map((field) => (
                                        <th key={field} className="px-4 py-2 text-left text-xs font-medium text-gray-500 bg-[#0a0a0a]">
                                            {field}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#141414]">
                                {result.rows.map((row, rowIndex) => (
                                    <tr key={rowIndex} className="hover:bg-[#111]">
                                        <td className="px-3 py-2 text-center text-xs text-gray-700">
                                            {rowIndex + 1}
                                        </td>
                                        {result.fields.map((field) => (
                                            <td key={field} className="px-4 py-2 text-sm text-gray-400 max-w-xs">
                                                {row[field] === null ? (
                                                    <span className="text-gray-700">null</span>
                                                ) : typeof row[field] === 'object' ? (
                                                    <pre className="text-xs text-purple-400 max-w-[200px] truncate">
                                                        {JSON.stringify(row[field])}
                                                    </pre>
                                                ) : (
                                                    <span className="truncate block">
                                                        {String(row[field]).length > 50
                                                            ? String(row[field]).substring(0, 50) + '...'
                                                            : String(row[field])
                                                        }
                                                    </span>
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Query History */}
            {history.length > 0 && (
                <div>
                    <div className="text-xs text-gray-600 mb-2 uppercase tracking-wide">Recent Queries</div>
                    <div className="space-y-1">
                        {history.map((q, i) => (
                            <button
                                key={i}
                                onClick={() => setSql(q)}
                                className="w-full text-left px-3 py-2 bg-[#0d0d0d] hover:bg-[#111] text-gray-500 hover:text-gray-400 text-xs font-mono rounded truncate border border-[#1a1a1a] transition"
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
