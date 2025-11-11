
import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserAccount, StockHolding, Portfolio } from '../types';
import { getStockData } from '../services/geminiService';
import { WalletIcon, BriefcaseIcon, ExclamationTriangleIcon } from './icons/Icons';
import { TransactionHistory } from './DashboardView';

interface ProfileViewProps {
    userId: string;
    onNavigate: (page: string) => void;
}

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

const HoldingsTable: React.FC<{ holdings: StockHolding[] }> = ({ holdings }) => {
    if (holdings.length === 0) {
        return <p className="text-sm text-gray-500 dark:text-gray-400 italic">Cet utilisateur ne détient aucune action pour le moment.</p>;
    }

    return (
         <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Ticker</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Prix d'Achat Moyen</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Valeur Actuelle</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Gain/Perte</th>
                    </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {holdings.map(h => {
                        const totalValue = h.shares * (h.currentValue || h.purchasePrice);
                        const totalCost = h.shares * h.purchasePrice;
                        const gainLoss = totalValue - totalCost;
                        const gainLossPercent = totalCost > 0 ? (gainLoss / totalCost) * 100 : 0;
                        return (
                            <tr key={h.ticker}>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{h.ticker}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{h.shares}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">{formatCurrency(h.purchasePrice)}</td>
                                <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-800 dark:text-gray-200">{formatCurrency(totalValue)}</td>
                                <td className={`px-4 py-3 whitespace-nowrap text-sm font-semibold ${gainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                    {formatCurrency(gainLoss)} ({gainLossPercent.toFixed(2)}%)
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
        </div>
    );
};

const PortfolioSkeleton: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-6 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
    </div>
);

const HoldingsSkeleton: React.FC = () => (
     <div className="animate-pulse space-y-2 pt-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-10 bg-gray-200 dark:bg-gray-700 rounded w-full"></div>)}
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
        return <div className="text-center py-8">Chargement du profil...</div>;
    }

    if (!viewedUser) {
        return <div className="text-center text-red-500 py-8">Utilisateur non trouvé.</div>;
    }

    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== userId)) {
        return (
            <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500"/>
                <strong className="font-bold block mt-2">Accès refusé !</strong>
                <span className="block sm:inline">Vous n'avez pas la permission de voir cette page.</span>
            </div>
        );
    }
    
    const portfolio = refreshedPortfolio || viewedUser.portfolio;
    const portfolioTotalValue = portfolio.cash + portfolio.holdings.reduce((acc, h) => acc + (h.shares * (h.currentValue || h.purchasePrice)), 0);
    const portfolioGainLoss = portfolioTotalValue - portfolio.initialValue;
    const portfolioGainLossPercent = portfolio.initialValue > 0 ? (portfolioGainLoss / portfolio.initialValue) * 100 : 0;
    const userLevel = getLevel(portfolioTotalValue);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center space-x-4">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{viewedUser.fullName}</h1>
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${userLevel.bg} ${userLevel.color}`}>{userLevel.name}</span>
                </div>
                {viewedUser.email && <p className="text-md text-gray-500 dark:text-gray-400">{viewedUser.email}</p>}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">Pays:</span> {viewedUser.country || 'Non spécifié'}</p>
                    <p className="text-gray-600 dark:text-gray-300"><span className="font-semibold text-gray-500 dark:text-gray-400">Institution:</span> {viewedUser.institution || 'Non spécifié'}</p>
                </div>
                 {currentUser?.id === viewedUser.id && (
                     <p className="mt-4 text-sm text-indigo-600 dark:text-indigo-400">Ceci est votre profil public.</p>
                 )}
            </div>

            {isRefreshing ? <PortfolioSkeleton /> : (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center mb-4"><WalletIcon /><span className="ml-2">Résumé du Portefeuille</span></h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Valeur Totale</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(portfolioTotalValue)}</div>
                        </div>
                         <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Gain/Perte Total</div>
                            <div className={`text-2xl font-bold ${portfolioGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {formatCurrency(portfolioGainLoss)}
                            </div>
                        </div>
                         <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Rendement Total</div>
                             <div className={`text-2xl font-bold ${portfolioGainLossPercent >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                {portfolioGainLossPercent.toFixed(2)}%
                            </div>
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">Liquidités</div>
                            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatCurrency(portfolio.cash)}</div>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
                     <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center"><BriefcaseIcon /><span className="ml-2">Actifs Détenus</span></h3>
                     {isRefreshing ? <HoldingsSkeleton /> : <HoldingsTable holdings={portfolio.holdings} />}
                 </div>
                <TransactionHistory transactions={viewedUser.transactions} />
            </div>
        </div>
    );
};

export default ProfileView;
