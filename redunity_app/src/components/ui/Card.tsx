import React from 'react';
import { motion } from 'framer-motion';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hover = false,
  onClick
}) => {
  const baseStyles = 'bg-white border border-gray-200 rounded-xl shadow-sm';
  const hoverStyles = hover ? 'hover:shadow-md hover:border-brand-red/30 transition-all duration-300 cursor-pointer' : '';
  const clickStyles = onClick ? 'cursor-pointer' : '';

  const CardComponent = onClick ? motion.div : 'div';
  const motionProps = onClick ? {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.98 }
  } : {};

  return (
    <CardComponent
      className={`${baseStyles} ${hoverStyles} ${clickStyles} ${className}`}
      onClick={onClick}
      {...motionProps}
    >
      {children}
    </CardComponent>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`p-4 border-b border-gray-100 ${className}`}>
    {children}
  </div>
);

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`p-4 ${className}`}>
    {children}
  </div>
);

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`p-4 border-t border-gray-100 ${className}`}>
    {children}
  </div>
);