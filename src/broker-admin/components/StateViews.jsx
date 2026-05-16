import React from 'react';
import { AlertTriangle, Loader2, Inbox } from 'lucide-react';

export const LoadingState = ({ label = 'Loading...' }) => (
  <div className="flex items-center gap-2 rounded-lg border bg-white p-4 text-sm text-slate-600">
    <Loader2 className="h-4 w-4 animate-spin" /> {label}
  </div>
);

export const ErrorState = ({ error, onRetry }) => (
  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
    <div className="mb-2 flex items-center gap-2 font-semibold"><AlertTriangle className="h-4 w-4" /> Something went wrong</div>
    <p className="mb-3">{error?.message || 'Unable to fetch records.'}</p>
    {onRetry && <button className="rounded bg-red-600 px-3 py-1.5 text-white" onClick={onRetry}>Retry</button>}
  </div>
);

export const EmptyState = ({ label = 'No records found' }) => (
  <div className="flex items-center gap-2 rounded-lg border border-dashed bg-slate-50 p-4 text-sm text-slate-600">
    <Inbox className="h-4 w-4" /> {label}
  </div>
);
