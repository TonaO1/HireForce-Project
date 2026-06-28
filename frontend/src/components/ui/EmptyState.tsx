import type { ComponentType } from 'react';
import { Link } from 'react-router-dom';

interface EmptyStateAction {
  label: string;
  to?: string;
  onClick?: () => void;
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: EmptyStateAction;
  className?: string;
}

export function EmptyState({ title, description, icon: Icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center ${className}`}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-white/15 text-white/70">
          <Icon className="h-5 w-5" />
        </div>
      )}
      <h3 className="font-mono text-base font-semibold text-white">{title}</h3>
      {description && <p className="mt-2 max-w-sm text-sm text-white/50">{description}</p>}
      {action &&
        (action.to ? (
          <Link to={action.to} className="btn-mono btn-mono-solid mt-6 !px-4 !py-2 !text-sm">
            {action.label}
          </Link>
        ) : (
          <button
            type="button"
            onClick={action.onClick}
            className="btn-mono btn-mono-solid mt-6 !px-4 !py-2 !text-sm"
          >
            {action.label}
          </button>
        ))}
    </div>
  );
}
