import React, { Fragment } from 'react';
import { useSettings, LineType } from '../contexts/SettingsContext';
import { Cog6ToothIcon, XMarkIcon } from './icons/Icons';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { settings, updateSettings } = useSettings();
  const { revenueColor, profitColor, lineType, showGrid } = settings;

  if (!isOpen) {
    return null;
  }

  const handleSettingChange = (key: string, value: any) => {
    updateSettings({ [key]: value });
  };
  
  const lineTypes: { value: LineType, label: string }[] = [
    { value: 'monotone', label: 'Monotone' },
    { value: 'linear', label: 'Linéaire' },
    { value: 'step', label: 'En escalier' },
  ];

  return (
    <div 
        className="fixed inset-0 bg-gray-600 bg-opacity-75 flex justify-center items-center z-50 transition-opacity"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6 w-full max-w-md m-4 transform transition-all">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center" id="modal-title">
                    <Cog6ToothIcon className="h-6 w-6 mr-2"/>
                    Paramètres
                </h2>
                <button
                    onClick={onClose}
                    className="p-1 rounded-full text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    aria-label="Fermer les paramètres"
                >
                    <XMarkIcon className="h-6 w-6" />
                </button>
            </div>

            <div className="space-y-6">
                <fieldset>
                    <legend className="text-lg font-semibold text-indigo-600 dark:text-indigo-400 mb-2">
                        Personnalisation du Graphique
                    </legend>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label htmlFor="revenue-color" className="text-gray-700 dark:text-gray-300">Couleur des Revenus</label>
                            <input 
                                type="color" 
                                id="revenue-color" 
                                value={revenueColor}
                                onChange={(e) => handleSettingChange('revenueColor', e.target.value)}
                                className="w-10 h-10 p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="profit-color" className="text-gray-700 dark:text-gray-300">Couleur des Bénéfices</label>
                            <input 
                                type="color" 
                                id="profit-color" 
                                value={profitColor}
                                onChange={(e) => handleSettingChange('profitColor', e.target.value)}
                                className="w-10 h-10 p-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md cursor-pointer"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="line-type" className="text-gray-700 dark:text-gray-300">Type de Ligne</label>
                             <select
                                id="line-type"
                                value={lineType}
                                onChange={(e) => handleSettingChange('lineType', e.target.value)}
                                className="w-1/2 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 text-gray-800 dark:text-gray-200 focus:border-indigo-500 focus:ring-indigo-500"
                            >
                                {lineTypes.map(lt => (
                                    <option key={lt.value} value={lt.value}>{lt.label}</option>
                                ))}
                            </select>
                        </div>
                         <div className="flex items-center justify-between">
                            <label htmlFor="show-grid" className="text-gray-700 dark:text-gray-300">Afficher la Grille</label>
                            <label htmlFor="show-grid" className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    id="show-grid"
                                    checked={showGrid}
                                    onChange={(e) => handleSettingChange('showGrid', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 dark:peer-focus:ring-indigo-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-indigo-600"></div>
                            </label>
                        </div>
                    </div>
                </fieldset>
            </div>
             <div className="mt-6 text-right">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md shadow-md hover:bg-indigo-700 dark:hover:bg-indigo-500 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                >
                    Terminé
                </button>
            </div>
        </div>
    </div>
  );
};

export default SettingsModal;