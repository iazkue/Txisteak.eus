
import React from 'react';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  ...props
}) => {
  const baseStyles = "inline-flex items-center justify-center font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-basque-red text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    secondary: "bg-basque-green text-white hover:bg-green-700 focus:ring-green-500 shadow-sm",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-sm",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
    ghost: "bg-transparent hover:bg-stone-100 text-stone-600 border border-stone-200",
  };

  const sizes = {
    sm: "py-1.5 px-3 text-sm",
    md: "py-2.5 px-5 text-base",
    lg: "py-3.5 px-8 text-lg",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};

export default Button;
