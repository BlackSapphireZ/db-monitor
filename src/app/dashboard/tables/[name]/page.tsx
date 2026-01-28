'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface TableData {
    data: Record<string, unknown>[];
    columns: { column_name: string; data_type: string }[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface ImageModalProps {
    url: string;
    name: string;
    onClose: () => void;
}

function ImageModal({ url, name, onClose }: ImageModalProps) {
    return (
        <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-8"
            onClick={onClose}
        >
            <div className="relative max-w-4xl max-h-full">
                <button
                    onClick={onClose}
                    className="absolute -top-10 right-0 text-gray-400 hover:text-white text-sm"
                >
                    Close
                </button>
                <img src={url} alt={name} className="max-w-full max-h-[80vh] rounded-lg" loading="lazy" />
                <div className="text-center mt-3 text-gray-500 text-xs">{name}</div>
            </div>
        </div>
    );
}

function CellRenderer({ value, columnName, onImageClick }: {
    value: unknown;
    columnName: string;
    onImageClick: (url: string, name: string) => void;
}) {
    if (value === null) {
        return <span className="text-gray-700">null</span>;
    }

    // Handle content field that might contain file/image JSON
    if (columnName === 'content' && typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);

            // Check if it's an image
            if (parsed.url && parsed.type?.startsWith('image/')) {
                return (
                    <div className="flex items-center gap-2">
                        <img
                            src={parsed.url}
                            alt={parsed.name || 'Image'}
                            className="w-10 h-10 rounded object-cover cursor-pointer hover:opacity-80 transition"
                            loading="lazy"
                            onClick={(e) => {
                                e.stopPropagation();
                                onImageClick(parsed.url, parsed.name || 'Image');
                            }}
                        />
                        <span className="text-xs text-gray-600 truncate max-w-[80px]">
                            {parsed.name}
                        </span>
                    </div>
                );
            }

            // Check if it's a file
            if (parsed.url && parsed.name) {
                return (
                    <a
                        href={parsed.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline text-xs"
                    >
                        {parsed.name.substring(0, 25)}...
                    </a>
                );
            }

            // Check if it's an event
            if (parsed.namespace) {
                return (
                    <span className="px-2 py-0.5 bg-gray-800 text-gray-400 rounded text-xs">
                        {parsed.namespace}
                    </span>
                );
            }
        } catch {
            // Not JSON, render as text
        }
    }

    // Handle type field
    if (columnName === 'type' && typeof value === 'string') {
        const colors: Record<string, string> = {
            text: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
            file: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
            audio: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            event: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs border ${colors[value] || 'bg-gray-800 text-gray-400'}`}>
                {value}
            </span>
        );
    }

    // Handle origin field
    if (columnName === 'origin' && typeof value === 'string') {
        const colors: Record<string, string> = {
            operator: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            chat: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
        };
        return (
            <span className={`px-2 py-0.5 rounded text-xs border ${colors[value] || 'bg-gray-800 text-gray-400'}`}>
                {value}
            </span>
        );
    }

    // Handle timestamp fields
    if ((columnName.includes('timestamp') || columnName.includes('At') || columnName === 'timestampMs') && value) {
        const strValue = String(value);
        if (/^\d{13}$/.test(strValue)) {
            const date = new Date(parseInt(strValue));
            return (
                <span className="font-mono text-xs text-gray-500">
                    {date.toLocaleDateString('th-TH')} {date.toLocaleTimeString('th-TH', { hour12: false })}
                </span>
            );
        }
        if (strValue.includes('T') || strValue.includes('-')) {
            const date = new Date(strValue);
            return (
                <span className="font-mono text-xs text-gray-500">
                    {date.toLocaleDateString('th-TH')} {date.toLocaleTimeString('th-TH', { hour12: false })}
                </span>
            );
        }
    }

    // Handle long strings
    const strValue = String(value);
    if (strValue.length > 40) {
        return (
            <span title={strValue} className="cursor-help text-gray-400">
                {strValue.substring(0, 40)}...
            </span>
        );
    }

    return <span className="text-gray-400">{strValue}</span>;
}

export default function TableDetailPage() {
    const params = useParams();
    const tableName = params.name as string;
    const [tableData, setTableData] = useState<TableData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [selectedImage, setSelectedImage] = useState<{ url: string; name: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/tables/${tableName}?page=${page}&limit=25`);
                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setTableData(data);
            } catch (err) {
                setError('Failed to fetch table data');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tableName, page]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-600 mt-4 text-sm">Loading data...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#111] rounded-lg p-8 text-center border border-[#1a1a1a]">
                <div className="text-red-400 mb-2">Error</div>
                <div className="text-gray-500 text-sm">{error}</div>
            </div>
        );
    }

    const columns = tableData?.columns || [];
    const rows = tableData?.data || [];

    // Count message types if this is the Message table
    const typeCounts = tableName === 'Message' ? rows.reduce<Record<string, number>>((acc, row) => {
        const type = String(row.type || 'unknown');
        acc[type] = (acc[type] || 0) + 1;
        return acc;
    }, {}) : null;

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="w-8 h-8 rounded-lg bg-[#141414] flex items-center justify-center text-gray-500 hover:text-white hover:bg-[#1a1a1a] transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                        </svg>
                    </Link>
                    <div>
                        <h1 className="text-lg font-semibold text-white">{tableName}</h1>
                        <p className="text-gray-600 text-xs">
                            {tableData?.total.toLocaleString()} records
                        </p>
                    </div>
                </div>
                {typeCounts && (
                    <div className="flex gap-2">
                        {Object.entries(typeCounts).map(([type, count]) => (
                            <div key={type} className="bg-[#111] px-3 py-1.5 rounded border border-[#1a1a1a] text-center">
                                <div className="text-[10px] text-gray-600 uppercase">{type}</div>
                                <div className="text-sm font-medium text-white">{count}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Table */}
            <div className="bg-[#0d0d0d] rounded-lg border border-[#1a1a1a] overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1a1a1a]">
                                {columns.map((col) => (
                                    <th key={col.column_name} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide bg-[#0a0a0a]">
                                        <div>{col.column_name}</div>
                                        <div className="text-[9px] text-gray-700 font-normal normal-case mt-0.5">
                                            {col.data_type}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[#141414]">
                            {rows.map((row, rowIndex) => (
                                <tr key={rowIndex} className="hover:bg-[#111] transition">
                                    {columns.map((col) => (
                                        <td key={col.column_name} className="px-4 py-2.5 text-sm">
                                            <CellRenderer
                                                value={row[col.column_name]}
                                                columnName={col.column_name}
                                                onImageClick={(url, name) => setSelectedImage({ url, name })}
                                            />
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-[#1a1a1a] bg-[#0a0a0a]">
                    <div className="text-gray-600 text-xs">
                        Page {tableData?.page} of {tableData?.totalPages}
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => setPage(1)}
                            disabled={page === 1}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            First
                        </button>
                        <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-3 py-1.5 text-xs bg-[#141414] text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Prev
                        </button>
                        <div className="px-3 py-1.5 bg-[#1a1a1a] text-white text-xs rounded font-mono min-w-[40px] text-center">
                            {page}
                        </div>
                        <button
                            onClick={() => setPage((p) => p + 1)}
                            disabled={page >= (tableData?.totalPages || 1)}
                            className="px-3 py-1.5 text-xs bg-[#141414] text-gray-400 hover:text-white rounded disabled:opacity-30 disabled:cursor-not-allowed transition"
                        >
                            Next
                        </button>
                        <button
                            onClick={() => setPage(tableData?.totalPages || 1)}
                            disabled={page >= (tableData?.totalPages || 1)}
                            className="px-2 py-1 text-xs text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                            Last
                        </button>
                    </div>
                </div>
            </div>

            {/* Image Modal */}
            {selectedImage && (
                <ImageModal
                    url={selectedImage.url}
                    name={selectedImage.name}
                    onClose={() => setSelectedImage(null)}
                />
            )}
        </div>
    );
}
