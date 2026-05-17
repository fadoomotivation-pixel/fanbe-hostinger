
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Trash2, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const BulkDeleteModal = ({ isOpen, onClose, leads = [], onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedCount, setProcessedCount] = useState(0);
  const [isSuccess, setIsSuccess] = useState(false);
  const [failedLeads, setFailedLeads] = useState([]);
  const [error, setError] = useState(null);

  const handleDelete = async () => {
    setIsDeleting(true);
    setProgress(0);
    setProcessedCount(0);
    setFailedLeads([]);
    setError(null);
    
    const total = leads.length;
    const batchSize = 10;
    let currentProcessed = 0;
    
    try {
        for (let i = 0; i < total; i += batchSize) {
            // Create batch
            const batch = leads.slice(i, i + batchSize);
            const batchIds = batch.map(l => l.id);
            
            // Execute deletion for batch
            // We wrap in a small timeout to allow UI to repaint and prevent freezing on large lists
            await new Promise((resolve) => setTimeout(resolve, 100));
            
            try {
                await onDelete(batchIds);
                currentProcessed += batch.length;
                setProcessedCount(currentProcessed);
                setProgress(Math.round((currentProcessed / total) * 100));
            } catch (err) {
                console.error("Batch deletion failed", err);
                setFailedLeads(prev => [...prev, ...batch]);
            }
        }
        
        setIsSuccess(true);
        
        // Auto close only if fully successful
        if (failedLeads.length === 0) {
            setTimeout(() => {
                handleClose();
            }, 1500);
        }
    } catch (err) {
        setError("An unexpected error occurred during deletion.");
    } finally {
        // Keep isDeleting true if we want to show results, otherwise false to reset
        if (failedLeads.length > 0) {
            setIsDeleting(false); // Stop "loading" state to allow interaction
        }
    }
  };

  const handleClose = () => {
      setIsDeleting(false);
      setIsSuccess(false);
      setProgress(0);
      setProcessedCount(0);
      setFailedLeads([]);
      setError(null);
      onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!isDeleting && !isSuccess) handleClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 size={20} /> Delete {leads.length} Leads?
          </DialogTitle>
          <DialogDescription>
              This action cannot be undone. The selected leads will be permanently removed from the system.
          </DialogDescription>
        </DialogHeader>

        {!isSuccess && !isDeleting && failedLeads.length === 0 && (
            <ScrollArea className="h-[200px] w-full rounded-md border p-4 bg-gray-50">
                <div className="space-y-2">
                    {leads.map(lead => (
                        <div key={lead.id} className="flex justify-between text-sm items-center border-b pb-1 last:border-0">
                            <span className="font-medium">{lead.name}</span>
                            <span className="text-gray-500 text-xs">{lead.phone}</span>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        )}

        {(isDeleting || isSuccess) && (
            <div className="py-6 space-y-4">
                <div className="flex justify-between text-sm mb-2 font-medium">
                    <span>{isSuccess ? 'Deletion Complete' : 'Deleting leads...'}</span>
                    <span>{processedCount} / {leads.length}</span>
                </div>
                <Progress value={progress} className="h-2" />
                
                {isSuccess && failedLeads.length === 0 && (
                    <div className="flex items-center justify-center gap-2 text-green-600 font-bold animate-in fade-in pt-2">
                        <CheckCircle size={20} /> {leads.length} Leads Deleted Successfully!
                    </div>
                )}
            </div>
        )}

        {failedLeads.length > 0 && (
            <div className="space-y-3">
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-800 flex items-start gap-2">
                     <AlertTriangle size={16} className="mt-0.5" />
                     <div>
                         <span className="font-bold">Error:</span> {failedLeads.length} leads failed to delete.
                     </div>
                </div>
                <ScrollArea className="h-[100px] w-full rounded border p-2">
                     {failedLeads.map(l => (
                         <div key={l.id} className="text-xs text-red-600 flex justify-between">
                             <span>{l.name}</span>
                             <span>{l.phone}</span>
                         </div>
                     ))}
                </ScrollArea>
            </div>
        )}

        {!isDeleting && !isSuccess && failedLeads.length === 0 && (
            <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Cancel</Button>
                <Button variant="destructive" onClick={handleDelete}>Delete {leads.length} Leads</Button>
            </DialogFooter>
        )}
        
        {failedLeads.length > 0 && (
            <DialogFooter>
                <Button variant="outline" onClick={handleClose}>Close</Button>
                <Button variant="destructive" onClick={handleDelete}><RefreshCw size={14} className="mr-2"/> Retry Failed</Button>
            </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkDeleteModal;
