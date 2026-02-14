
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Edit2, Trash2, Plus, Search, Key } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import PasswordViewModal from '@/crm/components/PasswordViewModal';
import { ROLES } from '@/lib/permissions';

const SubAdminManagement = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState(null);
  const [passwordViewUser, setPasswordViewUser] = useState(null);
  
  const [formData, setFormData] = useState({ name: '', city: '', mobile: '', email: '', password: 'password123', role: ROLES.SUB_ADMIN });

  // Filter only Sub Admins
  const filteredAdmins = employees.filter(emp => 
    emp.role === ROLES.SUB_ADMIN &&
    (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenModal = (emp = null) => {
    if (emp) {
      setEditingEmp(emp);
      setFormData({ 
        name: emp.name, 
        city: emp.city, 
        mobile: emp.mobile, 
        email: emp.email || '',
        password: '',
        role: ROLES.SUB_ADMIN
      });
    } else {
      setEditingEmp(null);
      setFormData({ name: '', city: '', mobile: '', email: '', password: 'ChangeMe123!', role: ROLES.SUB_ADMIN });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingEmp) {
      updateEmployee(editingEmp.id, formData);
      toast({ title: 'Updated', description: 'Executive CRM updated successfully' });
    } else {
      addEmployee({
        ...formData,
        role: ROLES.SUB_ADMIN,
        username: formData.email.split('@')[0],
        status: 'Active'
      });
      toast({ title: 'Added', description: 'New Executive CRM added successfully' });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm('Delete this Executive CRM?')) {
      deleteEmployee(id);
      toast({ title: 'Deleted', description: 'Record removed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Executive CRM Management</h1>
          <p className="text-gray-500">Manage regional managers and executive admins.</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="bg-[#0F3A5F] hover:bg-[#0a2742]">
          <Plus size={16} className="mr-2" /> Create Executive CRM
        </Button>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <input
            placeholder="Search executives..."
            className="w-full pl-9 pr-4 py-2 border rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b text-sm text-gray-500">
          Showing {filteredAdmins.length} Executives
        </div>
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-700 font-medium border-b">
            <tr>
              <th className="p-4">Name & Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredAdmins.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50">
                <td className="p-4">
                  <div className="font-medium text-[#0F3A5F]">{emp.name}</div>
                  <div className="text-xs text-gray-400">{emp.email}</div>
                </td>
                <td className="p-4">Executive CRM</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${emp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {emp.status}
                  </span>
                </td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => setPasswordViewUser(emp)} className="p-1 hover:bg-gray-200 rounded text-gray-600" title="View Password"><Key size={16} /></button>
                  <button onClick={() => handleOpenModal(emp)} className="p-1 hover:bg-gray-200 rounded text-blue-600"><Edit2 size={16} /></button>
                  <button onClick={() => handleDelete(emp.id)} className="p-1 hover:bg-gray-200 rounded text-red-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
            {filteredAdmins.length === 0 && (
               <tr><td colSpan="4" className="p-8 text-center text-gray-500">No executives found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingEmp ? 'Edit Executive CRM' : 'Add New Executive CRM'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label>Name</label><input className="w-full p-2 border rounded" required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
            <div><label>Email</label><input type="email" className="w-full p-2 border rounded" required value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
            <div><label>Mobile</label><input className="w-full p-2 border rounded" required value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} /></div>
            <div><label>City</label><input className="w-full p-2 border rounded" required value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} /></div>
            {!editingEmp && (
              <div><label>Initial Password</label><input className="w-full p-2 border rounded" required value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} /></div>
            )}
            <Button type="submit" className="w-full">{editingEmp ? 'Update' : 'Create'}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <PasswordViewModal 
        isOpen={!!passwordViewUser} 
        onClose={() => setPasswordViewUser(null)} 
        userToView={passwordViewUser} 
      />
    </div>
  );
};

export default SubAdminManagement;
