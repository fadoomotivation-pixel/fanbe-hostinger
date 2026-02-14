
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Trash2, CheckCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useCRMData } from '@/crm/hooks/useCRMData';

const DeleteEmployeeModal = ({ isOpen, onClose, employee, onDeleteSuccess }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const { leads, updateLead } = useCRMData();

  if (!employee) return null;

  const handleDelete = async () => {
      setIsProcessing(true);
      setProgress(10);
      
      // 1. Unassign Leads
      const empLeads = leads.filter(l => l.assignedTo === employee.id);
      const totalSteps = empLeads.length + 2; // +2 for archive perf and delete user
      let completed = 0;

      // Simulate batch processing
      for (const lead of empLeads) {
          updateLead(lead.id, { assignedTo: null, assignedToName: null, assignmentDate: null });
          completed++;
          setProgress(10 + Math.floor((completed / totalSteps) * 80));
          await new Promise(r => setTimeout(r, 50)); // Simulated delay
      }

      // 2. Archive Performance (Mock)
      await new Promise(r => setTimeout(r, 300));
      setProgress(95);

      // 3. Delete User
      if (onDeleteSuccess) onDeleteSuccess(employee.id);
      
      setProgress(100);
      setTimeout(() => {
          setIsProcessing(false);
          onClose();
      }, 500);
  };

  const isProtected = ['super_admin', 'sub_admin'].includes(employee.role) || employee.role === 'Executive CRM';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!isProcessing) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle size={20} /> Delete Employee: {employee.name}?
          </DialogTitle>
          <DialogDescription className="pt-2">
              This action cannot be undone. Please review the consequences below.
          </DialogDescription>
        </DialogHeader>

        {!isProcessing ? (
            <div className="bg-red-50 border border-red-100 rounded-md p-4 space-y-3 text-sm text-red-800">
                <p className="font-semibold">What will happen:</p>
                <ul className="list-disc list-inside space-y-1 ml-1">
                    <li>Account access will be immediately revoked.</li>
                    <li><strong>{leads.filter(l => l.assignedTo === employee.id).length} assigned leads</strong> will be unassigned.</li>
                    <li>All pending tasks will be reassigned or archived.</li>
                    <li>Performance data will be archived.</li>
                </ul>
                {isProtected && (
                    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded text-sm text-yellow-800 font-medium mt-2">
                        Note: Super Admins and Executive CRMs cannot be deleted via this console for security reasons.
                    </div>
                )}
            </div>
        ) : (
            <div className="py-8 space-y-4 text-center">
                <div className="flex justify-between text-sm font-medium mb-1">
                    <span>Deleting employee data...</span>
                    <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-gray-500">Unassigning leads and archiving records...</p>
            </div>
        )}

        {!isProcessing && (
            <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button 
                variant="destructive" 
                onClick={handleDelete} 
                disabled={isProcessing || isProtected}
            >
                <Trash2 className="w-4 h-4 mr-2" /> Delete Employee
            </Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default DeleteEmployeeModal;
