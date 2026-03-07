// src/crm/components/AssignmentModal.jsx
// ✅ Smart suggestion + employee stats
// ✅ NEW: Reassignment warning popup — if any selected leads are already assigned
//         to someone, a warning overlay shows before final submission so admin
//         can confirm or cancel the reassignment.
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getEmployeeStats, suggestEmployee } from '@/lib/smartAssignmentEngine';
import { Star, Briefcase, BarChart, Users, AlertTriangle, ArrowRight, UserCheck } from 'lucide-react';

const AssignmentModal = ({ isOpen, onClose, leads = [], allLeads = [], onAssign, employees = [] }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeStats, setEmployeeStats]           = useState([]);
  const [suggestion, setSuggestion]                 = useState(null);
  // ✅ Warning popup state
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (isOpen && employees.length > 0) {
      setSelectedEmployeeId('');
      setSuggestion(null);
      setShowConfirm(false);
      const stats   = getEmployeeStats(employees, allLeads);
      setEmployeeStats(stats);
      if (leads.length > 0) {
        const bestFit = suggestEmployee(leads[0], stats);
        setSuggestion(bestFit);
        if (bestFit) setSelectedEmployeeId(bestFit.id);
      }
    }
  }, [isOpen, employees, leads]);

  // ✅ Leads that are already assigned to SOMEONE different from the new selection
  const alreadyAssigned = selectedEmployeeId
    ? leads.filter(l => l.assignedTo && l.assignedTo !== selectedEmployeeId)
    : [];

  const newEmployeeName = employees.find(e => e.id === selectedEmployeeId)?.name || '';

  // Step 1: admin clicks "Assign" button
  const handleAssignClick = () => {
    if (!selectedEmployeeId) return;
    if (alreadyAssigned.length > 0) {
      // Some leads are already owned — show warning before proceeding
      setShowConfirm(true);
    } else {
      doAssign();
    }
  };

  // Step 2: admin confirmed — do the actual assignment
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
      <DialogContent className="max-w-md flex flex-col relative" style={{ maxHeight: '90vh' }}>

        {/* ═══════════════════════════════════════════ */}
        {/* ✅ REASSIGNMENT WARNING OVERLAY */}
        {/* Slides in on top of the modal content when some leads are already owned */}
        {/* ═══════════════════════════════════════════ */}
        {showConfirm && (
          <div className="absolute inset-0 z-20 bg-white rounded-lg flex flex-col p-5 overflow-y-auto">
            {/* Warning header */}
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertTriangle size={18} className="text-amber-600" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-base leading-tight">Reassignment Warning</h3>
                <p className="text-xs text-gray-400">Review before confirming</p>
              </div>
            </div>

            <p className="text-sm text-gray-600 mt-3 mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
              <span className="font-bold text-amber-700">{alreadyAssigned.length}</span> of your selected lead
              {alreadyAssigned.length > 1 ? 's are' : ' is'} <span className="font-semibold">already assigned</span> to another
              employee. Proceeding will <span className="text-red-600 font-semibold">remove them</span> from their current assignee.
            </p>

            {/* Conflict list */}
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Leads being reassigned</p>
            <div className="space-y-2 mb-5 flex-1">
              {alreadyAssigned.map(lead => (
                <div key={lead.id}
                  className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2.5 shadow-sm">
                  {/* Current owner */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{lead.name}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <div className="w-4 h-4 rounded-full bg-amber-400 text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                        {(lead.assignedToName || '?')[0].toUpperCase()}
                      </div>
                      <p className="text-xs text-amber-700 truncate">{lead.assignedToName || 'Unknown'}</p>
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight size={14} className="text-gray-400 shrink-0" />

                  {/* New owner */}
                  <div className="flex items-center gap-1 shrink-0">
                    <div className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[9px] font-bold">
                      {(newEmployeeName || '?')[0].toUpperCase()}
                    </div>
                    <p className="text-xs text-blue-700 font-semibold">{newEmployeeName}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary line */}
            {leads.length > alreadyAssigned.length && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-4">
                <UserCheck size={14} className="text-green-600 shrink-0" />
                <p className="text-xs text-green-700">
                  <span className="font-bold">{leads.length - alreadyAssigned.length}</span> other lead
                  {leads.length - alreadyAssigned.length > 1 ? 's' : ''} will be freshly assigned.
                </p>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              <Button
                variant="outline"
                className="flex-1 border-gray-300 text-gray-700"
                onClick={() => setShowConfirm(false)}>
                ← Go Back
              </Button>
              <Button
                className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold"
                onClick={doAssign}>
                Yes, Reassign
              </Button>
            </div>
          </div>
        )}

        {/* ── NORMAL MODAL CONTENT ── */}
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Assign Lead{leads.length > 1 ? `s (${leads.length})` : ''}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">

          {/* Leads selected */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 mb-2 font-semibold">
              {leads.length} Lead{leads.length > 1 ? 's' : ''} selected
            </p>
            <div className="text-xs text-blue-600 overflow-y-auto" style={{ maxHeight: '80px' }}>
              {leads.map(l => l.name).join(', ')}
            </div>
          </div>

          {/* ✅ Already-assigned warning banner (shown before picking confirm) */}
          {alreadyAssigned.length > 0 && (
            <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-lg px-3 py-2.5">
              <AlertTriangle size={15} className="text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-amber-800">
                  {alreadyAssigned.length} lead{alreadyAssigned.length > 1 ? 's' : ''} already assigned
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  {alreadyAssigned.map(l => `${l.name} → ${l.assignedToName}`).join(' · ')}
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

          {/* Employee Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger><SelectValue placeholder="Choose employee..." /></SelectTrigger>
              <SelectContent>
                {employeeStats.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center justify-between w-full min-w-[200px]">
                      <span>{emp.name}</span>
                      <div className="flex gap-2 text-xs text-gray-500 ml-3">
                        <span className="flex items-center"><Briefcase size={10} className="mr-1" />{emp.currentLoad} leads</span>
                        <span className="flex items-center"><BarChart size={10} className="mr-1" />{emp.performanceScore}</span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                    {emp.expertise.map(ex => (
                      <span key={ex} className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{ex}</span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer */}
        <DialogFooter className="shrink-0 pt-3 border-t mt-2">
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
              : `Assign ${leads.length > 1 ? `${leads.length} Leads` : 'Lead'}`
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;
