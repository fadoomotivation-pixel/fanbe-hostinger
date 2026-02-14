
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getEmployeeStats, suggestEmployee } from '@/lib/smartAssignmentEngine';
import { Star, Briefcase, BarChart } from 'lucide-react';

const AssignmentModal = ({ isOpen, onClose, leads = [], onAssign, employees = [] }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [employeeStats, setEmployeeStats] = useState([]);
  const [suggestion, setSuggestion] = useState(null);

  useEffect(() => {
    if (isOpen && employees.length > 0) {
        const stats = getEmployeeStats(employees);
        setEmployeeStats(stats);
        
        // Suggest for the first lead if multiple, or specific if single
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Lead{leads.length > 1 ? 's' : ''}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 mb-1 font-semibold">Leads to Assign: {leads.length}</p>
                <div className="text-xs text-blue-600 truncate">
                    {leads.map(l => l.name).join(', ')}
                </div>
            </div>

            {suggestion && (
                <div className="flex items-center justify-between p-3 bg-green-50 border border-green-100 rounded-lg">
                    <div className="flex items-center gap-2">
                        <div className="bg-green-100 p-1 rounded-full"><Star size={12} className="text-green-600" /></div>
                        <div>
                            <p className="text-xs font-bold text-green-800">Smart Suggestion</p>
                            <p className="text-sm text-green-900">{suggestion.name}</p>
                        </div>
                    </div>
                    <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 text-xs border-green-200 text-green-700 hover:bg-green-100 hover:text-green-800"
                        onClick={() => setSelectedEmployeeId(suggestion.id)}
                    >
                        Select
                    </Button>
                </div>
            )}

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
                                    <div className="flex gap-2 text-xs text-gray-500">
                                        <span className="flex items-center"><Briefcase size={10} className="mr-1"/> {emp.currentLoad} leads</span>
                                        <span className="flex items-center"><BarChart size={10} className="mr-1"/> {emp.performanceScore}</span>
                                    </div>
                                </div>
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            
            {/* Employee Details Card */}
            {selectedEmployeeId && (
                <div className="p-3 border rounded-lg bg-gray-50 space-y-2">
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500">Current Workload</span>
                         <Badge variant="outline" className="bg-white">{employeeStats.find(e => e.id === selectedEmployeeId)?.currentLoad} Leads</Badge>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500">Performance Rating</span>
                         <div className="flex text-yellow-500 text-xs">
                             <Star size={12} fill="currentColor" />
                             <span className="ml-1 text-gray-700">{employeeStats.find(e => e.id === selectedEmployeeId)?.performanceScore} / 5.0</span>
                         </div>
                     </div>
                     <div className="flex justify-between items-center">
                         <span className="text-xs text-gray-500">Expertise</span>
                         <div className="flex gap-1">
                            {employeeStats.find(e => e.id === selectedEmployeeId)?.expertise.map(ex => (
                                <span key={ex} className="text-[10px] bg-gray-200 px-1 rounded text-gray-600">{ex}</span>
                            ))}
                         </div>
                     </div>
                </div>
            )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleAssign} disabled={!selectedEmployeeId}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;
