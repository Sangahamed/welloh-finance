import React from 'react';
import { BriefcaseIcon } from './icons/Icons';

const PublicTendersView: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <BriefcaseIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
          Appels d'Offres Publics
        </h2>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
          Consultez les appels d'offres publics pertinents sur les marchés africains et mondiaux.
        </p>
      </div>

      <div className="text-center py-16 px-6 bg-white dark:bg-gray-800 rounded-lg shadow-md border-2 border-dashed border-gray-300 dark:border-gray-600">
        <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Fonctionnalité à venir</h3>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Cette section est en cours de développement et sera bientôt disponible pour vous aider à identifier de nouvelles opportunités.
        </p>
      </div>
    </div>
  );
};

export default PublicTendersView;
