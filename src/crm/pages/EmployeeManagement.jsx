
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Trash2, Key, MoreHorizontal, Plus, CheckCircle, XCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DeleteEmployeeModal from '@/crm/components/DeleteEmployeeModal';
import ResetPasswordModal from '@/crm/components/ResetPasswordModal';
import EmployeeCredentialsModal from '@/crm/components/EmployeeCredentialsModal';
import {
  createEmployee,
  deleteUser,
  generateRandomPassword,
  getAllUsers,
  toggleUserStatus
} from '@/lib/authUtilsSupabase';

const EmployeeManagement = () => {
  const { toast } = useToast();
  
  // State
  const [employees, setEmployees] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [createdEmployee, setCreatedEmployee] = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  
  // Form State
  const [newEmployee, setNewEmployee] = useState({ 
      firstName: '', lastName: '', email: '', phone: '', role: '', username: '', sendEmail: true 
  });
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle, valid, invalid, taken

  // Load users from Supabase
  useEffect(() => {
      loadEmployees();
  }, []);

  const loadEmployees = async () => {
    const users = await getAllUsers();
    const mappedUsers = users.map((user) => ({
      id: user.id,
      name: user.name,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status || 'Active',
      lastLogin: user.lastLogin || 'Never'
    }));

    setEmployees(mappedUsers);
  };

  const generatePassword = () => {
    return generateRandomPassword();
  };

  const validateUsername = (u) => {
      if(!u) return false;
      const regex = /^[a-zA-Z0-9]{5,20}$/;
      return regex.test(u);
  };

  const handleUsernameChange = (val) => {
      const u = val.toLowerCase().replace(/[^a-z0-9]/g, '');
      setNewEmployee(prev => ({ ...prev, username: u }));
      
      if (!validateUsername(u)) {
          setUsernameStatus('invalid_format');
          return;
      }
      
      const exists = employees.some(e => e.username === u);
      setUsernameStatus(exists ? 'taken' : 'valid');
  };

  const autoGenerateUsername = (first, last) => {
      if (!first || !last) return;
      const base = (first + last).toLowerCase().replace(/[^a-z0-9]/g, '');
      handleUsernameChange(base);
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.role || usernameStatus !== 'valid') {
        toast({ title: "Validation Error", description: "Please fill all fields and ensure username is valid.", variant: "destructive" });
        return;
    }
    
    const employeeEmail = (newEmployee.email || `${newEmployee.username}@fanbegroup.com`).toLowerCase();

    if (employees.some(e => (e.email || '').toLowerCase() === employeeEmail)) {
        toast({ title: "Duplicate Email", description: "This email is already in use.", variant: "destructive" });
        return;
    }
    
    const password = generatePassword();

    const result = await createEmployee({
      name: `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
      username: newEmployee.username,
      email: employeeEmail,
      role: newEmployee.role,
      password,
      phone: newEmployee.phone,
      department: 'Sales'
    });

    if (!result.success) {
      toast({ title: "Failed to create employee", description: result.message, variant: "destructive" });
      return;
    }

    const newEntry = {
      id: result.userId,
      name: `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
      username: result.username || newEmployee.username,
      email: result.email || employeeEmail,
      phone: newEmployee.phone || '',
      role: newEmployee.role,
      status: 'Active',
      lastLogin: 'Never'
    };

    setEmployees((prev) => [newEntry, ...prev]);
    setCreatedEmployee(newEntry);
    setCreatedCredentials({ password });
    setIsAddModalOpen(false);
    setIsCredentialsModalOpen(true);

    toast({
      title: '✅ Employee Created Successfully!',
      description: `Username: ${newEntry.username}\nPassword: ${password}\n\n⚠️ SAVE THIS PASSWORD!`,
      duration: 20000
    });

    setNewEmployee({ firstName: '', lastName: '', email: '', phone: '', role: '', username: '', sendEmail: true });
    setUsernameStatus('idle');
  };

  const handleDeleteEmployeeSuccess = async (id) => {
    const result = await deleteUser(id);
    if (!result.success) {
      toast({ title: 'Delete failed', description: result.message, variant: 'destructive' });
      return;
    }

    const updatedList = employees.filter(s => s.id !== id);
    setEmployees(updatedList);
    toast({ title: "Employee Deleted", description: "Employee removed from Supabase profiles." });
    setIsDeleteModalOpen(false);
  };

  const handlePasswordResetSuccess = () => {
    toast({ title: 'Password reset requested', description: 'Password has been updated.' });
  };

  const handleToggleStatus = async (id) => {
    const result = await toggleUserStatus(id);
    if (!result.success) {
      toast({ title: 'Update failed', description: result.message, variant: 'destructive' });
      return;
    }

    const updatedList = employees.map(s => s.id === id ? { ...s, status: result.status } : s);
    setEmployees(updatedList);
    toast({ title: "Updated", description: "Employee status updated successfully" });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500">Manage employees, roles, and access.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto"><Plus className="mr-2" size={16} /> Add New Employee</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Employee</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>First Name</Label>
                <Input 
                    value={newEmployee.firstName} 
                    onChange={e => {
                        setNewEmployee({...newEmployee, firstName: e.target.value});
                        if(newEmployee.lastName) autoGenerateUsername(e.target.value, newEmployee.lastName);
                    }} 
                />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input 
                    value={newEmployee.lastName} 
                    onChange={e => {
                        setNewEmployee({...newEmployee, lastName: e.target.value});
                        if(newEmployee.firstName) autoGenerateUsername(newEmployee.firstName, e.target.value);
                    }} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newEmployee.email} onChange={e => setNewEmployee({...newEmployee, email: e.target.value})} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newEmployee.phone} onChange={e => setNewEmployee({...newEmployee, phone: e.target.value})} />
              </div>

              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={v => setNewEmployee({...newEmployee, role: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sales_executive">Sales Executive</SelectItem>
                    <SelectItem value="sales_manager">Sales Manager</SelectItem>
                    <SelectItem value="super_admin">Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Username <span className="text-xs font-normal text-gray-500">(Auto-suggested)</span></Label>
                <div className="relative">
                    <Input 
                        value={newEmployee.username} 
                        onChange={e => handleUsernameChange(e.target.value)} 
                        className={usernameStatus === 'valid' ? 'border-green-500 pr-8' : usernameStatus === 'taken' || usernameStatus === 'invalid_format' ? 'border-red-500 pr-8' : ''}
                    />
                    {usernameStatus === 'valid' && <CheckCircle size={16} className="text-green-500 absolute right-3 top-3" />}
                    {(usernameStatus === 'taken' || usernameStatus === 'invalid_format') && <XCircle size={16} className="text-red-500 absolute right-3 top-3" />}
                </div>
                {usernameStatus === 'taken' && <p className="text-[10px] text-red-500">Username already taken.</p>}
                {usernameStatus === 'invalid_format' && <p className="text-[10px] text-red-500">5-20 chars, alphanumeric only.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEmployee} disabled={usernameStatus !== 'valid'}>Create Account</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead className="hidden md:table-cell">Username</TableHead>
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-gray-500">No employees found. Add one to get started.</TableCell></TableRow>
                ) : (
                    employees.map((employee) => (
                    <TableRow key={employee.id}>
                        <TableCell>
                        <div>
                            <p className="font-medium text-gray-900">{employee.name}</p>
                            <p className="text-xs text-gray-500">{employee.email}</p>
                            <p className="text-xs text-gray-500 md:hidden">{employee.phone}</p>
                        </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell font-mono text-xs">{employee.username}</TableCell>
                        <TableCell className="hidden md:table-cell">{employee.role}</TableCell>
                        <TableCell className="hidden md:table-cell">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {employee.status}
                        </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-sm text-gray-500">{employee.lastLogin}</TableCell>
                        <TableCell className="text-right">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => { setSelectedEmployee(employee); setIsResetModalOpen(true); }}>
                                <Key className="mr-2 h-4 w-4" /> Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(employee.id)}>
                                {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => { setSelectedEmployee(employee); setIsDeleteModalOpen(true); }}>
                                <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Reset Password Dialog */}
      <ResetPasswordModal 
          isOpen={isResetModalOpen}
          onClose={() => setIsResetModalOpen(false)}
          employee={selectedEmployee}
          onResetSuccess={handlePasswordResetSuccess}
      />
      
      {/* Delete Confirmation Modal */}
      <DeleteEmployeeModal 
         isOpen={isDeleteModalOpen} 
         onClose={() => setIsDeleteModalOpen(false)} 
         employee={selectedEmployee}
         onDeleteSuccess={handleDeleteEmployeeSuccess}
      />
      
      {/* Credentials Modal (Success creation) */}
      <EmployeeCredentialsModal 
        isOpen={isCredentialsModalOpen}
        onClose={() => setIsCredentialsModalOpen(false)}
        employee={createdEmployee}
        credentials={createdCredentials}
      />
    </div>
  );
};

export default EmployeeManagement;
