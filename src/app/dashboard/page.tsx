'use client';

import { useEffect, useState, useRef } from 'react';

interface Metrics {
    cpu: { usage: number; cores: number; load?: number };
    memory: { total: number; used: number; usage: number };
    disk: { total: number; used: number; usage: number };
    network: { rx: number; tx: number };
    database: { size: string; tableCount: number; activeConnections: number };
    uptime?: string;
    server?: {
        ip: string;
        plan: string;
        specs: { cpu: string; ram: string; disk: string; transfer: string };
    };
}

interface DataPoint {
    time: number;
    cpu: number;
    memory: number;
    disk: number;
    networkRx: number;
    networkTx: number;
}

type TimeRange = '5m' | '10m' | '30m' | '1h' | '24h';

const TIME_RANGES: { key: TimeRange; label: string; points: number; interval: number }[] = [
    { key: '5m', label: '5 นาที', points: 30, interval: 10000 },
    { key: '10m', label: '10 นาที', points: 60, interval: 10000 },
    { key: '30m', label: '30 นาที', points: 90, interval: 20000 },
    { key: '1h', label: '1 ชม', points: 120, interval: 30000 },
    { key: '24h', label: '24 ชม', points: 144, interval: 600000 },
];

// Mini Chart Component
function MiniChart({ data, dataKey, color, height = 40 }: {
    data: DataPoint[];
    dataKey: keyof DataPoint;
    color: string;
    height?: number;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const width = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, width, h);

        const values = data.map(d => Number(d[dataKey]) || 0);
        const max = Math.max(...values, 100);
        const min = 0;

        const gradient = ctx.createLinearGradient(0, 0, 0, h);
        gradient.addColorStop(0, color + '40');
        gradient.addColorStop(1, color + '00');

        ctx.beginPath();
        ctx.moveTo(0, h);

        values.forEach((val, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = h - ((val - min) / (max - min)) * h;
            ctx.lineTo(x, y);
        });

        ctx.lineTo(width, h);
        ctx.closePath();
        ctx.fillStyle = gradient;
        ctx.fill();

        ctx.beginPath();
        values.forEach((val, i) => {
            const x = (i / (values.length - 1)) * width;
            const y = h - ((val - min) / (max - min)) * h;
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.stroke();

        if (values.length > 0) {
            const lastVal = values[values.length - 1];
            const lastX = width;
            const lastY = h - ((lastVal - min) / (max - min)) * h;
            ctx.beginPath();
            ctx.arc(lastX - 2, lastY, 3, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.fill();
        }
    }, [data, dataKey, color]);

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={height}
            className="w-full"
            style={{ height: `${height}px` }}
        />
    );
}

// Large Chart with Time Range
function LargeChart({
    data,
    title,
    timeRange,
    onTimeRangeChange
}: {
    data: DataPoint[];
    title: string;
    timeRange: TimeRange;
    onTimeRangeChange: (range: TimeRange) => void;
}) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas || data.length < 2) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        ctx.scale(dpr, dpr);

        const width = rect.width;
        const h = rect.height;
        const padding = { top: 25, right: 15, bottom: 35, left: 50 };
        const chartWidth = width - padding.left - padding.right;
        const chartHeight = h - padding.top - padding.bottom;

        ctx.clearRect(0, 0, width, h);

        // Grid
        ctx.strokeStyle = '#222';
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(width - padding.right, y);
            ctx.stroke();
        }

        // Y-axis labels
        ctx.fillStyle = '#666';
        ctx.font = '600 12px Inter, system-ui, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        for (let i = 0; i <= 4; i++) {
            const y = padding.top + (chartHeight / 4) * i;
            ctx.fillText(`${100 - i * 25}%`, padding.left - 10, y);
        }

        // Lines
        const lines = [
            { key: 'cpu' as const, color: '#10b981' },
            { key: 'memory' as const, color: '#8b5cf6' },
        ];

        lines.forEach(({ key, color }) => {
            const values = data.map(d => Number(d[key]) || 0);

            const gradient = ctx.createLinearGradient(0, padding.top, 0, h - padding.bottom);
            gradient.addColorStop(0, color + '25');
            gradient.addColorStop(1, color + '05');

            ctx.beginPath();
            ctx.moveTo(padding.left, h - padding.bottom);

            values.forEach((val, i) => {
                const x = padding.left + (i / (values.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - (val / 100) * chartHeight;
                ctx.lineTo(x, y);
            });

            ctx.lineTo(padding.left + chartWidth, h - padding.bottom);
            ctx.closePath();
            ctx.fillStyle = gradient;
            ctx.fill();

            ctx.beginPath();
            values.forEach((val, i) => {
                const x = padding.left + (i / (values.length - 1)) * chartWidth;
                const y = padding.top + chartHeight - (val / 100) * chartHeight;
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = 2.5;
            ctx.lineJoin = 'round';
            ctx.lineCap = 'round';
            ctx.stroke();
        });

        // X-axis labels based on time range
        ctx.fillStyle = '#666';
        ctx.font = '600 11px Inter, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        const rangeConfig = TIME_RANGES.find(r => r.key === timeRange)!;
        let timeLabels: string[];

        switch (timeRange) {
            case '5m': timeLabels = ['5m ago', '2.5m ago', 'Now']; break;
            case '10m': timeLabels = ['10m ago', '5m ago', 'Now']; break;
            case '30m': timeLabels = ['30m ago', '15m ago', 'Now']; break;
            case '1h': timeLabels = ['1h ago', '30m ago', 'Now']; break;
            case '24h': timeLabels = ['24h ago', '12h ago', 'Now']; break;
            default: timeLabels = ['Start', 'Mid', 'Now'];
        }

        timeLabels.forEach((label, i) => {
            const x = padding.left + (i / 2) * chartWidth;
            ctx.fillText(label, x, h - padding.bottom + 12);
        });

    }, [data, timeRange]);

    return (
        <div className="bg-[#111] rounded-lg p-5 border border-[#1a1a1a]">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium text-white">{title}</span>
                    {/* Time Range Buttons */}
                    <div className="flex gap-1 bg-[#0a0a0a] rounded-lg p-1">
                        {TIME_RANGES.map(({ key, label }) => (
                            <button
                                key={key}
                                onClick={() => onTimeRangeChange(key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded transition ${timeRange === key
                                        ? 'bg-blue-600 text-white'
                                        : 'text-gray-500 hover:text-gray-300 hover:bg-[#1a1a1a]'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-5 text-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 rounded-full bg-emerald-500"></div>
                        <span className="text-gray-400">CPU</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-0.5 rounded-full bg-violet-500"></div>
                        <span className="text-gray-400">Memory</span>
                    </div>
                </div>
            </div>
            <canvas
                ref={canvasRef}
                className="w-full"
                style={{ height: '180px', width: '100%' }}
            />
            <div className="flex items-center justify-between mt-3 text-xs text-gray-600">
                <span>อัปเดตอัตโนมัติทุก {TIME_RANGES.find(r => r.key === timeRange)!.interval / 1000} วินาที</span>
                <span className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                    เก็บข้อมูล {data.length} จุด
                </span>
            </div>
        </div>
    );
}

function getStatus(usage: number): 'normal' | 'warning' | 'critical' {
    if (usage >= 90) return 'critical';
    if (usage >= 70) return 'warning';
    return 'normal';
}

function getBarColor(status: string) {
    if (status === 'critical') return 'bg-red-500';
    if (status === 'warning') return 'bg-amber-500';
    return 'bg-emerald-500';
}

function getLineColor(status: string) {
    if (status === 'critical') return '#ef4444';
    if (status === 'warning') return '#f59e0b';
    return '#10b981';
}

function formatBytes(mb: number): string {
    if (mb >= 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(0)} MB`;
}

export default function DashboardPage() {
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [history, setHistory] = useState<DataPoint[]>([]);
    const [timeRange, setTimeRange] = useState<TimeRange>('5m');
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    const fetchMetrics = async () => {
        try {
            const res = await fetch('/api/metrics');
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setMetrics(data);
            setError('');
            setLastUpdate(new Date());

            const rangeConfig = TIME_RANGES.find(r => r.key === timeRange)!;

            setHistory(prev => {
                const newPoint: DataPoint = {
                    time: Date.now(),
                    cpu: data.cpu.usage,
                    memory: data.memory.usage,
                    disk: data.disk.usage,
                    networkRx: data.network.rx,
                    networkTx: data.network.tx,
                };
                const updated = [...prev, newPoint];
                return updated.slice(-rangeConfig.points);
            });
        } catch (err) {
            setError('Connection failed');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();

        const rangeConfig = TIME_RANGES.find(r => r.key === timeRange)!;

        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        intervalRef.current = setInterval(fetchMetrics, rangeConfig.interval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [timeRange]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh]">
                <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <div className="text-gray-500 mt-4 text-sm">Fetching server metrics...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-[#222]">
                <div className="text-red-400 text-lg mb-2">Connection Error</div>
                <div className="text-gray-500 text-sm mb-4">{error}</div>
                <button onClick={fetchMetrics} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition">
                    Retry
                </button>
            </div>
        );
    }

    const cpuStatus = getStatus(metrics?.cpu.usage || 0);
    const memStatus = getStatus(metrics?.memory.usage || 0);
    const diskStatus = getStatus(metrics?.disk.usage || 0);

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-semibold text-white">Server Overview</h1>
                    <p className="text-gray-600 text-sm mt-0.5">
                        Real-time monitoring • DigitalOcean Droplet
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                        <span className="text-emerald-400 text-xs font-medium">Live</span>
                    </div>
                    <div className="text-right">
                        <div className="text-[10px] text-gray-600 uppercase tracking-wide">Last updated</div>
                        <div className="text-sm font-mono text-gray-400">
                            {lastUpdate?.toLocaleTimeString('th-TH', { hour12: false })}
                        </div>
                    </div>
                </div>
            </div>

            {/* Server Info */}
            <div className="bg-gradient-to-r from-blue-900/20 to-indigo-900/20 rounded-lg p-4 border border-blue-800/30">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-white font-medium text-sm">{metrics?.server?.plan || 'DigitalOcean Droplet'}</div>
                            <div className="text-gray-500 text-xs">
                                {metrics?.server?.specs.cpu} • {metrics?.server?.specs.ram} RAM • {metrics?.server?.specs.disk} SSD
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {metrics?.uptime && (
                            <div className="text-right">
                                <div className="text-[10px] text-gray-600 uppercase">Uptime</div>
                                <div className="text-sm text-gray-400 font-mono">{metrics.uptime}</div>
                            </div>
                        )}
                        <div className={`px-3 py-1 rounded text-xs font-medium ${memStatus === 'normal' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                memStatus === 'warning' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                    'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}>
                            {memStatus === 'normal' ? 'Healthy' : memStatus === 'warning' ? 'Warning' : 'Critical'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Metrics Grid */}
            <div className="grid grid-cols-4 gap-4">
                {/* CPU */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">CPU</span>
                        <div className={`w-2 h-2 rounded-full ${getBarColor(cpuStatus)}`}></div>
                    </div>
                    <div className="text-2xl font-semibold text-white mb-1">
                        {metrics?.cpu.usage}<span className="text-lg text-gray-600">%</span>
                    </div>
                    <div className="text-[10px] text-gray-600 mb-2">
                        {metrics?.cpu.cores} vCPU {metrics?.cpu.load ? `• Load ${metrics.cpu.load.toFixed(2)}` : ''}
                    </div>
                    <MiniChart data={history} dataKey="cpu" color={getLineColor(cpuStatus)} />
                </div>

                {/* Memory */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Memory</span>
                        <div className={`w-2 h-2 rounded-full ${getBarColor(memStatus)}`}></div>
                    </div>
                    <div className="text-2xl font-semibold text-white mb-1">
                        {metrics?.memory.usage}<span className="text-lg text-gray-600">%</span>
                    </div>
                    <div className="text-[10px] text-gray-600 mb-2">
                        {metrics?.memory.used} / {metrics?.memory.total} GB
                    </div>
                    <MiniChart data={history} dataKey="memory" color={getLineColor(memStatus)} />
                </div>

                {/* Disk */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Storage</span>
                        <div className={`w-2 h-2 rounded-full ${getBarColor(diskStatus)}`}></div>
                    </div>
                    <div className="text-2xl font-semibold text-white mb-1">
                        {metrics?.disk.usage}<span className="text-lg text-gray-600">%</span>
                    </div>
                    <div className="text-[10px] text-gray-600 mb-2">
                        {metrics?.disk.used} / {metrics?.disk.total} GB
                    </div>
                    <MiniChart data={history} dataKey="disk" color={getLineColor(diskStatus)} />
                </div>

                {/* Network */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-gray-500 text-xs font-medium uppercase tracking-wide">Network</span>
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-2">
                        <div>
                            <div className="text-[10px] text-gray-600">IN</div>
                            <div className="text-sm font-semibold text-indigo-400">{formatBytes(metrics?.network.rx || 0)}</div>
                        </div>
                        <div>
                            <div className="text-[10px] text-gray-600">OUT</div>
                            <div className="text-sm font-semibold text-violet-400">{formatBytes(metrics?.network.tx || 0)}</div>
                        </div>
                    </div>
                    <MiniChart data={history} dataKey="networkRx" color="#818cf8" />
                </div>
            </div>

            {/* Large Chart with Time Range Selector */}
            <LargeChart
                data={history}
                title="CPU & Memory Usage"
                timeRange={timeRange}
                onTimeRangeChange={setTimeRange}
            />

            {/* Bottom Section */}
            <div className="grid grid-cols-3 gap-4">
                {/* Database Stats */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Database</div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Size</span>
                            <span className="text-white font-medium">{metrics?.database.size}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Tables</span>
                            <span className="text-white font-medium">{metrics?.database.tableCount}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Connections</span>
                            <span className="text-white font-medium">{metrics?.database.activeConnections}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">System</div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Server IP</span>
                            <span className="text-white font-mono text-sm">206.189.36.199</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Region</span>
                            <span className="text-white">Singapore</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">Provider</span>
                            <span className="text-white">DigitalOcean</span>
                        </div>
                    </div>
                </div>

                {/* Status */}
                <div className="bg-[#111] rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="text-xs text-gray-500 font-medium uppercase tracking-wide mb-3">Health Check</div>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">PostgreSQL</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">Online</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">SSH</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">Connected</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600 text-sm">API</span>
                            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 text-xs rounded">Healthy</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Notice */}
            {(metrics?.memory.usage || 0) >= 70 && (
                <div className="bg-amber-900/10 rounded-lg p-4 border border-amber-800/30">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-amber-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div className="flex-1">
                            <h3 className="text-amber-400 font-medium text-sm mb-1">Consider Upgrading</h3>
                            <p className="text-gray-500 text-xs">
                                Memory usage is at {metrics?.memory.usage}%. For better performance, consider upgrading to 2GB RAM.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
