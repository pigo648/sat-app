import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;
}

const variantStyles = {
  primary: 'bg-primary-600 text-white active:bg-primary-700',
  secondary: 'bg-gray-100 text-gray-700 active:bg-gray-200',
  danger: 'bg-red-500 text-white active:bg-red-600',
  ghost: 'bg-transparent text-primary-600 active:bg-primary-50',
};

const sizeStyles = {
  sm: 'px-3 py-1.5 text-xs rounded-lg',
  md: 'px-4 py-2.5 text-sm rounded-xl',
  lg: 'px-6 py-3 text-base rounded-xl',
};

export default function Button({ variant = 'primary', size = 'md', loading, children, className = '', disabled, ...props }: Props) {
  return (
    <button
      className={`font-medium transition-all min-touch inline-flex items-center justify-center gap-2
        ${variantStyles[variant]} ${sizeStyles[size]}
        ${(disabled || loading) ? 'opacity-50 pointer-events-none' : ''}
        ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
