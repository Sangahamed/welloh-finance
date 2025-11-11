import React from 'react';

const AuthLayout: React.FC<{ title: string, children: React.ReactNode, subTitle?: string }> = ({ title, subTitle, children }) => {
    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 sm:px-6 lg:px-8 bg-[#0B0E15]">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center items-center">
                    <svg className="h-12 w-auto text-indigo-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15v-4H8v-2h3V7h2v4h3v2h-3v4h-2z" />
                    </svg>
                    <span className="ml-3 text-3xl font-bold text-gray-100">Welloh</span>
                </div>
                <h2 className="mt-6 text-center text-2xl font-bold text-white">{title}</h2>
                {subTitle && <p className="mt-2 text-center text-sm text-gray-400">{subTitle}</p>}
            </div>

            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-[#1C1F2A]/50 border border-gray-700/50 py-8 px-4 shadow-xl sm:rounded-lg sm:px-10">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default AuthLayout;