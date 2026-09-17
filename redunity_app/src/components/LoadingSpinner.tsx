import React from 'react';
import { motion } from 'framer-motion';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: 'brand-red' | 'brand-ink' | 'white';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'brand-red',
  className = ''
}) => {
  const sizeStyles = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const colorStyles = {
    'brand-red': 'text-brand-red',
    'brand-ink': 'text-brand-ink',
    'white': 'text-white'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <motion.div
        className={`${sizeStyles[size]} ${colorStyles[color]}`}
        animate={{
          rotate: 360
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          ease: "linear"
        }}
      >
        <svg
          className="animate-spin"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          ></path>
        </svg>
      </motion.div>
    </div>
  );
};

export const PageLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 bg-white flex flex-col items-center justify-center z-50">
      <div className="relative">
        <div className="absolute inset-0 bg-brand-red/20 rounded-full animate-ping"></div>
        <div className="relative w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center">
          <LoadingSpinner size="lg" color="brand-red" />
        </div>
      </div>
      <p className="mt-4 text-gray-600 font-medium">{message}</p>
      <p className="text-sm text-gray-400 mt-1">RedUnity - Pakistan's Blood Network</p>
    </div>
  );
};