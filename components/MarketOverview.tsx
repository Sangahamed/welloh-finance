import React from 'react';
import type { MarketIndex } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ChartTrendingUpIcon } from './icons/Icons';

interface MarketOverviewProps {
  indices: MarketIndex[] | null;
  isLoading: boolean;
  error: string | null;
}

const IndexCard: React.FC<{ index: MarketIndex }> = ({ index }) => {
    const { name, value, change, percentChange, changeType } = index;

    const changeColorClass = {
        positive: 'text-green-600 dark:text-green-400',
        negative: 'text-red-600 dark:text-red-400',
        neutral: 'text-gray-500 dark:text-gray-400',
    }[changeType || 'neutral'];

    const renderChangeIcon = () => {
        if (changeType === 'positive') return <ArrowUpIcon className="h-4 w-4" />;
        if (changeType === 'negative') return <ArrowDownIcon className="h-4 w-4" />;
        return null;
    };

    return (
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate">{name}</h4>
            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</p>
            <div className={`flex items-center text-sm mt-2 font-semibold ${changeColorClass}`}>
                {renderChangeIcon()}
                <span className="ml-1">{change} ({percentChange})</span>
            </div>
        </div>
    );
};

const SkeletonCard: React.FC = () => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
        <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded w-1/2 mb-3"></div>
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
    </div>
);


const MarketOverview: React.FC<MarketOverviewProps> = ({ indices, isLoading, error }) => {
    return (
        <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                <ChartTrendingUpIcon className="h-7 w-7 mr-2 text-indigo-600 dark:text-indigo-400" />
                Aperçu du Marché
            </h2>
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
                    <p>{error}</p>
                </div>
            )}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {isLoading ? (
                    [...Array(5)].map((_, i) => <SkeletonCard key={i} />)
                ) : (
                    indices && indices.map(index => <IndexCard key={index.name} index={index} />)
                )}
            </div>
        </div>
    );
};

export default MarketOverview;
