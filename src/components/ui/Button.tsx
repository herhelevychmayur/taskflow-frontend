import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          {
            'bg-primary text-white hover:bg-primary-hover focus:ring-primary': variant === 'primary',
            'bg-surface text-foreground border border-border hover:bg-gray-100 focus:ring-primary': variant === 'secondary',
            'bg-error text-white hover:bg-red-600 focus:ring-error': variant === 'danger',
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';
