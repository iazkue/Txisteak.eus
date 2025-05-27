
import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
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
  const baseStyles = "font-bold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150";
  
  let variantStyles = "";
  switch (variant) {
    case 'primary':
      variantStyles = "bg-red-500 hover:bg-red-600 text-white focus:ring-red-400";
      break;
    case 'secondary':
      variantStyles = "bg-blue-500 hover:bg-blue-600 text-white focus:ring-blue-400";
      break;
    case 'ghost':
      variantStyles = "bg-transparent hover:bg-gray-200 text-gray-700 focus:ring-gray-400 border border-gray-300";
      break;
  }

  let sizeStyles = "";
  switch (size) {
    case 'sm':
      sizeStyles = "py-1 px-2 text-sm";
      break;
    case 'md':
      sizeStyles = "py-2 px-4 text-base";
      break;
    case 'lg':
      sizeStyles = "py-3 px-6 text-lg";
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;
