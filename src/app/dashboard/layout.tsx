'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface SidebarProps {
    children: React.ReactNode;
}

interface TableInfo {
    name: string;
    rows: number;
}

export default function DashboardLayout({ children }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAuthed, setIsAuthed] = useState(false);
    const [serverTime, setServerTime] = useState('');
    const [tables, setTables] = useState<TableInfo[]>([]);
    const [dbExpanded, setDbExpanded] = useState(true);
    const [sidebarOpen, setSidebarOpen] = useState(false);

    useEffect(() => {
        fetch('/api/auth/check')
            .then(res => {
                if (!res.ok) {
                    router.push('/login');
                } else {
                    setIsAuthed(true);
                    return fetch('/api/tables');
                }
            })
            .then(res => res?.json())
            .then(data => {
                if (data?.tables) {
                    setTables(data.tables.sort((a: TableInfo, b: TableInfo) => b.rows - a.rows));
                }
            })
            .catch(() => {
                router.push('/login');
            })
            .finally(() => {
                setIsLoading(false);
            });

        const updateTime = () => {
            setServerTime(new Date().toLocaleTimeString('th-TH', { hour12: false }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, [router]);

    useEffect(() => {
        if (pathname.includes('/tables')) {
            setDbExpanded(true);
        }
    }, [pathname]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setSidebarOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/login');
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
                <div className="text-center">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <div className="text-gray-500 text-sm">Connecting...</div>
                </div>
            </div>
        );
    }

    if (!isAuthed) return null;

    const isOverviewActive = pathname === '/dashboard';
    const isQueryActive = pathname === '/dashboard/query';
    const currentTable = pathname.match(/\/tables\/(.+)/)?.[1];

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex">
            {/* Mobile Header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-[#0f0f0f] border-b border-[#1a1a1a] px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                        </svg>
                    </div>
                    <h1 className="font-semibold text-white text-sm">DB Monitor</h1>
                </div>
                <button
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                    className="p-2 min-w-[44px] min-h-[44px] flex items-center justify-center text-gray-400 hover:text-white"
                >
                    {sidebarOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Overlay for mobile */}
            {sidebarOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/50 z-40"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar - Hidden on mobile, shown on lg+ */}
            <aside className={`
                w-64 lg:w-56 bg-[#0f0f0f] border-r border-[#1a1a1a] flex flex-col fixed h-screen z-50
                transition-transform duration-300 ease-in-out
                ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}>
                {/* Logo - Hidden on mobile (shown in header instead) */}
                <div className="hidden lg:block p-4 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                            </svg>
                        </div>
                        <div>
                            <h1 className="font-semibold text-white text-sm">DB Monitor</h1>
                            <p className="text-[10px] text-gray-600">Production</p>
                        </div>
                    </div>
                </div>

                {/* Mobile spacer */}
                <div className="lg:hidden h-14"></div>

                {/* Connection Status */}
                <div className="px-4 py-3 border-b border-[#1a1a1a]">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="text-[11px] text-emerald-500 font-medium">Connected</span>
                    </div>
                    <div className="text-[11px] text-gray-600 font-mono">206.189.36.199</div>
                    <div className="text-[10px] text-gray-700 font-mono">{serverTime}</div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 py-3 overflow-y-auto">
                    {/* Overview */}
                    <div className="px-2 mb-1">
                        <Link
                            href="/dashboard"
                            className={`flex items-center gap-2.5 px-3 py-3 lg:py-2 rounded-md text-sm transition min-h-[44px] ${isOverviewActive
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#141414]'
                                }`}
                        >
                            <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <span>Overview</span>
                        </Link>
                    </div>

                    {/* Database Section */}
                    <div className="px-2 mb-1">
                        <button
                            onClick={() => setDbExpanded(!dbExpanded)}
                            className="w-full flex items-center gap-2.5 px-3 py-3 lg:py-2 rounded-md text-sm text-gray-500 hover:text-gray-300 hover:bg-[#141414] transition min-h-[44px]"
                        >
                            <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                            </svg>
                            <span className="flex-1 text-left">Database</span>
                            <svg className={`w-3 h-3 transition-transform ${dbExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        {dbExpanded && (
                            <div className="ml-5 mt-1 border-l border-[#1a1a1a] pl-3 space-y-0.5 max-h-[350px] overflow-y-auto">
                                {tables.map((table) => {
                                    const isActive = currentTable === table.name;
                                    return (
                                        <Link
                                            key={table.name}
                                            href={`/dashboard/tables/${table.name}`}
                                            className={`flex items-center justify-between px-2 py-2.5 lg:py-1.5 rounded text-[13px] transition min-h-[40px] lg:min-h-0 ${isActive
                                                ? 'bg-blue-500/10 text-blue-400'
                                                : 'text-gray-600 hover:text-gray-400 hover:bg-[#141414]'
                                                }`}
                                        >
                                            <span className="truncate">{table.name}</span>
                                            <span className="text-[10px] text-gray-700 font-mono ml-2">
                                                {table.rows > 999 ? `${(table.rows / 1000).toFixed(1)}k` : table.rows}
                                            </span>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* SQL Query */}
                    <div className="px-2 mb-1">
                        <Link
                            href="/dashboard/query"
                            className={`flex items-center gap-2.5 px-3 py-3 lg:py-2 rounded-md text-sm transition min-h-[44px] ${isQueryActive
                                ? 'bg-blue-500/10 text-blue-400'
                                : 'text-gray-500 hover:text-gray-300 hover:bg-[#141414]'
                                }`}
                        >
                            <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>SQL Query</span>
                        </Link>
                    </div>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-[#1a1a1a]">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-3 py-3 lg:py-2 text-gray-600 hover:text-gray-400 hover:bg-[#141414] rounded-md transition text-sm min-h-[44px]"
                    >
                        <svg className="w-5 h-5 lg:w-4 lg:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main content */}
            <main className="flex-1 lg:ml-56 p-4 lg:p-6 overflow-auto min-h-screen pt-16 lg:pt-6">
                <div className="max-w-6xl mx-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
