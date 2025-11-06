import React from 'react';
import { ChartTrendingUpIcon, GlobeAltIcon, BriefcaseIcon } from './icons/Icons';

interface LandingViewProps {
    onNavigate: (view: string) => void;
}

const Feature: React.FC<{ icon: React.ReactNode, title: string, children: React.ReactNode }> = ({ icon, title, children }) => (
    <div className="text-center">
        <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-500 text-white mx-auto">
            {icon}
        </div>
        <div className="mt-5">
            <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">{title}</h3>
            <p className="mt-2 text-base text-gray-500 dark:text-gray-400">
                {children}
            </p>
        </div>
    </div>
);


const LandingView: React.FC<LandingViewProps> = ({ onNavigate }) => {
    return (
        <div className="space-y-16">
            {/* Hero Section */}
            <div className="text-center">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 dark:text-gray-100 sm:text-5xl md:text-6xl">
                    <span className="block">Global Trading Simulator</span>
                    <span className="block text-indigo-600 dark:text-indigo-400">with a Focus on Africa</span>
                </h1>
                <p className="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
                    Practice trading with a $100,000 virtual portfolio on global and African markets. Use AI for risk-free analysis and strategy building.
                </p>
                <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
                    <div className="rounded-md shadow">
                        <button
                            onClick={() => onNavigate('signup')}
                            className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 md:py-4 md:text-lg md:px-10"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="py-12 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:text-center">
                        <h2 className="text-base text-indigo-600 dark:text-indigo-400 font-semibold tracking-wide uppercase">Key Features</h2>
                        <p className="mt-2 text-3xl leading-8 font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                            Learn to Invest, Without the Risk
                        </p>
                    </div>

                    <div className="mt-10">
                        <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-3 md:gap-x-8 md:gap-y-10">
                            <Feature
                                icon={<GlobeAltIcon className="h-6 w-6" />}
                                title="African & Global Markets"
                            >
                                Access simulated data for stocks from the BRVM, JSE, NYSE, NASDAQ, and many more exchanges.
                            </Feature>

                             <Feature
                                icon={<ChartTrendingUpIcon className="h-6 w-6" />}
                                title="Risk-Free Trading"
                            >
                                Use a virtual portfolio to buy and sell stocks under realistic conditions, but with play money.
                            </Feature>

                            <Feature
                                icon={<BriefcaseIcon className="h-6 w-6" />}
                                title="Career Opportunities"
                            >
                                Top-performing users can be identified by financial institutions for internships and job opportunities.
                            </Feature>
                        </dl>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LandingView;
