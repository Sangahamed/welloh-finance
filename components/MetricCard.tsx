import React from 'react';
import type { Metric } from '../types';
import { ArrowUpIcon, ArrowDownIcon, ArrowRightIcon } from './icons/Icons';

interface MetricCardProps {
  metric: Metric;
}

const MetricCard: React.FC<MetricCardProps> = ({ metric }) => {
  const { label, value, change, changeType, tooltip } = metric;

  const renderChangeIcon = () => {
    if (changeType === 'positive') return <ArrowUpIcon />;
    if (changeType === 'negative') return <ArrowDownIcon />;
    if (changeType === 'neutral') return <ArrowRightIcon />;
    return null;
  };

  const changeColorClass = {
    positive: 'text-green-600 dark:text-green-400',
    negative: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-500 dark:text-gray-400',
  }[changeType || 'neutral'];

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md border border-gray-200 dark:border-gray-700 flex flex-col justify-between group relative" title={tooltip}>
      <div className="text-sm text-gray-500 dark:text-gray-400">{label}</div>
      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">{value}</div>
      {change && (
        <div className={`flex items-center text-sm mt-2 ${changeColorClass}`}>
          {renderChangeIcon()}
          <span className="ml-1">{change}</span>
        </div>
      )}
    </div>
  );
};

export default MetricCard;