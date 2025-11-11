
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getStockData } from '../services/geminiService';
import { GlobeAltIcon, ArrowUpIcon, ArrowDownIcon } from './icons/Icons';
import type { UserAccount } from '../types';

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
};

const levels = [
    { name: 'Novice', threshold: 0, color: 'text-gray-400', bg: 'bg-gray-100 dark:bg-gray-700' },
    { name: 'Apprenti', threshold: 110000, color: 'text-green-500 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/50' },
    { name: 'Trader', threshold: 150000, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/50' },
    { name: 'Investisseur', threshold: 250000, color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-900/50' },
    { name: 'Maestro', threshold: 500000, color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-900/50' },
];

const getLevel = (value: number) => {
    return [...levels].reverse().find(level => value >= level.threshold) || levels[0];
};

interface AdminDashboardViewProps {
    onNavigate: (page: string) => void;
}

type CalculatedUser = UserAccount & {
    portfolioValue: number;
    returnPercentage: number;
    level: { name: string; color: string; bg: string };
};


const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({ onNavigate }) => {
    const { currentUser, getAllUserAccounts } = useAuth();
    const [users, setUsers] = useState<CalculatedUser[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [sortConfig, setSortConfig] = useState<{ key: keyof CalculatedUser; direction: 'ascending' | 'descending' } | null>({ key: 'portfolioValue', direction: 'descending' });

    const refreshAllPortfolios = useCallback(async (currentUsers: Omit<CalculatedUser, 'level'>[]) => {
        const allHoldings = currentUsers.flatMap(u => u.portfolio.holdings);
        const uniqueTickers = [...new Set(allHoldings.map(h => h.ticker))];

        if (uniqueTickers.length === 0) { // No holdings to refresh, just calculate levels
            const usersWithLevels = currentUsers.map(user => ({ ...user, level: getLevel(user.portfolioValue) }));
            setUsers(usersWithLevels);
            return;
        }

        const pricePromises = uniqueTickers.map(ticker => getStockData(ticker));
        const priceResults = await Promise.allSettled(pricePromises);
        
        const priceMap = new Map<string, number>();
        priceResults.forEach((result, index) => {
            if (result.status === 'fulfilled' && result.value) {
                priceMap.set(uniqueTickers[index], result.value.price);
            }
        });

        const refreshedUsers = currentUsers.map(user => {
            const refreshedHoldings = user.portfolio.holdings.map(h => ({
                ...h,
                currentValue: priceMap.get(h.ticker) ?? h.purchasePrice,
            }));

            const holdingsValue = refreshedHoldings.reduce((acc, h) => acc + (h.shares * (h.currentValue ?? 0)), 0);
            const portfolioValue = user.portfolio.cash + holdingsValue;
            const totalReturn = portfolioValue - user.portfolio.initialValue;
            const returnPercentage = user.portfolio.initialValue > 0 ? (totalReturn / user.portfolio.initialValue) * 100 : 0;
            
            return {
                ...user,
                portfolio: { ...user.portfolio, holdings: refreshedHoldings },
                portfolioValue,
                returnPercentage,
                level: getLevel(portfolioValue),
            };
        });

        setUsers(refreshedUsers);
    }, []);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setIsLoading(true);
                const allUsers = await getAllUserAccounts();
                const usersToDisplay = allUsers
                    .filter(user => user.role !== 'admin')
                    .map(user => {
                        const holdingsValue = user.portfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0);
                        const portfolioValue = user.portfolio.cash + holdingsValue;
                        const totalReturn = portfolioValue - user.portfolio.initialValue;
                        const returnPercentage = user.portfolio.initialValue > 0 ? (totalReturn / user.portfolio.initialValue) * 100 : 0;
                        return {
                            ...user,
                            portfolioValue,
                            returnPercentage,
                        };
                    });
                
                await refreshAllPortfolios(usersToDisplay);
            } catch (err) {
                setError("Impossible de charger la liste des utilisateurs.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchUsers();
    }, [getAllUserAccounts, refreshAllPortfolios]);
    
    const sortedUsers = useMemo(() => {
        let sortableUsers = [...users];
        if (sortConfig !== null) {
            sortableUsers.sort((a, b) => {
                const aValue = a[sortConfig.key];
                const bValue = b[sortConfig.key];

                if (typeof aValue === 'number' && typeof bValue === 'number') {
                     if (aValue < bValue) return sortConfig.direction === 'ascending' ? -1 : 1;
                     if (aValue > bValue) return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableUsers;
    }, [users, sortConfig]);

    const requestSort = (key: keyof CalculatedUser) => {
        let direction: 'ascending' | 'descending' = 'ascending';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const getSortIcon = (key: string) => {
        if (!sortConfig || sortConfig.key !== key) return null;
        if (sortConfig.direction === 'ascending') return <ArrowUpIcon className="inline ml-1 h-4 w-4" />;
        return <ArrowDownIcon className="inline ml-1 h-4 w-4" />;
    };

    return (
        <div className="space-y-8">
            <div className="text-center">
                <GlobeAltIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
                    Tableau de Bord Administrateur
                </h2>
                <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
                    Bienvenue, {currentUser?.fullName}. Suivez l'activité des utilisateurs et identifiez les talents émergents.
                </p>
            </div>

            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Liste des Utilisateurs ({users.length})</h3>
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="text-center py-8">Chargement des utilisateurs...</div>
                    ) : error ? (
                        <div className="text-center py-8 text-red-500">{error}</div>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Nom</th>
                                     <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Niveau</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('portfolioValue')}>
                                        Valeur Portefeuille {getSortIcon('portfolioValue')}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer" onClick={() => requestSort('returnPercentage')}>
                                        Rendement {getSortIcon('returnPercentage')}
                                    </th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Transactions</th>
                                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                {sortedUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{user.fullName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.level.bg} ${user.level.color}`}>
                                                {user.level.name}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300 font-semibold">{formatCurrency(user.portfolioValue)}</td>
                                        <td className={`px-6 py-4 whitespace-nowrap text-sm font-semibold ${user.returnPercentage >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                            {user.returnPercentage.toFixed(2)}%
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{user.transactions.length}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <a href={`#profile/${user.id}`} onClick={(e) => { e.preventDefault(); onNavigate(`profile/${user.id}`);}} className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-200">
                                                Voir Profil
                                            </a>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardView;
