// src/crm/components/AssignmentModal.jsx
// ✅ Smart suggestion + employee stats
// ✅ Reassignment warning popup with 2-step confirmation
// ✅ Searchable employee picker (replaces plain Select)
// ✅ FIX: reassignedOn saved correctly as "now" when reassigning
import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { getEmployeeStats, suggestEmployee } from '@/lib/smartAssignmentEngine';
import { Star, Briefcase, BarChart, Users, AlertTriangle, ArrowRight, UserCheck, Search, X } from 'lucide-react';

// Safe initial: never crashes on null / undefined / empty string
const initial = (name) => (name || '?').trim().charAt(0).toUpperCase() || '?';

// ── Searchable Employee Picker ────────────────────────────────────────────────
const EmployeePicker = ({ employees, selectedId, onSelect }) => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  const selected = employees.find(e => e.id === selectedId);

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(query.toLowerCase())
  );

  // close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (emp) => {
    onSelect(emp.id);
    setQuery('');
    setOpen(false);
  };

  return (
    <div ref={wrapRef} className="relative">
      {/* Trigger / selected display */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2.5 bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all"
      >
        {selected ? (
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              {initial(selected.name)}
            </div>
            <span className="font-medium text-gray-800 text-sm truncate">{selected.name}</span>
            <span className="text-xs text-gray-400 shrink-0">
              {selected.currentLoad ?? 0} leads · ⭐ {selected.performanceScore ?? 1.0}
            </span>
          </div>
        ) : (
          <span className="text-gray-400 text-sm">Choose employee...</span>
        )}
        <Search size={14} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-100 flex items-center gap-2">
            <Search size={14} className="text-gray-400 shrink-0" />
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search employee..."
              className="flex-1 text-sm outline-none bg-transparent placeholder-gray-400"
            />
            {query && (
              <button onClick={() => setQuery('')} className="text-gray-300 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Employee list */}
          <div className="max-h-56 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">No employee found</p>
            ) : filtered.map(emp => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleSelect(emp)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left ${
                  emp.id === selectedId ? 'bg-blue-50' : ''
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {initial(emp.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{emp.name}</p>
                  <p className="text-[11px] text-gray-400">{emp.currentLoad ?? 0} leads · ⭐ {emp.performanceScore ?? 1.0}</p>
                </div>
                {emp.id === selectedId && (
                  <div className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center shrink-0">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none">
                      <path d="M1 4l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ── Main Modal ────────────────────────────────────────────────────────────────
const AssignmentModal = ({ isOpen, onClose, leads = [], allLeads = [], onAssign, employees = [] }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeStats, setEmployeeStats]           = useState([]);
  const [suggestion, setSuggestion]                 = useState(null);
  const [showConfirm, setShowConfirm]               = useState(false);

  useEffect(() => {
    if (isOpen && employees.length > 0) {
      setSelectedEmployeeId('');
      setSuggestion(null);
      setShowConfirm(false);
      const stats = getEmployeeStats(employees, allLeads);
      setEmployeeStats(stats);
      if (leads.length > 0) {
        const bestFit = suggestEmployee(leads[0], stats);
        setSuggestion(bestFit);
        if (bestFit) setSelectedEmployeeId(bestFit.id);
      }
    }
  }, [isOpen, employees, leads]);

  // Leads already assigned to someone OTHER than the chosen employee
  const alreadyAssigned = selectedEmployeeId
    ? leads.filter(l => l.assignedTo && l.assignedTo !== selectedEmployeeId)
    : [];

  const newEmployeeName = employees.find(e => e.id === selectedEmployeeId)?.name || '';

  const handleAssignClick = () => {
    if (!selectedEmployeeId) return;
    if (alreadyAssigned.length > 0) {
      setShowConfirm(true);
    } else {
      doAssign();
    }
  };

  const doAssign = () => {
    onAssign(selectedEmployeeId, newEmployeeName || 'Unknown');
    setShowConfirm(false);
    onClose();
  };

  const handleClose = () => {
    setShowConfirm(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">

        {/* ── REASSIGNMENT WARNING OVERLAY ── */}
        {showConfirm && (
          <div className="absolute inset-0 z-50 bg-white rounded-lg flex flex-col p-6 overflow-y-auto">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">Reassignment Warning</h3>
                <p className="text-xs text-gray-400">Review before confirming</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <span className="font-bold text-amber-700">{alreadyAssigned.length}</span>{' '}
              lead{alreadyAssigned.length > 1 ? 's are' : ' is'}{' '}
              <span className="font-semibold">already assigned</span> to another employee.{' '}
              Proceeding will{' '}
              <span className="text-red-600 font-semibold">move them away</span>{' '}
              from their current assignee.
            </p>

            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
              Leads being reassigned
            </p>

            <div className="space-y-2 mb-4 flex-1 overflow-y-auto">
              {alreadyAssigned.map(lead => (
                <div key={lead.id}
                  className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2.5 shadow-sm">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        {initial(lead.assignedToName)}
                      </div>
                      <p className="text-xs text-amber-700 truncate">{lead.assignedToName || 'Unknown'}</p>
                    </div>
                  </div>
                  <ArrowRight size={14} className="text-gray-400 shrink-0" />
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {initial(newEmployeeName)}
                    </div>
                    <p className="text-xs text-blue-700 font-semibold">{newEmployeeName || 'Employee'}</p>
                  </div>
                </div>
              ))}
            </div>

            {leads.length > alreadyAssigned.length && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
                <UserCheck size={14} className="text-green-600 shrink-0" />
                <p className="text-xs text-green-700">
                  <span className="font-bold">{leads.length - alreadyAssigned.length}</span> other lead
                  {leads.length - alreadyAssigned.length > 1 ? 's' : ''} will be freshly assigned.
                </p>
              </div>
            )}

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Button variant="outline" className="flex-1" onClick={() => setShowConfirm(false)}>
                ← Go Back
              </Button>
              <Button className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold" onClick={doAssign}>
                Yes, Reassign
              </Button>
            </div>
          </div>
        )}

        {/* ── NORMAL MODAL CONTENT ── */}
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Assign Lead{leads.length > 1 ? `s (${leads.length})` : ''}
          </DialogTitle>
          <DialogDescription className="sr-only">
            Select an employee to assign {leads.length} lead{leads.length > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>

          {/* Leads selected */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 mb-2 font-semibold">
              {leads.length} Lead{leads.length > 1 ? 's' : ''} selected
            </p>
            <div className="text-xs text-blue-600" style={{ maxHeight: '80px', overflowY: 'auto' }}>
              {leads.map(l => l.name).join(', ')}
            </div>
          </div>

          {/* Inline warning banner — visible before clicking confirm */}
          {alreadyAssigned.length > 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">
                  {alreadyAssigned.length} lead{alreadyAssigned.length > 1 ? 's' : ''} already assigned
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {alreadyAssigned.map(l => `${l.name} → ${l.assignedToName || 'Unknown'}`).join(' · ')}
                </p>
              </div>
            </div>
          )}

          {/* Smart Suggestion */}
          {suggestion && (
            <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1 rounded-full">
                  <Star size={12} className="text-green-600" />
                </div>
                <div>
                  <p className="text-xs font-bold text-green-800">Smart Suggestion</p>
                  <p className="text-sm text-green-900">{suggestion.name}</p>
                </div>
              </div>
              <Button size="sm" variant="outline"
                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => setSelectedEmployeeId(suggestion.id)}>
                Select
              </Button>
            </div>
          )}

          {/* ✅ Searchable Employee Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <EmployeePicker
              employees={employeeStats}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
            />
          </div>

          {/* Selected Employee Stats */}
          {selectedEmployeeId && (() => {
            const emp = employeeStats.find(e => e.id === selectedEmployeeId);
            if (!emp) return null;
            return (
              <div className="p-3 border rounded-lg bg-gray-50 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Current Workload</span>
                  <Badge variant="outline" className="bg-white">{emp.currentLoad} Leads</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Performance Rating</span>
                  <div className="flex items-center text-yellow-500 text-xs">
                    <Star size={12} fill="currentColor" />
                    <span className="ml-1 text-gray-700">{emp.performanceScore} / 5.0</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">Expertise</span>
                  <div className="flex gap-1 flex-wrap justify-end">
                    {(emp.expertise || []).map(ex => (
                      <span key={ex} className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{ex}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={handleClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleAssignClick}
            disabled={!selectedEmployeeId}
            className={`flex-1 text-white ${
              alreadyAssigned.length > 0
                ? 'bg-amber-500 hover:bg-amber-600'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}>
            {alreadyAssigned.length > 0
              ? `⚠️ Assign (${alreadyAssigned.length} Reassign)`
              : `Assign ${leads.length > 1 ? `${leads.length} Leads` : 'Lead'}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;
