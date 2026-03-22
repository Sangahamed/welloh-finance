import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStockData } from '../services/geminiService';
import { GlobeAltIcon, ArrowUpIcon, ArrowDownIcon, TrophyIcon, ChartBarIcon, BoltIcon, SparklesIcon, RocketLaunchIcon, UserIcon, ClockIcon } from './icons/Icons';
import type { UserAccount } from '../types';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';
import AnimatedBackground from './ui/AnimatedBackground';
import CountUp from './ui/CountUp';

const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);

const LEAGUES = [
    { name: 'Bronze', minScore: -Infinity, color: 'text-orange-400', emoji: '🥉' },
    { name: 'Silver', minScore: 10, color: 'text-gray-300', emoji: '🥈' },
    { name: 'Gold', minScore: 25, color: 'text-yellow-400', emoji: '🥇' },
    { name: 'Sapphire', minScore: 50, color: 'text-violet-400', emoji: '💎' },
    { name: 'Diamond', minScore: 100, color: 'text-cyan-400', emoji: '⚡' },
    { name: 'Legend', minScore: 200, color: 'text-neon-magenta', emoji: '🚀' },
];

function getLeague(returnPct: number) {
    return [...LEAGUES].reverse().find(l => returnPct >= l.minScore) ?? LEAGUES[0];
}

interface AdminDashboardViewProps {
    onNavigate: (page: string) => void;
}

type CalculatedUser = UserAccount & {
    portfolioValue: number;
    returnPercentage: number;
    league: typeof LEAGUES[number];
};

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; icon: React.FC<any>; color: string }> = ({ label, value, sub, icon: Icon, color }) => (
    <NeonCard variant="default" className="p-5">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-sm text-gray-400">{label}</p>
                <p className={`text-2xl font-black mt-1 ${color}`}>{value}</p>
                {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
            </div>
            <div className={`p-3 rounded-xl bg-white/5 border border-white/10`}>
                <Icon className={`w-6 h-6 ${color}`} />
            </div>
        </div>
    </NeonCard>
);

const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
    const { currentUser, getAllUserAccounts } = useAuth();
    const [users, setUsers] = useState<CalculatedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof CalculatedUser; direction: 'asc' | 'desc' }>({ key: 'portfolioValue', direction: 'desc' });

    const refreshAllPortfolios = useCallback(async (currentUsers: Omit<CalculatedUser, 'league'>[]) => {
        const allHoldings = currentUsers.flatMap(u => u.portfolio.holdings);
        const uniqueTickers = [...new Set(allHoldings.map(h => h.ticker))];

        if (uniqueTickers.length === 0) {
            setUsers(currentUsers.map(u => ({ ...u, league: getLeague(u.returnPercentage) })));
            return;
        }

        const priceMap = new Map<string, number>();
        const results = await Promise.allSettled(uniqueTickers.map(t => getStockData(t)));
        results.forEach((r, i) => {
            if (r.status === 'fulfilled' && r.value) priceMap.set(uniqueTickers[i], r.value.price);
        });

        const refreshed = currentUsers.map(user => {
            const holdings = user.portfolio.holdings.map(h => ({
                ...h,
                currentValue: priceMap.get(h.ticker) ?? h.purchasePrice,
            }));
            const portfolioValue = user.portfolio.cash + holdings.reduce((a, h) => a + h.shares * (h.currentValue ?? 0), 0);
            const returnPercentage = user.portfolio.initialValue > 0 ? ((portfolioValue - user.portfolio.initialValue) / user.portfolio.initialValue) * 100 : 0;
            return { ...user, portfolio: { ...user.portfolio, holdings }, portfolioValue, returnPercentage, league: getLeague(returnPercentage) };
        });

        setUsers(refreshed);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const allUsers = await getAllUserAccounts();
                const filtered = allUsers.filter(u => u.role !== 'admin').map(user => {
                    const holdingsValue = user.portfolio.holdings.reduce((a, h) => a + h.shares * (h.currentValue ?? h.purchasePrice), 0);
                    const portfolioValue = user.portfolio.cash + holdingsValue;
                    const returnPercentage = user.portfolio.initialValue > 0 ? ((portfolioValue - user.portfolio.initialValue) / user.portfolio.initialValue) * 100 : 0;
                    return { ...user, portfolioValue, returnPercentage };
                });
                await refreshAllPortfolios(filtered);
            } catch {
                setError("Impossible de charger les utilisateurs.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [getAllUserAccounts, refreshAllPortfolios]);

    const kpis = useMemo(() => {
        const totalPortfolioValue = users.reduce((a, u) => a + u.portfolioValue, 0);
        const totalTrades = users.reduce((a, u) => a + u.transactions.length, 0);
        const avgReturn = users.length > 0 ? users.reduce((a, u) => a + u.returnPercentage, 0) / users.length : 0;
        const profitable = users.filter(u => u.returnPercentage > 0).length;
        return { totalPortfolioValue, totalTrades, avgReturn, profitable };
    }, [users]);

    const sortedFiltered = useMemo(() => {
        let list = [...users];
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(u => u.fullName?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q));
        }
        list.sort((a, b) => {
            const av = a[sortConfig.key] as number;
            const bv = b[sortConfig.key] as number;
            if (typeof av === 'number' && typeof bv === 'number') {
                return sortConfig.direction === 'asc' ? av - bv : bv - av;
            }
            return 0;
        });
        return list;
    }, [users, search, sortConfig]);

    const requestSort = (key: keyof CalculatedUser) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
    };

    const SortIcon: React.FC<{ col: string }> = ({ col }) => {
        if (sortConfig.key !== col) return <span className="ml-1 text-gray-600">↕</span>;
        return <span className="ml-1 text-neon-cyan">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
    };

    const exportCSV = () => {
        const headers = ['Nom', 'Email', 'Ligue', 'Valeur Portefeuille ($)', 'Rendement (%)', 'Transactions'];
        const rows = sortedFiltered.map(u => [
            u.fullName, u.email ?? '', u.league.emoji + ' ' + u.league.name,
            u.portfolioValue.toFixed(2), u.returnPercentage.toFixed(2), u.transactions.length,
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `welloh_users_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-8 relative">
            <AnimatedBackground />

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-3">
                        <GlobeAltIcon className="w-8 h-8 text-neon-violet" />
                        Dashboard Administrateur
                    </h1>
                    <p className="text-gray-400 mt-1">Bienvenue, <span className="text-neon-cyan">{currentUser?.fullName}</span></p>
                </div>
                <NeonBadge variant="violet" size="md" glow pulse>Admin</NeonBadge>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Utilisateurs actifs" value={users.length} sub="traders enregistrés" icon={UserIcon} color="text-neon-cyan" />
                <StatCard label="Valeur totale gérée" value={formatCurrency(kpis.totalPortfolioValue)} sub="tous portefeuilles" icon={TrophyIcon} color="text-yellow-400" />
                <StatCard label="Trades effectués" value={kpis.totalTrades} sub="total de la plateforme" icon={ChartBarIcon} color="text-neon-green" />
                <StatCard label="Rendement moyen" value={`${kpis.avgReturn.toFixed(1)}%`} sub={`${kpis.profitable} traders profitables`} icon={RocketLaunchIcon} color={kpis.avgReturn >= 0 ? 'text-neon-green' : 'text-red-400'} />
            </div>

            <NeonCard variant="default" className="p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <SparklesIcon className="w-5 h-5 text-neon-cyan" />
                        Gestion des utilisateurs
                        <NeonBadge variant="cyan" size="sm">{users.length}</NeonBadge>
                    </h2>
                    <div className="flex items-center gap-3">
                        <input
                            type="search"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Rechercher un utilisateur..."
                            className="bg-dark-700/50 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-all"
                        />
                        <button onClick={exportCSV}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-neon-green/10 border border-neon-green/30 text-neon-green text-sm font-medium hover:bg-neon-green/20 transition-all">
                            ↓ CSV
                        </button>
                    </div>
                </div>

                {isLoading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => <div key={i} className="h-14 skeleton rounded-lg" />)}
                    </div>
                ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl">{error}</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead>
                                <tr className="border-b border-white/10">
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Utilisateur</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Ligue</th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('portfolioValue')}>
                                        Portefeuille <SortIcon col="portfolioValue" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider cursor-pointer select-none" onClick={() => requestSort('returnPercentage')}>
                                        Rendement <SortIcon col="returnPercentage" />
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden md:table-cell cursor-pointer select-none" onClick={() => requestSort('transactions' as any)}>
                                        Trades
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider hidden lg:table-cell">Pays</th>
                                    <th className="relative px-4 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {sortedFiltered.map(user => (
                                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-sm font-bold text-dark-900">
                                                    {user.fullName?.[0]?.toUpperCase() ?? 'U'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-semibold text-white">{user.fullName}</p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`text-sm font-semibold ${user.league.color}`}>
                                                {user.league.emoji} {user.league.name}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-white">
                                            {formatCurrency(user.portfolioValue)}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center gap-1 text-sm font-semibold ${user.returnPercentage >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                                                {user.returnPercentage >= 0 ? <ArrowUpIcon className="w-3 h-3" /> : <ArrowDownIcon className="w-3 h-3" />}
                                                {user.returnPercentage.toFixed(2)}%
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden md:table-cell">
                                            <span className="text-sm text-gray-300">{user.transactions.length}</span>
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap hidden lg:table-cell text-sm text-gray-400">
                                            {user.country ?? '—'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-right">
                                            <button
                                                onClick={() => onNavigate(`profile/${user.id}`)}
                                                className="text-xs font-medium text-neon-cyan hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-neon-cyan/10 border border-neon-cyan/30"
                                            >
                                                Voir profil
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {sortedFiltered.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                                            {search ? `Aucun utilisateur trouvé pour "${search}"` : 'Aucun utilisateur enregistré'}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </NeonCard>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <NeonCard variant="violet" className="p-5">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <BoltIcon className="w-5 h-5 text-neon-violet" /> Répartition par ligue
                    </h3>
                    <div className="space-y-2">
                        {LEAGUES.slice().reverse().map(league => {
                            const count = users.filter(u => u.league.name === league.name).length;
                            const pct = users.length > 0 ? (count / users.length) * 100 : 0;
                            return (
                                <div key={league.name} className="flex items-center gap-3">
                                    <span className="text-sm w-20 flex-shrink-0 text-gray-300">{league.emoji} {league.name}</span>
                                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-neon-violet/60 rounded-full transition-all" style={{ width: `${pct}%` }} />
                                    </div>
                                    <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
                                </div>
                            );
                        })}
                    </div>
                </NeonCard>

                <NeonCard variant="green" className="p-5">
                    <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-neon-green" /> Top 5 traders
                    </h3>
                    <div className="space-y-3">
                        {[...users].sort((a, b) => b.returnPercentage - a.returnPercentage).slice(0, 5).map((u, i) => (
                            <div key={u.id} className="flex items-center gap-3">
                                <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-gray-300' : i === 2 ? 'text-orange-400' : 'text-gray-500'}`}>
                                    {i + 1}
                                </span>
                                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-violet flex items-center justify-center text-xs font-bold text-dark-900 flex-shrink-0">
                                    {u.fullName?.[0]?.toUpperCase() ?? 'U'}
                                </div>
                                <span className="flex-1 text-sm text-white truncate">{u.fullName}</span>
                                <span className={`text-sm font-bold ${u.returnPercentage >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                                    {u.returnPercentage >= 0 ? '+' : ''}{u.returnPercentage.toFixed(1)}%
                                </span>
                            </div>
                        ))}
                        {users.length === 0 && <p className="text-sm text-gray-500 text-center py-4">Aucune donnée</p>}
                    </div>
                </NeonCard>
            </div>
        </div>
    );
};

export default AdminDashboardView;
