import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Link } from "react-router-dom";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "cta-primary"
  | "cta-secondary";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
}

// Use separate props for LinkButton that extends from LinkProps
type LinkButtonProps = {
  children: ReactNode;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  fullWidth?: boolean;
  to: string;
};

const getVariantClasses = (variant: ButtonVariant): string => {
  switch (variant) {
    case "primary":
      return "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400 border-transparent";
    case "secondary":
      return "bg-secondary-600 hover:bg-secondary-700 text-white dark:bg-secondary-500 dark:hover:bg-secondary-400 border-transparent";
    case "outline":
      return "bg-transparent hover:bg-ink-50 dark:hover:bg-dark-800 text-ink-900 dark:text-white border-ink-300 dark:border-dark-700";
    case "ghost":
      return "bg-transparent hover:bg-ink-50 dark:hover:bg-dark-800 text-ink-700 dark:text-ink-200 border-transparent";
    case "cta-primary":
      return "bg-white hover:bg-gray-100 text-primary-700 border-transparent shadow-lg hover:shadow-xl";
    case "cta-secondary":
      return "bg-transparent hover:bg-white/20 text-white border-2 border-white hover:shadow-lg";
    default:
      return "bg-primary-600 hover:bg-primary-700 text-white dark:bg-primary-500 dark:hover:bg-primary-400 border-transparent";
  }
};

const getSizeClasses = (size: ButtonSize): string => {
  switch (size) {
    case "sm":
      return "text-sm px-3 py-1.5 rounded";
    case "md":
      return "text-base px-4 py-2 rounded-md";
    case "lg":
      return "text-lg px-6 py-3 rounded-md";
    default:
      return "text-base px-4 py-2 rounded-md";
  }
};

export const Button = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
  ...props
}: ButtonProps) => {
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);

  return (
    <button
      className={`inline-flex items-center justify-center font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50 ${variantClasses} ${sizeClasses} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const LinkButton = ({
  children,
  variant = "primary",
  size = "md",
  className = "",
  fullWidth = false,
  to,
  ...props
}: LinkButtonProps) => {
  const variantClasses = getVariantClasses(variant);
  const sizeClasses = getSizeClasses(size);

  return (
    <Link
      to={to}
      className={`inline-flex items-center justify-center font-medium border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 disabled:opacity-50 ${variantClasses} ${sizeClasses} ${
        fullWidth ? "w-full" : ""
      } ${className}`}
      {...props}
    >
      {children}
    </Link>
  );
};

export default Button;
