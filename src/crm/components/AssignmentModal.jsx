import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { getEmployeeStats, suggestEmployee } from '@/lib/smartAssignmentEngine';
import { Star, Briefcase, BarChart, Users } from 'lucide-react';

const AssignmentModal = ({ isOpen, onClose, leads = [], onAssign, employees = [] }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeStats, setEmployeeStats] = useState([]);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (isOpen && employees.length > 0) {
      const stats = getEmployeeStats(employees);
      setEmployeeStats(stats);
      if (leads.length > 0) {
        const bestFit = suggestEmployee(leads[0], stats);
        setSuggestion(bestFit);
        if (bestFit && !selectedEmployeeId) setSelectedEmployeeId(bestFit.id);
      }
    }
  }, [isOpen, employees, leads]);

  const handleAssign = () => {
    if (!selectedEmployeeId) return;
    const employee = employees.find(e => e.id === selectedEmployeeId);
    onAssign(selectedEmployeeId, employee?.name || 'Unknown');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      {/* ✅ FIX: fixed max-height + flex layout so footer is always visible */}
      <DialogContent className="max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Users size={18} className="text-blue-600" />
            Assign Lead{leads.length > 1 ? `s (${leads.length})` : ''}
          </DialogTitle>
        </DialogHeader>

        {/* ✅ FIX: scrollable middle section */}
        <div className="flex-1 overflow-y-auto space-y-4 py-2 pr-1">

          {/* Leads Count + Scrollable Names */}
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 mb-2 font-semibold">
              {leads.length} Lead{leads.length > 1 ? 's' : ''} selected
            </p>
            <div
              className="text-xs text-blue-600 overflow-y-auto"
              style={{ maxHeight: '80px' }}
            >
              {leads.map(l => l.name).join(', ')}
            </div>
          </div>

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
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-100"
                onClick={() => setSelectedEmployeeId(suggestion.id)}
              >
                Select
              </Button>
            </div>
          )}

          {/* Employee Dropdown */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Employee</label>
            <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose employee..." />
              </SelectTrigger>
              <SelectContent>
                {employeeStats.map(emp => (
                  <SelectItem key={emp.id} value={emp.id}>
                    <div className="flex items-center justify-between w-full min-w-[200px]">
                      <span>{emp.name}</span>
                      <div className="flex gap-2 text-xs text-gray-500 ml-3">
                        <span className="flex items-center">
                          <Briefcase size={10} className="mr-1" />{emp.currentLoad} leads
                        </span>
                        <span className="flex items-center">
                          <BarChart size={10} className="mr-1" />{emp.performanceScore}
                        </span>
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

        {/* ✅ FIX: footer always stays at bottom - never hidden */}
        <DialogFooter className="shrink-0 pt-3 border-t mt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancel</Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedEmployeeId}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Assign {leads.length > 1 ? `${leads.length} Leads` : 'Lead'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;
