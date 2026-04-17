// src/crm/pages/ReassignLeads.jsx
// ✅ FIX: replaced non-existent 'crm_users' table with 'profiles' (matches useCRMData.js)
import React, { useState, useEffect, useCallback } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { RefreshCw, UserCheck, Search, CheckSquare, Square, ChevronDown, X, Loader2, Users } from 'lucide-react';

const STATUS_COLORS = {
  new:           'bg-blue-100 text-blue-700',
  contacted:     'bg-yellow-100 text-yellow-700',
  interested:    'bg-green-100 text-green-700',
  not_interested:'bg-red-100 text-red-700',
  callback:      'bg-purple-100 text-purple-700',
  converted:     'bg-emerald-100 text-emerald-700',
  lost:          'bg-gray-100 text-gray-600',
};

export default function ReassignLeads() {
  const { user } = useAuth();
  const { toast } = useToast();

  // ── State ──────────────────────────────────────────────
  const [employees, setEmployees]         = useState([]);
  const [fromEmployee, setFromEmployee]   = useState('');
  const [toEmployee, setToEmployee]       = useState('');
  const [leads, setLeads]                 = useState([]);
  const [selectedIds, setSelectedIds]     = useState([]);
  const [search, setSearch]               = useState('');
  const [statusFilter, setStatusFilter]   = useState('');
  const [loadingLeads, setLoadingLeads]   = useState(false);
  const [assigning, setAssigning]         = useState(false);
  const [showConfirm, setShowConfirm]     = useState(false);

  // ── Load employees from 'profiles' table ─────────────
  useEffect(() => {
    const fetchEmployees = async () => {
      const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, name, role, email')
        .in('role', ['sales_executive', 'telecaller', 'manager', 'admin'])
        .order('name');
      if (!error) setEmployees(data || []);
      else console.error('[ReassignLeads] fetchEmployees error:', error.message);
    };
    fetchEmployees();
  }, []);

  // ── Load leads for fromEmployee ───────────────────────
  const fetchLeads = useCallback(async () => {
    if (!fromEmployee) { setLeads([]); setSelectedIds([]); return; }
    setLoadingLeads(true);
    setSelectedIds([]);
    let query = supabaseAdmin
      .from('leads')
      .select('id, full_name, phone, final_status, project, created_at')
      .eq('assigned_to', fromEmployee)
      .order('created_at', { ascending: false });
    if (statusFilter) query = query.eq('final_status', statusFilter);
    const { data, error } = await query;
    if (!error) {
      // normalise column names for the table below
      setLeads((data || []).map(l => ({
        ...l,
        name:             l.full_name   || '—',
        status:           l.final_status || '—',
        project_interest: l.project      || '—',
      })));
    } else {
      console.error('[ReassignLeads] fetchLeads error:', error.message);
    }
    setLoadingLeads(false);
  }, [fromEmployee, statusFilter]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);

  // ── Filtered leads (search) ────────────────────────────
  const filteredLeads = leads.filter(l => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.project_interest?.toLowerCase().includes(q)
    );
  });

  // ── Select helpers ────────────────────────────────────
  const toggleOne = id =>
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleAll = () => {
    if (selectedIds.length === filteredLeads.length)
      setSelectedIds([]);
    else
      setSelectedIds(filteredLeads.map(l => l.id));
  };

  // ── Reassign ──────────────────────────────────────────
  const handleReassign = async () => {
    if (!toEmployee || selectedIds.length === 0) return;
    setAssigning(true);
    const toEmp   = employees.find(e => e.id === toEmployee);
    const fromEmp = employees.find(e => e.id === fromEmployee);

    const { error } = await supabaseAdmin
      .from('leads')
      .update({
        assigned_to:          toEmployee,
        assigned_to_name:     toEmp?.name  || null,
        prev_assigned_to:     fromEmployee || null,
        prev_assigned_to_name: fromEmp?.name || null,
        prev_assigned_at:     new Date().toISOString(),
        assigned_at:          new Date().toISOString(),
        reassigned_by:        user?.id,
        reassigned_at:        new Date().toISOString(),
        updated_at:           new Date().toISOString(),
      })
      .in('id', selectedIds);

    setAssigning(false);
    setShowConfirm(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({
        title: `${selectedIds.length} lead${selectedIds.length > 1 ? 's' : ''} reassigned`,
        description: `Assigned to ${toEmp?.name || 'employee'}`,
      });
      setSelectedIds([]);
      setToEmployee('');
      fetchLeads();
    }
  };

  const fromEmpName  = employees.find(e => e.id === fromEmployee)?.name || '';
  const toEmpName    = employees.find(e => e.id === toEmployee)?.name   || '';
  const allSelected  = filteredLeads.length > 0 && selectedIds.length === filteredLeads.length;
  const someSelected = selectedIds.length > 0 && !allSelected;

  const STATUSES = ['new','contacted','interested','not_interested','callback','converted','lost','FollowUp','Booked'];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="p-2 bg-[#0F3A5F] rounded-xl">
            <RefreshCw size={20} className="text-[#D4AF37]" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Re-assign Leads</h1>
        </div>
        <p className="text-sm text-gray-500 ml-11">Select leads from an employee and bulk-reassign them to another.</p>
      </div>

      {/* ── Step 1: Choose employees ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-5">
        <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Step 1 — Select Employees</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* FROM */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              From Employee
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={fromEmployee}
                onChange={e => { setFromEmployee(e.target.value); setToEmployee(''); }}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F]"
              >
                <option value="">— Select employee —</option>
                {employees.map(e => (
                  <option key={e.id} value={e.id}>{e.name} ({(e.role || '').replace('_',' ')})</option>
                ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* TO */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              To Employee
              <span className="text-red-500 ml-0.5">*</span>
            </label>
            <div className="relative">
              <select
                value={toEmployee}
                onChange={e => setToEmployee(e.target.value)}
                disabled={!fromEmployee}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F] disabled:opacity-50"
              >
                <option value="">— Select employee —</option>
                {employees
                  .filter(e => e.id !== fromEmployee)
                  .map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({(e.role || '').replace('_',' ')})</option>
                  ))}
              </select>
              <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Step 2: Leads Table ── */}
      {fromEmployee && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-5">
          <div className="p-5 border-b border-gray-100">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Step 2 — Select Leads to Reassign</p>

            {/* Filters row */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search */}
              <div className="relative flex-1">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, project…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F]"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pr-9 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F3A5F]/30 focus:border-[#0F3A5F]"
                >
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => (
                    <option key={s} value={s}>{s.replace('_',' ')}</option>
                  ))}
                </select>
                <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>

              {/* Refresh */}
              <button
                onClick={fetchLeads}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 transition-colors"
              >
                <RefreshCw size={14} />
                Refresh
              </button>
            </div>

            {/* Selection summary */}
            {selectedIds.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <span className="font-semibold text-[#0F3A5F]">{selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''} selected</span>
                <button onClick={() => setSelectedIds([])} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={14} />
                </button>
              </div>
            )}
          </div>

          {/* Table */}
          {loadingLeads ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 size={28} className="animate-spin text-[#0F3A5F]" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Users size={40} className="mb-3 text-gray-300" />
              <p className="text-sm font-medium">No leads found</p>
              <p className="text-xs mt-1">Try changing the filter or selecting a different employee.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left w-10">
                      <button
                        onClick={toggleAll}
                        className="text-gray-500 hover:text-[#0F3A5F] transition-colors"
                        aria-label="Select all"
                      >
                        {allSelected
                          ? <CheckSquare size={18} className="text-[#0F3A5F]" />
                          : someSelected
                            ? <CheckSquare size={18} className="text-[#0F3A5F] opacity-50" />
                            : <Square size={18} />}
                      </button>
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">#</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Name</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Phone</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Status</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Project</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-600">Added On</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredLeads.map((lead, idx) => {
                    const checked = selectedIds.includes(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        onClick={() => toggleOne(lead.id)}
                        className={`cursor-pointer transition-colors ${
                          checked ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          {checked
                            ? <CheckSquare size={17} className="text-[#0F3A5F]" />
                            : <Square size={17} className="text-gray-300" />}
                        </td>
                        <td className="px-4 py-3 text-gray-400 text-xs">{idx + 1}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{lead.name || '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{lead.phone || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold capitalize ${
                            STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-600'
                          }`}>
                            {lead.status?.replace('_',' ') || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-xs">{lead.project_interest || '—'}</td>
                        <td className="px-4 py-3 text-gray-400 text-xs">
                          {lead.created_at ? new Date(lead.created_at).toLocaleDateString('en-IN') : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer count */}
          {filteredLeads.length > 0 && (
            <div className="px-5 py-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
              <span>{filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} for <strong className="text-gray-600">{fromEmpName}</strong></span>
              <span>{selectedIds.length} selected</span>
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: Reassign CTA ── */}
      {selectedIds.length > 0 && toEmployee && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">Step 3 — Confirm Reassignment</p>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="text-sm text-gray-700">
              Reassign <strong className="text-[#0F3A5F]">{selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''}</strong>
              {' '}from <strong>{fromEmpName}</strong>
              {' '}→ <strong className="text-emerald-600">{toEmpName}</strong>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#0F3A5F] hover:bg-[#0a2d4a] text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
            >
              <UserCheck size={16} />
              Reassign Now
            </button>
          </div>
        </div>
      )}

      {/* ── Confirm Modal ── */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-amber-100 rounded-xl">
                <RefreshCw size={20} className="text-amber-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Confirm Reassignment</h2>
            </div>
            <p className="text-sm text-gray-600 mb-6">
              You are about to reassign <strong>{selectedIds.length} lead{selectedIds.length > 1 ? 's' : ''}</strong> from
              {' '}<strong>{fromEmpName}</strong> to <strong className="text-emerald-600">{toEmpName}</strong>.
              <br /><br />
              This action <strong>cannot be undone</strong> automatically. Proceed?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReassign}
                disabled={assigning}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#0F3A5F] hover:bg-[#0a2d4a] text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {assigning ? <Loader2 size={15} className="animate-spin" /> : <UserCheck size={15} />}
                {assigning ? 'Reassigning…' : 'Yes, Reassign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
