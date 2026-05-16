import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { IndianRupee, Receipt, CheckCircle2 } from 'lucide-react';

// ── Token Amount Modal ────────────────────────────────────────────────
export const TokenAmountModal = ({ isOpen, onClose, onSave, lead }) => {
  const [tokenAmount, setTokenAmount] = useState('');
  const [tokenDate, setTokenDate] = useState(new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      alert('Please enter a valid token amount');
      return;
    }

    onSave({
      token_amount: parseFloat(tokenAmount),
      token_date: new Date(tokenDate).toISOString(),
      token_receipt_no: receiptNo,
      token_notes: notes,
      payment_status: 'token_received'
    });

    // Reset form
    setTokenAmount('');
    setTokenDate(new Date().toISOString().split('T')[0]);
    setReceiptNo('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-amber-600">
            <IndianRupee size={20} /> Record Token Amount
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            {lead?.name} • {lead?.phone}
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              Token Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="number"
                placeholder="10000"
                value={tokenAmount}
                onChange={e => setTokenAmount(e.target.value)}
                className="pl-9"
                min="0"
                step="1000"
              />
            </div>
            <p className="text-xs text-gray-500">Enter the token amount received from customer</p>
          </div>

          <div className="space-y-1.5">
            <Label>Token Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={tokenDate}
              onChange={e => setTokenDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Receipt size={14} /> Receipt Number (optional)
            </Label>
            <Input
              placeholder="e.g. TKN-2026-001"
              value={receiptNo}
              onChange={e => setReceiptNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Payment mode, bank details, or any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-800">
              <strong>Note:</strong> Recording token amount will update the lead status and add this to your sales performance.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!tokenAmount || parseFloat(tokenAmount) <= 0}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <IndianRupee size={16} className="mr-1" />
            Record Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// ── Booking Amount Modal ──────────────────────────────────────────────
export const BookingAmountModal = ({ isOpen, onClose, onSave, lead }) => {
  const [bookingAmount, setBookingAmount] = useState('');
  const [bookingDate, setBookingDate] = useState(new Date().toISOString().split('T')[0]);
  const [unit, setUnit] = useState('');
  const [receiptNo, setReceiptNo] = useState('');
  const [notes, setNotes] = useState('');

  const handleSave = () => {
    if (!bookingAmount || parseFloat(bookingAmount) <= 0) {
      alert('Please enter a valid booking amount');
      return;
    }

    onSave({
      booking_amount: parseFloat(bookingAmount),
      booking_date: new Date(bookingDate).toISOString(),
      booking_unit: unit,
      booking_receipt_no: receiptNo,
      booking_notes: notes,
      payment_status: 'booking_received',
      status: 'booked' // Update lead status to booked
    });

    // Reset form
    setBookingAmount('');
    setBookingDate(new Date().toISOString().split('T')[0]);
    setUnit('');
    setReceiptNo('');
    setNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md flex flex-col" style={{ maxHeight: '90vh' }}>
        <DialogHeader className="shrink-0">
          <DialogTitle className="flex items-center gap-2 text-green-600">
            <CheckCircle2 size={20} /> Record Booking Amount
          </DialogTitle>
          <p className="text-xs text-gray-500 mt-1">
            {lead?.name} • {lead?.phone}
          </p>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              Booking Amount (₹) <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <Input
                type="number"
                placeholder="500000"
                value={bookingAmount}
                onChange={e => setBookingAmount(e.target.value)}
                className="pl-9"
                min="0"
                step="10000"
              />
            </div>
            <p className="text-xs text-gray-500">Enter the full booking amount received</p>
          </div>

          <div className="space-y-1.5">
            <Label>Booking Date <span className="text-red-500">*</span></Label>
            <Input
              type="date"
              value={bookingDate}
              onChange={e => setBookingDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Unit / Plot Number <span className="text-red-500">*</span></Label>
            <Input
              placeholder="e.g. B-204, Plot 45, Tower A-302"
              value={unit}
              onChange={e => setUnit(e.target.value)}
            />
            <p className="text-xs text-gray-500">Property unit allocated to customer</p>
          </div>

          <div className="space-y-1.5">
            <Label className="flex items-center gap-1">
              <Receipt size={14} /> Receipt Number (optional)
            </Label>
            <Input
              placeholder="e.g. BKG-2026-001"
              value={receiptNo}
              onChange={e => setReceiptNo(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="Payment mode, installment details, or any additional notes..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Success Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-xs text-green-800">
              <strong>🎉 Congratulations!</strong> Recording booking amount will mark this lead as BOOKED and add to your sales performance.
            </p>
          </div>
        </div>

        <DialogFooter className="shrink-0 border-t pt-3">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSave} 
            disabled={!bookingAmount || parseFloat(bookingAmount) <= 0 || !unit}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle2 size={16} className="mr-1" />
            Confirm Booking
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
