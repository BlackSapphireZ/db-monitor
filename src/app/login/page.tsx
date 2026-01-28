'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login failed');
                return;
            }

            // Use hard redirect to ensure cookie is properly sent
            window.location.href = '/dashboard';
        } catch (err) {
            setError('Connection error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
            {/* Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-blue-600/5 to-transparent rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-sm relative">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 mb-4">
                        <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-semibold text-white">DB Monitor</h1>
                    <p className="text-gray-600 text-sm mt-1">Production Server Dashboard</p>
                </div>

                {/* Login Card */}
                <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition"
                                placeholder="Enter username"
                                autoFocus
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg text-white text-sm placeholder-gray-700 focus:outline-none focus:border-blue-500/50 transition"
                                placeholder="Enter password"
                            />
                        </div>

                        {error && (
                            <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 px-3 py-2.5 rounded-lg">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{error}</span>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !username.trim() || !password}
                            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                <span>Sign In</span>
                            )}
                        </button>
                    </form>
                </div>

                {/* Server Info */}
                <div className="mt-6 text-center">
                    <div className="inline-flex items-center gap-2 text-gray-700 text-xs">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
                        <span className="font-mono">206.189.36.199</span>
                        <span>•</span>
                        <span>DigitalOcean</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
