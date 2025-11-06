import React from 'react';
import { BookOpenIcon } from './icons/Icons';

const EducationView: React.FC = () => {

  const content = {
    beginner: [
      "Qu'est-ce qu'une action et une obligation ?",
      "Comment fonctionne une bourse ?",
      "Lire un graphique boursier pour les nuls",
      "Les différents types d'ordres (marché, limite, stop)",
      "Construire son premier portefeuille",
    ],
    intermediate: [
      "Introduction à l'analyse fondamentale (Ratio C/B, BPA)",
      "Les bases de l'analyse technique (Supports, Résistances, Moyennes Mobiles)",
      "La diversification : le seul repas gratuit en finance",
      "Comprendre les ETFs et les fonds indiciels",
      "Psychologie de l'investisseur : éviter les pièges courants",
    ],
    africaFocus: [
      "Introduction aux principales bourses africaines (JSE, NGX, BRVM)",
      "Les secteurs clés de la croissance en Afrique",
      "Analyser les risques et opportunités sur les marchés frontières",
      "Le rôle des matières premières dans les économies africaines",
      "Comprendre la ZLECAF et son impact sur les entreprises cotées",
    ]
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
          <BookOpenIcon className="mx-auto h-12 w-12 text-indigo-600 dark:text-indigo-400" />
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
              Centre d'Apprentissage
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
              Développez vos compétences en investissement avec nos guides et articles, des bases aux stratégies avancées.
          </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Beginner */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-green-600 dark:text-green-400">Coin des Débutants</h3>
          <ul className="space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300">
            {content.beginner.map((title, i) => <li key={i} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">{title}</li>)}
          </ul>
        </div>
        {/* Intermediate */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-blue-600 dark:text-blue-400">Sujets Intermédiaires</h3>
          <ul className="space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300">
            {content.intermediate.map((title, i) => <li key={i} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">{title}</li>)}
          </ul>
        </div>
        {/* Africa Focus */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold mb-4 text-yellow-600 dark:text-yellow-400">Focus sur l'Afrique</h3>
          <ul className="space-y-3 list-disc list-inside text-gray-700 dark:text-gray-300">
            {content.africaFocus.map((title, i) => <li key={i} className="hover:text-indigo-600 dark:hover:text-indigo-400 cursor-pointer">{title}</li>)}
          </ul>
        </div>
      </div>
       <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            Note: Le contenu est à des fins éducatives. Cliquez sur un titre pour en savoir plus (fonctionnalité à venir).
        </p>
    </div>
  );
};

export default EducationView;
