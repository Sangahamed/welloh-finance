import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserAccount, StockHolding, Portfolio } from '../types';
import { getStockData } from '../services/geminiService';
import { WalletIcon, BriefcaseIcon, ExclamationTriangleIcon, TrophyIcon, StarIcon, ChartBarIcon, SparklesIcon, FireIcon, ClockIcon } from './icons/Icons';
import AnimatedBackground from './ui/AnimatedBackground';
import NeonCard from './ui/NeonCard';
import NeonBadge from './ui/NeonBadge';
import CountUp from './ui/CountUp';

interface ProfileViewProps {
    userId: string;
    onNavigate: (page: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const levels = [
    { name: 'Novice', threshold: 0, color: 'cyan' as const, icon: StarIcon, nextThreshold: 110000 },
    { name: 'Apprenti', threshold: 110000, color: 'green' as const, icon: ChartBarIcon, nextThreshold: 150000 },
    { name: 'Trader', threshold: 150000, color: 'violet' as const, icon: SparklesIcon, nextThreshold: 250000 },
    { name: 'Investisseur', threshold: 250000, color: 'magenta' as const, icon: FireIcon, nextThreshold: 500000 },
    { name: 'Maestro', threshold: 500000, color: 'orange' as const, icon: TrophyIcon, nextThreshold: Infinity },
];

const getLevel = (value: number) => {
    return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

const getLevelProgress = (value: number, level: typeof levels[0]) => {
    if (level.nextThreshold === Infinity) return 100;
    const progress = ((value - level.threshold) / (level.nextThreshold - level.threshold)) * 100;
    return Math.min(Math.max(progress, 0), 100);
};

// Holdings Table with Neon Style
const HoldingsTable: React.FC<{ holdings: StockHolding[] }> = ({ holdings }) => {
    if (holdings.length === 0) {
        return (
            <div className="text-center py-8">
                <BriefcaseIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Aucune action detenue pour le moment.</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-white/10">
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Ticker</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Prix Achat</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">Valeur</th>
                        <th className="px-4 py-3 text-left text-xs font-display font-semibold text-gray-400 uppercase tracking-wider">P/L</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                    {holdings.map((h, index) => {
                        const totalValue = h.shares * (h.currentValue || h.purchasePrice);
                        const totalCost = h.shares * h.purchasePrice;
                        const gainLoss = totalValue - totalCost;
                        const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
                        const isPositive = gainLoss >= 0;
                        
                        return (
                            <tr 
                                key={h.ticker} 
                                className="group hover:bg-white/5 transition-colors animate-slide-up"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-neon-cyan/20 to-neon-violet/20 flex items-center justify-center border border-white/10">
                                            <span className="font-display font-bold text-neon-cyan text-sm">{h.ticker.slice(0, 2)}</span>
                                        </div>
                                        <span className="font-display font-bold text-white">{h.ticker}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-300">{h.shares}</td>
                                <td className="px-4 py-4 whitespace-nowrap text-gray-300">{formatCurrency(h.purchasePrice)}</td>
                                <td className="px-4 py-4 whitespace-nowrap font-semibold text-white">{formatCurrency(totalValue)}</td>
                                <td className="px-4 py-4 whitespace-nowrap">
                                    <div className={`flex items-center gap-2 ${isPositive ? 'text-neon-green' : 'text-red-400'}`}>
                                        <span className="font-semibold">{isPositive ? '+' : ''}{formatCurrency(gainLoss)}</span>
                                        <NeonBadge color={isPositive ? 'green' : 'magenta'} size="sm">
                                            {isPositive ? '+' : ''}{gainLossPercent.toFixed(1)}%
                                        </NeonBadge>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

// Transaction History with Neon Style
const TransactionHistory: React.FC<{ transactions: UserAccount['transactions'] }> = ({ transactions }) => {
    if (!transactions || transactions.length === 0) {
        return (
            <div className="text-center py-8">
                <ClockIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">Aucune transaction pour le moment.</p>
            </div>
        );
    }

    const sortedTransactions = [...transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 10);

    return (
        <div className="space-y-3">
            {sortedTransactions.map((tx, index) => (
                <div 
                    key={tx.id || index}
                    className="flex items-center justify-between p-4 rounded-xl bg-dark-700/50 border border-white/5 hover:border-neon-cyan/30 transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                >
                    <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            tx.type === 'BUY' 
                                ? 'bg-neon-green/20 border border-neon-green/30' 
                                : 'bg-red-500/20 border border-red-500/30'
                        }`}>
                            {tx.type === 'BUY' ? (
                                <svg className="w-5 h-5 text-neon-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
                                </svg>
                            )}
                        </div>
                        <div>
                            <p className="font-display font-semibold text-white">
                                {tx.type === 'BUY' ? 'Achat' : 'Vente'} {tx.ticker}
                            </p>
                            <p className="text-sm text-gray-500">
                                {tx.shares} actions @ {formatCurrency(tx.price)}
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className={`font-display font-bold ${tx.type === 'BUY' ? 'text-red-400' : 'text-neon-green'}`}>
                            {tx.type === 'BUY' ? '-' : '+'}{formatCurrency(tx.shares * tx.price)}
                        </p>
                        <p className="text-xs text-gray-500">
                            {new Date(tx.date).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
};

// Skeleton Loaders
const PortfolioSkeleton: React.FC = () => (
    <NeonCard color="cyan" className="animate-pulse">
        <div className="h-6 w-1/3 bg-dark-600 rounded mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="h-20 bg-dark-600 rounded-lg" />
            ))}
        </div>
    </NeonCard>
);

const HoldingsSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-3 pt-4">
        {[...Array(3)].map((_, i) => (
            <div key={i} className="h-14 bg-dark-600 rounded-lg w-full" />
        ))}
    </div>
);

const ProfileView: React.FC<ProfileViewProps> = ({ userId, onNavigate }) => {
    const { currentUser, getUserAccountById } = useAuth();
    const [viewedUser, setViewedUser] = useState<UserAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshedPortfolio, setRefreshedPortfolio] = useState<Portfolio | null>(null);
    const [isRefreshing, setIsRefreshing] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const user = await getUserAccountById(userId);
                setViewedUser(user || null);
            } catch (e) {
                console.error("Failed to fetch user profile:", e);
                setViewedUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [userId, getUserAccountById]);

    useEffect(() => {
        if (!viewedUser) return;

        const refreshPortfolio = async () => {
            setIsRefreshing(true);
            const { holdings, ...restOfPortfolio } = viewedUser.portfolio;

            if (holdings.length === 0) {
                setRefreshedPortfolio(viewedUser.portfolio);
                setIsRefreshing(false);
                return;
            }

            try {
                const freshDataPromises = holdings.map(h => getStockData(h.ticker));
                const freshDataResults = await Promise.allSettled(freshDataPromises);

                const updatedHoldings = holdings.map((holding, index) => {
                    const result = freshDataResults[index];
                    if (result.status === 'fulfilled' && result.value) {
                        return { ...holding, currentValue: result.value.price };
                    }
                    return { ...holding, currentValue: holding.purchasePrice };
                });

                setRefreshedPortfolio({ ...restOfPortfolio, holdings: updatedHoldings });
            } catch (e) {
                console.error("Failed to refresh profile portfolio data:", e);
                setRefreshedPortfolio(viewedUser.portfolio);
            } finally {
                setIsRefreshing(false);
            }
        };

        refreshPortfolio();
    }, [viewedUser]);

    if (isLoading) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <AnimatedBackground variant="particles" intensity="low" />
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 border-4 border-neon-cyan/30 border-t-neon-cyan rounded-full animate-spin mb-4" />
                    <p className="text-gray-400">Chargement du profil...</p>
                </div>
            </div>
        );
    }

    if (!viewedUser) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <AnimatedBackground variant="particles" intensity="low" />
                <NeonCard color="magenta" className="text-center max-w-md">
                    <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Utilisateur non trouve</h2>
                    <p className="text-gray-400">Ce profil n'existe pas ou a ete supprime.</p>
                </NeonCard>
            </div>
        );
    }

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== userId)) {
        return (
            <div className="relative min-h-screen flex items-center justify-center">
                <AnimatedBackground variant="particles" intensity="low" />
                <NeonCard color="magenta" className="text-center max-w-md">
                    <ExclamationTriangleIcon className="w-16 h-16 text-red-400 mx-auto mb-4" />
                    <h2 className="text-2xl font-display font-bold text-white mb-2">Acces refuse</h2>
                    <p className="text-gray-400">Vous n'avez pas la permission de voir cette page.</p>
                </NeonCard>
            </div>
        );
    }

    const portfolio = refreshedPortfolio || viewedUser.portfolio;
    const portfolioTotalValue = portfolio.cash + portfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0);
    const portfolioGainLoss = portfolioTotalValue - portfolio.initialValue;
    const portfolioGainLossPercent = portfolio.initialValue > 0 ? (portfolioGainLoss / portfolio.initialValue) * 100 : 0;
    const userLevel = getLevel(portfolioTotalValue);
    const levelProgress = getLevelProgress(portfolioTotalValue, userLevel);
    const LevelIcon = userLevel.icon;
    const isOwnProfile = currentUser?.id === viewedUser.id;

    return (
        <div className="relative min-h-screen">
            <AnimatedBackground variant="grid" intensity="low" />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8 space-y-8">
                {/* Profile Header */}
                <NeonCard color={userLevel.color} className="overflow-visible">
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                        {/* Avatar */}
                        <div className="relative">
                            <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br from-neon-${userLevel.color} to-neon-violet p-0.5 relative`}>
                                <div className="w-full h-full rounded-2xl bg-dark-800 flex items-center justify-center">
                                    <span className="text-4xl font-display font-bold text-white">
                                        {viewedUser.fullName.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                {/* Glow effect */}
                                <div 
                                    className="absolute inset-0 rounded-2xl opacity-50 blur-xl -z-10"
                                    style={{ background: `linear-gradient(135deg, var(--neon-${userLevel.color}), var(--neon-violet))` }}
                                />
                            </div>

                            {/* Level Badge */}
                            <div className="absolute -bottom-2 -right-2">
                                <NeonBadge color={userLevel.color} glow>
                                    <LevelIcon className="w-4 h-4 mr-1" />
                                    {userLevel.name}
                                </NeonBadge>
                            </div>
                        </div>

                        {/* User Info */}
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h1 className="text-3xl font-display font-bold text-white">{viewedUser.fullName}</h1>
                                {isOwnProfile && (
                                    <span className="px-2 py-1 text-xs bg-neon-cyan/20 text-neon-cyan rounded-full border border-neon-cyan/30">
                                        Vous
                                    </span>
                                )}
                            </div>

                            {viewedUser.email && (
                                <p className="text-gray-400 mb-4">{viewedUser.email}</p>
                            )}

                            <div className="flex flex-wrap gap-4 text-sm">
                                {viewedUser.country && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                        <span>{viewedUser.country}</span>
                                    </div>
                                )}
                                {viewedUser.institution && (
                                    <div className="flex items-center gap-2 text-gray-400">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                        <span>{viewedUser.institution}</span>
                                    </div>
                                )}
                            </div>

                            {/* Level Progress */}
                            {userLevel.nextThreshold !== Infinity && (
                                <div className="mt-4">
                                    <div className="flex justify-between text-sm mb-2">
                                        <span className="text-gray-500">Progression niveau</span>
                                        <span className="text-gray-400">
                                            {formatCurrency(portfolioTotalValue)} / {formatCurrency(userLevel.nextThreshold)}
                                        </span>
                                    </div>
                                    <div className="h-2 bg-dark-600 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ 
                                                width: `${levelProgress}%`,
                                                background: `linear-gradient(90deg, var(--neon-${userLevel.color}), var(--neon-violet))`
                                            }}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </NeonCard>

                {/* Portfolio Summary */}
                {isRefreshing ? <PortfolioSkeleton /> : (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <NeonCard color="cyan" className="text-center">
                            <WalletIcon className="w-8 h-8 text-neon-cyan mx-auto mb-2" />
                            <p className="text-sm text-gray-500 mb-1">Valeur Totale</p>
                            <p className="text-2xl font-display font-bold text-white">
                                <CountUp end={portfolioTotalValue} prefix="$" decimals={0} duration={1500} />
                            </p>
                        </NeonCard>

                        <NeonCard color={portfolioGainLoss >= 0 ? 'green' : 'magenta'} className="text-center">
                            {portfolioGainLoss >= 0 ? (
                                <svg className="w-8 h-8 text-neon-green mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8 text-red-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
                                </svg>
                            )}
                            <p className="text-sm text-gray-500 mb-1">Gain/Perte</p>
                            <p className={`text-2xl font-display font-bold ${portfolioGainLoss >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                                <CountUp end={portfolioGainLoss} prefix={portfolioGainLoss >= 0 ? '+$' : '-$'} decimals={0} duration={1500} />
                            </p>
                        </NeonCard>

                        <NeonCard color={portfolioGainLossPercent >= 0 ? 'green' : 'magenta'} className="text-center">
                            <ChartBarIcon className={`w-8 h-8 mx-auto mb-2 ${portfolioGainLossPercent >= 0 ? 'text-neon-green' : 'text-red-400'}`} />
                            <p className="text-sm text-gray-500 mb-1">Rendement</p>
                            <p className={`text-2xl font-display font-bold ${portfolioGainLossPercent >= 0 ? 'text-neon-green' : 'text-red-400'}`}>
                                {portfolioGainLossPercent >= 0 ? '+' : ''}{portfolioGainLossPercent.toFixed(2)}%
                            </p>
                        </NeonCard>

                        <NeonCard color="violet" className="text-center">
                            <svg className="w-8 h-8 text-neon-violet mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <p className="text-sm text-gray-500 mb-1">Liquidites</p>
                            <p className="text-2xl font-display font-bold text-white">
                                <CountUp end={portfolio.cash} prefix="$" decimals={0} duration={1500} />
                            </p>
                        </NeonCard>
                    </div>
                )}

                {/* Holdings and Transactions */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <NeonCard color="cyan">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-neon-cyan/20 flex items-center justify-center">
                                <BriefcaseIcon className="w-5 h-5 text-neon-cyan" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white">Actifs Detenus</h3>
                        </div>
                        {isRefreshing ? <HoldingsSkeleton /> : <HoldingsTable holdings={portfolio.holdings} />}
                    </NeonCard>

                    <NeonCard color="violet">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-lg bg-neon-violet/20 flex items-center justify-center">
                                <ClockIcon className="w-5 h-5 text-neon-violet" />
                            </div>
                            <h3 className="text-xl font-display font-bold text-white">Transactions Recentes</h3>
                        </div>
                        <TransactionHistory transactions={viewedUser.transactions} />
                    </NeonCard>
                </div>
            </div>
        </div>
    );
};

export default ProfileView;
