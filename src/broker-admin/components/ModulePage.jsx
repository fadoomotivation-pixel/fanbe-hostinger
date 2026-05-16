import React, { useMemo, useState } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import { useAsyncData } from '../hooks/useAsyncData';
import { adminApi } from '../services/adminApi';
import AdminTable from './AdminTable';
import { ErrorState, LoadingState } from './StateViews';

const ModulePage = ({ title, table, columns, description, defaultForm }) => {
  const { data, loading, error, refresh } = useAsyncData(() => adminApi.listTable(table), [table]);
  const [formState, setFormState] = useState(defaultForm || {});
  const [saving, setSaving] = useState(false);

  const rows = useMemo(() => data || [], [data]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await adminApi.upsert(table, formState);
      setFormState(defaultForm || {});
      refresh();
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
          <p className="text-sm text-slate-500">{description}</p>
        </div>
        <button onClick={refresh} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /> Refresh</button>
      </header>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div>
          {loading && <LoadingState />}
          {error && <ErrorState error={error} onRetry={refresh} />}
          {!loading && !error && <AdminTable columns={columns} rows={rows} />}
        </div>

        {defaultForm && (
          <form onSubmit={onSubmit} className="space-y-3 rounded-xl border bg-white p-4">
            <h3 className="font-semibold">Quick Create / Update</h3>
            {Object.keys(defaultForm).map((key) => (
              <div key={key}>
                <label className="mb-1 block text-xs uppercase tracking-wide text-slate-500">{key.replaceAll('_', ' ')}</label>
                <input
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                  value={formState[key] ?? ''}
                  onChange={(e) => setFormState((prev) => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            ))}
            <button disabled={saving} className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white disabled:opacity-50">
              <Plus className="h-4 w-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

export default ModulePage;
