import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserAccount, StockHolding } from '../types';
import { WalletIcon, BriefcaseIcon, ExclamationTriangleIcon } from './icons/Icons';
import { TransactionHistory } from './DashboardView';

interface ProfileViewProps {
    userId: string;
    onNavigate: (page: string) => void;
}

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'USD' }).format(value);
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
                        const totalValue = h.shares * h.currentValue;
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

const ProfileView: React.FC<ProfileViewProps> = ({ userId, onNavigate }) => {
    const { currentUser, getUserAccountById } = useAuth();
    const [viewedUser, setViewedUser] = useState<UserAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchUser = async () => {
            setIsLoading(true);
            try {
                const user = await getUserAccountById(userId);
                setViewedUser(user || null); // Set to null if user is not found (undefined)
            } catch (e) {
                console.error("Failed to fetch user profile:", e);
                setViewedUser(null);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUser();
    }, [userId, getUserAccountById]);

    if (isLoading) {
        return <div className="text-center py-8">Chargement du profil...</div>;
    }

    if (!viewedUser) {
        return <div className="text-center text-red-500 py-8">Utilisateur non trouvé.</div>;
    }

    // Security check
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.id !== userId)) {
        return (
            <div className="text-center bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <ExclamationTriangleIcon className="h-12 w-12 mx-auto text-red-500"/>
                <strong className="font-bold block mt-2">Accès refusé !</strong>
                <span className="block sm:inline">Vous n'avez pas la permission de voir cette page.</span>
            </div>
        );
    }
    
    const { portfolio } = viewedUser;
    const portfolioTotalValue = portfolio.cash + portfolio.holdings.reduce((acc, h) => acc + (h.shares * h.currentValue), 0);
    const portfolioGainLoss = portfolioTotalValue - portfolio.initialValue;
    const portfolioGainLossPercent = portfolio.initialValue > 0 ? (portfolioGainLoss / portfolio.initialValue) * 100 : 0;

    return (
        <div className="space-y-8">
            {/* User Info Header */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{viewedUser.fullName}</h1>
                <p className="text-md text-gray-500 dark:text-gray-400">{viewedUser.email}</p>
                 {currentUser?.id === viewedUser.id && (
                     <p className="mt-2 text-sm text-indigo-600 dark:text-indigo-400">Ceci est votre profil public.</p>
                 )}
            </div>

            {/* Portfolio Overview */}
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

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                 {/* Holdings */}
                 <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 space-y-4">
                     <h3 className="text-xl font-bold text-indigo-600 dark:text-indigo-400 flex items-center"><BriefcaseIcon /><span className="ml-2">Actifs Détenus</span></h3>
                     <HoldingsTable holdings={portfolio.holdings} />
                 </div>

                {/* Transactions */}
                <TransactionHistory transactions={viewedUser.transactions} />
            </div>
        </div>
    );
};

export default ProfileView;