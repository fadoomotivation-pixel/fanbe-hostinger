
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Search } from 'lucide-react';

const CustomerManagement = () => {
  const { customers } = useCRMData();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Customer Database</h1>

      <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium">
            <tr>
              <th className="p-4">Customer ID</th>
              <th className="p-4">Name</th>
              <th className="p-4">Project</th>
              <th className="p-4">Total Paid</th>
              <th className="p-4">Outstanding</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredCustomers.map(cust => (
              <tr key={cust.id} className="hover:bg-gray-50">
                <td className="p-4 text-gray-500 font-mono text-xs">{cust.id}</td>
                <td className="p-4">
                  <div className="font-bold text-[#0F3A5F]">{cust.name}</div>
                  <div className="text-xs text-gray-400">{cust.phone}</div>
                </td>
                <td className="p-4">{cust.bookedProject}</td>
                <td className="p-4 font-medium text-green-700">₹{cust.totalPaid.toLocaleString()}</td>
                <td className="p-4 font-medium text-red-600">₹{cust.outstandingAmount.toLocaleString()}</td>
                <td className="p-4"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{cust.status}</span></td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-gray-500">No customers found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomerManagement;
