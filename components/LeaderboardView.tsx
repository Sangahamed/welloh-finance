
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStockData } from '../services/geminiService';
import type { UserAccount } from '../types';
import { TrophyIcon } from './icons/Icons';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const levels = [
    { name: 'Novice', threshold: 0, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-gray-200 dark:bg-gray-700' },
    { name: 'Apprenti', threshold: 110000, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' },
    { name: 'Trader', threshold: 150000, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    { name: 'Investisseur', threshold: 250000, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { name: 'Maestro', threshold: 500000, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/50' },
];

const getLevel = (value: number) => {
    return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

interface LeaderboardViewProps {
    onNavigate: (page: string) => void;
}

type RankedUser = UserAccount & {
    portfolioValue: number;
    returnPercentage: number;
    level: { name: string; color: string; bg: string };
    rank: number;
};

const RankMedal: React.FC<{ rank: number }> = ({ rank }) => {
    if (rank > 3) return null;
    const colors = {
        1: 'text-yellow-400',
        2: 'text-gray-400',
        3: 'text-yellow-600'
    };
    return <TrophyIcon className={`h-6 w-6 ${colors[rank]}`} />;
};

const LeaderboardView: React.FC<LeaderboardViewProps> = ({ onNavigate }) => {
    const { currentUser, getAllUserAccounts } = useAuth();
    const [users, setUsers] = useState<RankedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndRankUsers = async () => {
            try {
                setIsLoading(true);
                const allUsers = await getAllUserAccounts();
                const usersWithCalculations = allUsers
                    .filter(user => user.role !== 'admin')
                    .map(user => {
                        const holdingsValue = user.portfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0);
                        const portfolioValue = user.portfolio.cash + holdingsValue;
                        return { ...user, portfolioValue };
                    });

                // Fetch fresh prices
                const allHoldings = usersWithCalculations.flatMap(u => u.portfolio.holdings);
                const uniqueTickers = [...new Set(allHoldings.map(h => h.ticker))];
                const priceMap = new Map<string, number>();

                if (uniqueTickers.length > 0) {
                    const pricePromises = uniqueTickers.map(ticker => getStockData(ticker));
                    const priceResults = await Promise.allSettled(pricePromises);
                    priceResults.forEach((result, index) => {
                        if (result.status === 'fulfilled' && result.value) {
                            priceMap.set(uniqueTickers[index], result.value.price);
                        }
                    });
                }
                
                // Final calculation and ranking
                const rankedUsers = usersWithCalculations.map(user => {
                    const holdingsValue = user.portfolio.holdings.reduce((acc, h) => acc + (h.shares * (priceMap.get(h.ticker) ?? h.purchasePrice)), 0);
                    const portfolioValue = user.portfolio.cash + holdingsValue;
                    const totalReturn = portfolioValue - user.portfolio.initialValue;
                    const returnPercentage = user.portfolio.initialValue > 0 ? (totalReturn / user.portfolio.initialValue) * 100 : 0;
                    return {
                        ...user,
                        portfolioValue,
                        returnPercentage,
                        level: getLevel(portfolioValue),
                    };
                })
                .sort((a, b) => b.portfolioValue - a.portfolioValue)
                .map((user, index) => ({ ...user, rank: index + 1 }));

                setUsers(rankedUsers);

            } catch (err) {
                setError("Impossible de charger le classement.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchAndRankUsers();
    }, [getAllUserAccounts]);

    return (
        <div className="space-y-8">
            <div className="text-center">
                <TrophyIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                    Classement Général
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                    Mesurez-vous aux autres traders et visez le sommet.
                </p>
            </div>

            {isLoading ? (
                <div className="text-center py-8">Chargement du classement...</div>
            ) : error ? (
                <div className="text-center py-8 text-red-500">{error}</div>
            ) : (
                <div className="space-y-3 max-w-4xl mx-auto">
                    {users.map((user, index) => (
                        <div
                            key={user.id}
                            className={`
                                flex items-center p-4 rounded-lg shadow-md transition-all duration-300
                                ${currentUser?.id === user.id ? 'bg-indigo-900/30 border-2 border-indigo-500' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}
                            `}
                        >
                            <div className="flex items-center justify-center w-12 text-2xl font-bold text-gray-500 dark:text-gray-400">
                                {user.rank <= 3 ? <RankMedal rank={user.rank} /> : user.rank}
                            </div>
                            <div className="flex-1 ml-4">
                                <a 
                                    href={`#profile/${user.id}`} 
                                    onClick={(e) => { e.preventDefault(); onNavigate(`profile/${user.id}`);}}
                                    className="font-bold text-gray-900 dark:text-gray-100 hover:underline"
                                >
                                    {user.fullName}
                                </a>
                                <div className="text-sm">
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${user.level.bg} ${user.level.color}`}>
                                        {user.level.name}
                                    </span>
                                </div>
                            </div>
                            <div className="hidden sm:block text-right ml-4">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(user.portfolioValue)}</p>
                                <p className={`text-sm font-semibold ${user.returnPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {user.returnPercentage.toFixed(2)}%
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default LeaderboardView;
