import React from 'react';
import type { AnalysisData } from '../types';
import MetricCard from './MetricCard';
import ProjectionChart from './ProjectionChart';

interface AnalysisResultProps {
  data: AnalysisData;
}

const AnalysisResult: React.FC<AnalysisResultProps> = ({ data }) => {
  const { 
    companyName, 
    ticker, 
    summary, 
    keyMetrics, 
    projections, 
    strengths, 
    weaknesses, 
    recommendation, 
    confidenceScore 
  } = data;

  const recommendationColor = {
    'Acheter': 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/50 dark:text-green-300 dark:border-green-800',
    'Conserver': 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-300 dark:border-yellow-800',
    'Vendre': 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/50 dark:text-red-300 dark:border-red-800',
  }[recommendation];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">{companyName} <span className="text-lg font-normal text-gray-500 dark:text-gray-400">({ticker})</span></h2>
                <p className="mt-2 text-gray-600 dark:text-gray-300 max-w-3xl">{summary}</p>
            </div>
            <div className={`text-center p-4 rounded-lg border ${recommendationColor} min-w-[150px]`}>
                <div className="text-sm font-bold uppercase tracking-wider">Recommandation</div>
                <div className="text-2xl font-extrabold mt-1">{recommendation}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Confiance: {confidenceScore}%</div>
            </div>
        </div>
      </div>
      
      {/* Key Metrics */}
      <div>
        <h3 className="text-xl font-bold mb-4 text-indigo-600 dark:text-indigo-400">Indicateurs Clés</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {keyMetrics.map((metric) => (
            <MetricCard key={metric.label} metric={metric} />
          ))}
        </div>
      </div>

      {/* Projections */}
      <ProjectionChart data={projections} />
      
      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400">Points Forts</h3>
          <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
            {strengths.map((point, index) => <li key={index}>{point}</li>)}
          </ul>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-red-600 dark:text-red-400">Points Faibles & Risques</h3>
          <ul className="space-y-2 list-disc list-inside text-gray-700 dark:text-gray-300">
            {weaknesses.map((point, index) => <li key={index}>{point}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResult;