
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

const InvoiceManagement = () => {
  const { invoices, customers, createInvoice, recordPayment } = useCRMData();
  const { toast } = useToast();
  
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Forms
  const [newInv, setNewInv] = useState({ customerId: '', amount: '', type: 'EMI Installment', dueDate: '' });
  const [payData, setPayData] = useState({ amount: '', method: 'Online' });

  const handleCreateInvoice = () => {
    if (!newInv.customerId || !newInv.amount) return;
    const cust = customers.find(c => c.id === newInv.customerId);
    createInvoice({ ...newInv, customerName: cust.name });
    setCreateModalOpen(false);
    toast({ title: 'Invoice Created' });
  };

  const handleRecordPayment = () => {
    if (!payData.amount) return;
    recordPayment({ ...payData, invoiceId: selectedInvoice.id, customerId: selectedInvoice.customerId });
    setPaymentModalOpen(false);
    toast({ title: 'Payment Recorded', description: 'Updated invoice and customer balance.' });
  };

  const getStatusColor = (status) => {
    if (status === 'Paid') return 'text-green-600 bg-green-100';
    if (status === 'Overdue') return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Invoices & Payments</h1>
        <Button onClick={() => setCreateModalOpen(true)} className="bg-[#0F3A5F]"><Plus className="mr-2 h-4 w-4"/> Create Invoice</Button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium">
             <tr>
               <th className="p-4">Invoice ID</th>
               <th className="p-4">Customer</th>
               <th className="p-4">Type</th>
               <th className="p-4">Amount</th>
               <th className="p-4">Due Date</th>
               <th className="p-4">Status</th>
               <th className="p-4 text-right">Actions</th>
             </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map(inv => (
              <tr key={inv.id} className="hover:bg-gray-50">
                <td className="p-4 font-mono text-xs">{inv.id}</td>
                <td className="p-4 font-medium">{inv.customerName}</td>
                <td className="p-4">{inv.type}</td>
                <td className="p-4">₹{inv.amount.toLocaleString()}</td>
                <td className="p-4">{new Date(inv.dueDate).toLocaleDateString()}</td>
                <td className="p-4"><span className={`px-2 py-1 rounded text-xs font-bold ${getStatusColor(inv.status)}`}>{inv.status}</span></td>
                <td className="p-4 text-right">
                  {inv.status !== 'Paid' && (
                    <Button size="sm" variant="outline" onClick={() => { setSelectedInvoice(inv); setPaymentModalOpen(true); }}>Record Pay</Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create Invoice Modal */}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
          <div className="space-y-4">
             <div>
               <Label>Customer</Label>
               <select className="w-full p-2 border rounded" value={newInv.customerId} onChange={e => setNewInv({...newInv, customerId: e.target.value})}>
                 <option value="">Select Customer</option>
                 {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.bookedProject}</option>)}
               </select>
             </div>
             <div><Label>Amount</Label><Input type="number" value={newInv.amount} onChange={e => setNewInv({...newInv, amount: e.target.value})} /></div>
             <div>
               <Label>Type</Label>
               <select className="w-full p-2 border rounded" value={newInv.type} onChange={e => setNewInv({...newInv, type: e.target.value})}>
                 <option>Token Payment</option><option>EMI Installment</option><option>Final Payment</option>
               </select>
             </div>
             <div><Label>Due Date</Label><Input type="date" value={newInv.dueDate} onChange={e => setNewInv({...newInv, dueDate: e.target.value})} /></div>
             <Button onClick={handleCreateInvoice} className="w-full">Generate Invoice</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Record Payment for {selectedInvoice?.id}</DialogTitle></DialogHeader>
          <div className="space-y-4">
             <div className="text-sm bg-gray-50 p-2 rounded">
               <strong>Customer:</strong> {selectedInvoice?.customerName}<br/>
               <strong>Total Due:</strong> ₹{selectedInvoice?.amount}
             </div>
             <div><Label>Amount Paid</Label><Input type="number" value={payData.amount} onChange={e => setPayData({...payData, amount: e.target.value})} /></div>
             <div>
               <Label>Method</Label>
               <select className="w-full p-2 border rounded" value={payData.method} onChange={e => setPayData({...payData, method: e.target.value})}>
                 <option>Online</option><option>Cash</option><option>Cheque</option><option>Bank Transfer</option>
               </select>
             </div>
             <Button onClick={handleRecordPayment} className="w-full bg-green-600 hover:bg-green-700">Confirm Payment</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InvoiceManagement;
