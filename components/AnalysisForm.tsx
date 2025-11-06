import React, { useState } from 'react';
import { getFinancialAnalysis } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';

interface AnalysisFormProps {
  onAnalysisStart: () => void;
  onAnalysisComplete: (data: { main: any, comparison: any | null }, news: any) => void;
  onAnalysisError: (error: string) => void;
  isLoading: boolean;
}

const currencies = [
    { value: 'USD', label: 'USD - Dollar Américain' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'JPY', label: 'JPY - Yen Japonais' },
    { value: 'GBP', label: 'GBP - Livre Sterling' },
    { value: 'INR', label: 'INR - Roupie Indienne' },
    { value: 'CNY', label: 'CNY - Yuan Chinois' },
    { value: 'BRL', label: 'BRL - Real Brésilien' },
    { value: 'CAD', label: 'CAD - Dollar Canadien' },
    { value: 'AUD', label: 'AUD - Dollar Australien' },
    { value: 'CHF', label: 'CHF - Franc Suisse' },
];

const AnalysisForm: React.FC<AnalysisFormProps> = ({ onAnalysisStart, onAnalysisComplete, onAnalysisError, isLoading }) => {
  const [identifier, setIdentifier] = useState('Apple (AAPL)');
  const [comparisonIdentifier, setComparisonIdentifier] = useState('');
  const [currency, setCurrency] = useState('USD');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      onAnalysisError("Veuillez entrer un nom d'entreprise ou un ticker.");
      return;
    }
    onAnalysisStart();
    try {
      const { analysis, news } = await getFinancialAnalysis(identifier, currency);
      let comparisonResult = null;
      if (comparisonIdentifier.trim()) {
        const { analysis: comparisonAnalysis } = await getFinancialAnalysis(comparisonIdentifier, currency);
        comparisonResult = comparisonAnalysis;
      }
      onAnalysisComplete({ main: analysis, comparison: comparisonResult }, news);
    } catch (error) {
      onAnalysisError(error instanceof Error ? error.message : "Une erreur inconnue est survenue.");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1">
                <label htmlFor="company-identifier" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Entreprise à Analyser
                </label>
                <input
                    id="company-identifier"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Ex: Microsoft, MSFT"
                    disabled={isLoading}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                />
            </div>
            <div className="md:col-span-1">
                <label htmlFor="comparison-identifier" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Comparer avec (Optionnel)
                </label>
                <input
                    id="comparison-identifier"
                    type="text"
                    value={comparisonIdentifier}
                    onChange={(e) => setComparisonIdentifier(e.target.value)}
                    placeholder="Ex: Google, GOOGL"
                    disabled={isLoading}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                />
            </div>
            <div className="md:col-span-1">
                <label htmlFor="currency-select" className="block text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                    Devise
                </label>
                <select
                    id="currency-select"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500 disabled:opacity-50"
                >
                    {currencies.map(c => (
                        <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                </select>
            </div>
        </div>
        <div className="mt-4">
          <button
            type="submit"
            disabled={isLoading || !identifier.trim()}
            className="w-full flex items-center justify-center px-4 py-2.5 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 disabled:bg-indigo-400 dark:disabled:bg-indigo-800 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Analyse en cours...
              </>
            ) : (
                <>
                    <SparklesIcon className="mr-2 h-5 w-5" />
                    <span>
                      {comparisonIdentifier.trim() ? 'Lancer la Comparaison' : "Lancer l'Analyse"}
                    </span>
                </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnalysisForm;