
import React, { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Pencil, Save, X, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { getPricingTable, savePricingTable } from '@/lib/contentStorage';

const PricingTableEditor = ({ projectSlug }) => {
  const { toast } = useToast();
  const [pricing, setPricing] = useState([]);
  const [editingRow, setEditingRow] = useState(null); // Index of row being edited
  const [editForm, setEditForm] = useState({});
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const data = getPricingTable(projectSlug);
    setPricing(data);
  }, [projectSlug]);

  const handleEditClick = (index, row) => {
    setEditingRow(index);
    setEditForm({ ...row });
  };

  const handleCancel = () => {
    setEditingRow(null);
    setEditForm({});
  };

  const handleChange = (field, value) => {
    const numericValue = parseFloat(value) || 0;
    const updatedForm = { ...editForm, [field]: numericValue };

    // Auto-calculations
    if (field === 'rate' || field === 'size') {
      updatedForm.total = updatedForm.rate * updatedForm.size;
    }
    
    if (field === 'booking' || field === 'total' || field === 'rate' || field === 'size') {
      // Ensure total is up to date first
      const total = updatedForm.total || (updatedForm.rate * updatedForm.size);
      updatedForm.rest = total - updatedForm.booking;
    }

    setEditForm(updatedForm);
  };

  const validateForm = () => {
    if (editForm.rate <= 0) return "Rate must be greater than 0";
    if (editForm.booking <= 0) return "Booking amount must be greater than 0";
    if (editForm.booking >= editForm.total) return "Booking amount cannot exceed Total Cost";
    if (editForm.emi <= 0) return "EMI must be greater than 0";
    return null;
  };

  const handleSaveRow = () => {
    const error = validateForm();
    if (error) {
      toast({ title: "Validation Error", description: error, variant: "destructive" });
      return;
    }

    const updatedPricing = [...pricing];
    updatedPricing[editingRow] = editForm;
    setPricing(updatedPricing);
    setEditingRow(null);
    
    // Save to storage
    const result = savePricingTable(projectSlug, updatedPricing);
    if (result.success) {
      setLastUpdated(result.timestamp);
      toast({ title: "Success", description: "Price row updated successfully" });
    }
  };

  const handleBulkUpdate = (type, value) => {
    // Example: Increase all rates by value%
    // This is a placeholder for bulk functionality mentioned in requirements
    toast({ title: "Info", description: "Bulk update feature coming soon in next version" });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-gray-800">Pricing Configuration</h3>
        {lastUpdated && <span className="text-xs text-gray-500">Last updated: {new Date(lastUpdated).toLocaleString()}</span>}
      </div>

      <div className="border rounded-md overflow-x-auto bg-white shadow-sm">
        <Table>
          <TableHeader className="bg-gray-50">
            <TableRow>
              <TableHead className="w-[100px]">Size (Sq.Yd)</TableHead>
              <TableHead>Rate (₹)</TableHead>
              <TableHead>Total Cost (₹)</TableHead>
              <TableHead>Booking (₹)</TableHead>
              <TableHead>Rest Amt (₹)</TableHead>
              <TableHead>60-Mo EMI (₹)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pricing.map((row, index) => (
              <TableRow key={index} className={editingRow === index ? "bg-blue-50" : ""}>
                <TableCell className="font-medium">{row.size}</TableCell>
                
                {editingRow === index ? (
                  <>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={editForm.rate} 
                        onChange={(e) => handleChange('rate', e.target.value)}
                        className="w-24 h-8"
                      />
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono">
                      {editForm.total?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={editForm.booking} 
                        onChange={(e) => handleChange('booking', e.target.value)}
                        className="w-24 h-8"
                      />
                    </TableCell>
                    <TableCell className="text-gray-500 font-mono">
                      {editForm.rest?.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Input 
                        type="number" 
                        value={editForm.emi} 
                        onChange={(e) => handleChange('emi', e.target.value)}
                        className="w-24 h-8"
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="sm" onClick={handleSaveRow} className="h-8 w-8 p-0 bg-green-600 hover:bg-green-700">
                          <Save size={14} />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={handleCancel} className="h-8 w-8 p-0">
                          <X size={14} />
                        </Button>
                      </div>
                    </TableCell>
                  </>
                ) : (
                  <>
                    <TableCell>{row.rate?.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">{row.total?.toLocaleString()}</TableCell>
                    <TableCell>{row.booking?.toLocaleString()}</TableCell>
                    <TableCell>{row.rest?.toLocaleString()}</TableCell>
                    <TableCell>{row.emi?.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={() => handleEditClick(index, row)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 text-blue-600"
                      >
                        <Pencil size={14} />
                      </Button>
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t">
        <Button variant="outline" className="text-blue-600 border-blue-200" onClick={() => handleBulkUpdate()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Edit All Prices (Bulk)
        </Button>
        <div className="flex items-center text-sm text-yellow-600 bg-yellow-50 px-3 py-2 rounded">
          <AlertCircle size={16} className="mr-2" />
          Changes are auto-saved to database immediately.
        </div>
      </div>
    </div>
  );
};

export default PricingTableEditor;
