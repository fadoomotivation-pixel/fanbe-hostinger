
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, Send } from 'lucide-react';

const EmailPreviewModal = ({ isOpen, onClose, onSend, recipient, subject, children, isSending }) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Email Preview</DialogTitle>
          <div className="text-sm text-gray-500 mt-2">
            <span className="font-bold">To:</span> {recipient} <br />
            <span className="font-bold">Subject:</span> {subject}
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto bg-gray-100 p-4 rounded-md my-4 border">
          {children}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSending}>Cancel</Button>
          <Button onClick={onSend} className="bg-[#0F3A5F]" disabled={isSending}>
            {isSending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}
            {isSending ? 'Sending...' : 'Confirm & Send'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EmailPreviewModal;
