import React from 'react';
import { EmptyState } from './StateViews';

const AdminTable = ({ columns = [], rows = [] }) => {
  if (!rows.length) return <EmptyState />;

  return (
    <div className="overflow-hidden rounded-xl border bg-white">
      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
            <tr>
              {columns.map((column) => <th key={column.key} className="px-4 py-3">{column.label}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-t">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-slate-700">
                    {column.render ? column.render(row[column.key], row) : row[column.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminTable;
