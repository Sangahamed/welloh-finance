
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowUpIcon, XMarkIcon } from './icons/Icons';

interface LevelUpNotificationProps {
  levelInfo: { oldLevel: string; newLevel: string };
  onClose: () => void;
}

const LevelUpNotification: React.FC<LevelUpNotificationProps> = ({ levelInfo, onClose }) => {
    const [show, setShow] = useState(false);

    const handleClose = useCallback(() => {
        setShow(false);
        // Allow time for exit animation before calling onClose
        setTimeout(onClose, 300);
    }, [onClose]);

    useEffect(() => {
        // Entrance animation
        setShow(true);

        // Auto-dismiss timer
        const timer = setTimeout(() => {
            handleClose();
        }, 8000); // 8 seconds auto-dismiss

        // Cleanup timer on component unmount
        return () => clearTimeout(timer);
    }, [handleClose]);

    return (
        <div className={`
            max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black dark:ring-gray-700 ring-opacity-5 overflow-hidden
            transition-all duration-300 ease-in-out
            ${show ? 'transform opacity-100 scale-100' : 'transform opacity-0 scale-90'}
        `}>
            <div className="p-4">
                <div className="flex items-start">
                    <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                            <ArrowUpIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                    <div className="ml-3 w-0 flex-1 pt-0.5">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">PROMOTION !</p>
                        <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                            Félicitations ! Vous êtes passé de <span className="font-bold">{levelInfo.oldLevel}</span> à <span className="font-bold text-green-500 dark:text-green-400">{levelInfo.newLevel}</span>.
                        </p>
                    </div>
                    <div className="ml-4 flex-shrink-0 flex">
                        <button
                            onClick={handleClose}
                            className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 dark:text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-gray-800"
                        >
                            <span className="sr-only">Fermer</span>
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LevelUpNotification;
