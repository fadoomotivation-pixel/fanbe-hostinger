
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, RotateCcw, Ban, CheckCircle, Search, UserPlus } from 'lucide-react';
import { ROLES } from '@/lib/permissions';

const StaffManagementSubAdmin = () => {
  const { employees, addEmployee, updateEmployee, deleteEmployee } = useCRMData();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modals
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  
  const [selectedStaff, setSelectedStaff] = useState(null);
  
  // Form State
  const [formData, setFormData] = useState({ name: '', email: '', username: '', role: 'sales_executive' });
  const [resetPass, setResetPass] = useState('');

  // Filter out Super Admin and Current User (Sub Admin)
  const filteredStaff = employees.filter(emp => 
    emp.role !== ROLES.SUPER_ADMIN && 
    emp.id !== user.id &&
    (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    emp.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddSubmit = (e) => {
    e.preventDefault();
    const tempPass = Math.random().toString(36).slice(-8);
    
    addEmployee({
      ...formData,
      password: tempPass,
      status: 'Active',
      metrics: { totalLeads: 0, totalCalls: 0, connectedCalls: 0, conversionRate: 0 }
    });
    
    toast({ title: 'Staff Added', description: `Temp Password: ${tempPass}` });
    setIsAddOpen(false);
    setFormData({ name: '', email: '', username: '', role: 'sales_executive' });
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    
    updateEmployee(selectedStaff.id, formData);
    toast({ title: 'Staff Updated', description: 'Employee details saved.' });
    setIsEditOpen(false);
    setSelectedStaff(null);
  };

  const handleResetPassword = () => {
    if (!selectedStaff) return;
    const newPass = Math.random().toString(36).slice(-8);
    setResetPass(newPass);
    // In a real app, you'd hash this before storing
    updateEmployee(selectedStaff.id, { password: newPass });
  };
  
  const toggleStatus = (staff) => {
    const newStatus = staff.status === 'Active' ? 'Inactive' : 'Active';
    updateEmployee(staff.id, { status: newStatus });
    toast({ 
      title: `Status Changed`, 
      description: `${staff.name} is now ${newStatus}`,
      variant: newStatus === 'Active' ? 'default' : 'destructive'
    });
  };

  const handleDelete = () => {
     if(!selectedStaff) return;
     deleteEmployee(selectedStaff.id);
     toast({ title: 'Staff Deleted', variant: 'destructive' });
     setIsDeleteOpen(false);
     setSelectedStaff(null);
  };

  const openEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({ name: staff.name, email: staff.email, username: staff.username, role: staff.role });
    setIsEditOpen(true);
  };
  
  const openReset = (staff) => {
    setSelectedStaff(staff);
    setResetPass('');
    setIsResetOpen(true);
  };
  
  const openDelete = (staff) => {
    setSelectedStaff(staff);
    setIsDeleteOpen(true);
  };

  return (
    <div className="space-y-6">
       <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
           <h1 className="text-2xl font-bold text-[#0F3A5F]">Staff Management (Executive CRM)</h1>
           <p className="text-sm text-gray-500">Manage your team members</p>
         </div>
         <Button onClick={() => setIsAddOpen(true)} className="bg-[#0F3A5F]">
           <UserPlus className="mr-2 h-4 w-4" /> Add Staff Member
         </Button>
       </div>

       <div className="flex items-center gap-2 max-w-sm">
         <Search className="h-4 w-4 text-gray-400" />
         <Input 
           placeholder="Search staff..." 
           value={searchTerm}
           onChange={(e) => setSearchTerm(e.target.value)}
           className="h-9"
         />
       </div>

       <div className="bg-white rounded-lg shadow border">
         <Table>
           <TableHeader>
             <TableRow>
               <TableHead>Employee ID</TableHead>
               <TableHead>Name</TableHead>
               <TableHead>Username</TableHead>
               <TableHead>Role</TableHead>
               <TableHead>Status</TableHead>
               <TableHead className="text-right">Actions</TableHead>
             </TableRow>
           </TableHeader>
           <TableBody>
             {filteredStaff.map(staff => (
               <TableRow key={staff.id}>
                 <TableCell className="font-medium">{staff.id}</TableCell>
                 <TableCell>{staff.name}</TableCell>
                 <TableCell>{staff.username}</TableCell>
                 <TableCell className="capitalize">{staff.role.replace('_', ' ')}</TableCell>
                 <TableCell>
                   <span className={`px-2 py-1 rounded-full text-xs font-medium ${staff.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                     {staff.status}
                   </span>
                 </TableCell>
                 <TableCell className="text-right space-x-2">
                   <Button variant="ghost" size="icon" onClick={() => openEdit(staff)} title="Edit">
                     <Edit className="h-4 w-4 text-blue-600" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => openReset(staff)} title="Reset Password">
                     <RotateCcw className="h-4 w-4 text-orange-600" />
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => toggleStatus(staff)} title={staff.status === 'Active' ? 'Deactivate' : 'Activate'}>
                     {staff.status === 'Active' ? <Ban className="h-4 w-4 text-yellow-600" /> : <CheckCircle className="h-4 w-4 text-green-600" />}
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => openDelete(staff)} title="Delete">
                     <Trash2 className="h-4 w-4 text-red-600" />
                   </Button>
                 </TableCell>
               </TableRow>
             ))}
             {filteredStaff.length === 0 && (
               <TableRow>
                 <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                   No staff members found matching criteria.
                 </TableCell>
               </TableRow>
             )}
           </TableBody>
         </Table>
       </div>

       {/* Add Modal */}
       <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
         <DialogContent>
           <DialogHeader>
             <DialogTitle>Add New Staff Member</DialogTitle>
           </DialogHeader>
           <form onSubmit={handleAddSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label>Full Name</Label>
               <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Email</Label>
               <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Username</Label>
               <Input required value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Role</Label>
               <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="sales_executive">Sales Executive</SelectItem>
                   <SelectItem value="sub_admin">Executive CRM (Sub Admin)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <DialogFooter>
               <Button type="submit">Create Account</Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>

       {/* Edit Modal */}
       <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
         <DialogContent>
           <DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
           <form onSubmit={handleEditSubmit} className="space-y-4">
             <div className="space-y-2">
               <Label>Full Name</Label>
               <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Email</Label>
               <Input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
             </div>
             <div className="space-y-2">
               <Label>Role</Label>
               <Select value={formData.role} onValueChange={val => setFormData({...formData, role: val})}>
                 <SelectTrigger><SelectValue /></SelectTrigger>
                 <SelectContent>
                   <SelectItem value="sales_executive">Sales Executive</SelectItem>
                   <SelectItem value="sub_admin">Executive CRM (Sub Admin)</SelectItem>
                 </SelectContent>
               </Select>
             </div>
             <DialogFooter>
               <Button type="submit">Save Changes</Button>
             </DialogFooter>
           </form>
         </DialogContent>
       </Dialog>

       {/* Reset Password Modal */}
       <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
         <DialogContent>
           <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
           <div className="space-y-4">
              <p>Generate a new password for <strong>{selectedStaff?.name}</strong>?</p>
              {resetPass ? (
                <div className="bg-gray-100 p-4 rounded text-center">
                  <p className="text-sm text-gray-500">New Password:</p>
                  <p className="text-xl font-mono font-bold">{resetPass}</p>
                  <p className="text-xs text-red-500 mt-2">Copy this now. It won't be shown again.</p>
                </div>
              ) : (
                <Button onClick={handleResetPassword} className="w-full">Generate New Password</Button>
              )}
           </div>
           <DialogFooter>
             <Button variant="outline" onClick={() => setIsResetOpen(false)}>Close</Button>
           </DialogFooter>
         </DialogContent>
       </Dialog>
       
       {/* Delete Modal */}
       <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
          <DialogContent>
             <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
             <p>Are you sure you want to delete <strong>{selectedStaff?.name}</strong>? This action cannot be undone.</p>
             <DialogFooter>
               <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
               <Button variant="destructive" onClick={handleDelete}>Delete Permanently</Button>
             </DialogFooter>
          </DialogContent>
       </Dialog>
    </div>
  );
};

export default StaffManagementSubAdmin;
