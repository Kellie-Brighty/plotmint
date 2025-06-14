import React from "react";
import { Link } from "react-router-dom";
import { Button } from "./Button";

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionLink?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * EmptyStateCard - A reusable component to display when no content is available
 */
export const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  description,
  actionLabel,
  actionLink,
  action,
  icon,
  className = "",
}) => {
  return (
    <div
      className={`bg-white dark:bg-dark-800 rounded-lg shadow-sm border border-parchment-200 dark:border-dark-700 p-8 text-center ${className}`}
    >
      {icon && <div className="mx-auto mb-4 flex justify-center">{icon}</div>}

      <h4 className="text-lg font-medium text-ink-900 dark:text-white mb-2">
        {title}
      </h4>

      <p className="text-ink-600 dark:text-ink-400 mb-6">{description}</p>

      {action ? (
        action
      ) : actionLabel && actionLink ? (
        <Link to={actionLink}>
          <Button variant="primary">{actionLabel}</Button>
        </Link>
      ) : null}
    </div>
  );
};

export default EmptyStateCard;
