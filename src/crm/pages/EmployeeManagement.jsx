import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Edit2, Trash2, Key, MoreHorizontal, Plus, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import DeleteEmployeeModal from '@/crm/components/DeleteEmployeeModal';
import ResetPasswordModal from '@/crm/components/ResetPasswordModal';
import EmployeeCredentialsModal from '@/crm/components/EmployeeCredentialsModal';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { supabaseAdmin } from '@/lib/supabase';
import { addUser, getAllUsers, toggleUserStatus, deleteUser, generateRandomPassword } from '@/lib/authUtilsSupabase';

const ROLES = [
  { value: 'sales_executive', label: 'Sales Executive' },
  { value: 'telecaller',      label: 'Telecaller'      },
  { value: 'manager',         label: 'Manager'         },
];

const EmployeeManagement = () => {
  const { toast } = useToast();
  const { addAuditLog } = useCRMData();

  const [employees, setEmployees]                       = useState([]);
  const [loading, setLoading]                           = useState(true);
  const [submitting, setSubmitting]                     = useState(false);
  const [isAddModalOpen, setIsAddModalOpen]             = useState(false);
  const [isEditModalOpen, setIsEditModalOpen]           = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen]       = useState(false);
  const [isResetModalOpen, setIsResetModalOpen]         = useState(false);
  const [isCredentialsModalOpen, setIsCredentialsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee]         = useState(null);
  const [createdEmployee, setCreatedEmployee]           = useState(null);
  const [createdCredentials, setCreatedCredentials]     = useState(null);

  // Add form
  const [newEmployee, setNewEmployee] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '', username: '',
  });
  const [usernameStatus, setUsernameStatus] = useState('idle');

  // Edit form
  const [editForm, setEditForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', role: '',
  });

  useEffect(() => { fetchEmployees(); }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const users = await getAllUsers();
      setEmployees(users.filter(u => u.role !== 'super_admin'));
    } catch (err) {
      console.error('[EmployeeManagement] fetchEmployees error:', err);
      toast({ title: 'Error', description: 'Could not load employees.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  // ── Username helpers ───────────────────────────────────────────────
  const validateUsername = (u) => /^[a-zA-Z0-9]{5,20}$/.test(u);

  const handleUsernameChange = (val) => {
    const u = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setNewEmployee(prev => ({ ...prev, username: u }));
    if (!validateUsername(u)) { setUsernameStatus('invalid_format'); return; }
    const taken = employees.some(e => e.username === u);
    setUsernameStatus(taken ? 'taken' : 'valid');
  };

  const autoGenerateUsername = (first, last) => {
    if (!first || !last) return;
    handleUsernameChange((first + last).toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  // ── Open Edit dialog pre-filled ────────────────────────────────────
  const openEditDialog = (emp) => {
    const parts = (emp.name || '').split(' ');
    setEditForm({
      firstName: parts[0] || '',
      lastName:  parts.slice(1).join(' ') || '',
      email:     emp.email  || '',
      phone:     emp.phone  || '',
      role:      emp.role   || '',
    });
    setSelectedEmployee(emp);
    setIsEditModalOpen(true);
  };

  // ── Save edit → Supabase profiles ─────────────────────────────────
  const handleEditEmployee = async () => {
    if (!editForm.firstName || !editForm.email || !editForm.role) {
      toast({ title: 'Validation Error', description: 'First name, email and role are required.', variant: 'destructive' });
      return;
    }
    // Check if new email is taken by a DIFFERENT employee
    const emailTaken = employees.some(
      e => e.email === editForm.email && e.id !== selectedEmployee.id
    );
    if (emailTaken) {
      toast({ title: 'Duplicate Email', description: 'This email is already used by another employee.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const updatedName = `${editForm.firstName} ${editForm.lastName}`.trim();
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          name:       updatedName,
          email:      editForm.email,
          phone:      editForm.phone  || '',
          role:       editForm.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedEmployee.id);

      if (error) throw error;

      toast({ title: '✅ Employee Updated', description: `${updatedName}'s details have been saved.` });
      addAuditLog({ action: 'Employee Updated', target: selectedEmployee.username, details: `Role: ${editForm.role}` });
      setIsEditModalOpen(false);
      await fetchEmployees();
    } catch (err) {
      console.error('[EmployeeManagement] editEmployee error:', err);
      toast({ title: 'Update Failed', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Add employee → Supabase ────────────────────────────────────────
  const handleAddEmployee = async () => {
    if (!newEmployee.firstName || !newEmployee.email || !newEmployee.role || usernameStatus !== 'valid') {
      toast({ title: 'Validation Error', description: 'Please fill all required fields and ensure username is valid.', variant: 'destructive' });
      return;
    }
    if (employees.some(e => e.email === newEmployee.email)) {
      toast({ title: 'Duplicate Email', description: 'This email is already in use.', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const password = generateRandomPassword();
      const result = await addUser({
        username:   newEmployee.username,
        name:       `${newEmployee.firstName} ${newEmployee.lastName}`.trim(),
        email:      newEmployee.email,
        phone:      newEmployee.phone,
        role:       newEmployee.role,
        password,
        department: 'Sales',
      });

      if (!result.success) {
        toast({ title: 'Error Creating Employee', description: result.message, variant: 'destructive' });
        return;
      }

      toast({ title: '✅ Employee Created', description: `${result.user.name} has been added.` });
      addAuditLog({ action: 'Employee Created', target: newEmployee.username, details: 'Created via admin panel' });
      setCreatedEmployee(result.user);
      setCreatedCredentials({ password });
      setIsAddModalOpen(false);
      setIsCredentialsModalOpen(true);
      setNewEmployee({ firstName: '', lastName: '', email: '', phone: '', role: '', username: '' });
      setUsernameStatus('idle');
      await fetchEmployees();
    } catch (err) {
      toast({ title: 'Unexpected Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────
  const handleDeleteEmployeeSuccess = async (id) => {
    const result = await deleteUser(id);
    if (!result.success) {
      toast({ title: 'Delete Failed', description: result.message, variant: 'destructive' });
      return;
    }
    addAuditLog({ action: 'Employee Deleted', target: id, details: 'Deleted via admin panel' });
    toast({ title: 'Employee Deleted' });
    setIsDeleteModalOpen(false);
    await fetchEmployees();
  };

  // ── Toggle status ──────────────────────────────────────────────────
  const handleToggleStatus = async (id) => {
    const result = await toggleUserStatus(id);
    if (!result.success) {
      toast({ title: 'Status Update Failed', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Status Updated', description: `Employee is now ${result.status}.` });
    await fetchEmployees();
  };

  const handlePasswordResetSuccess = async () => {
    addAuditLog({ action: 'Password Reset', details: 'Reset via admin panel' });
    await fetchEmployees();
  };

  const getRoleLabel = (roleValue) =>
    ROLES.find(r => r.value === roleValue)?.label || roleValue;

  // ──────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Employee Management</h1>
          <p className="text-gray-500">Manage employees, roles, and access.</p>
        </div>

        {/* ── ADD EMPLOYEE DIALOG ── */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto">
              <Plus className="mr-2" size={16} /> Add New Employee
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Add New Employee</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label>First Name *</Label>
                <Input value={newEmployee.firstName} onChange={e => {
                  setNewEmployee({ ...newEmployee, firstName: e.target.value });
                  if (newEmployee.lastName) autoGenerateUsername(e.target.value, newEmployee.lastName);
                }} />
              </div>
              <div className="space-y-2">
                <Label>Last Name</Label>
                <Input value={newEmployee.lastName} onChange={e => {
                  setNewEmployee({ ...newEmployee, lastName: e.target.value });
                  if (newEmployee.firstName) autoGenerateUsername(newEmployee.firstName, e.target.value);
                }} />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input value={newEmployee.email} onChange={e => setNewEmployee({ ...newEmployee, email: e.target.value })} type="email" />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input value={newEmployee.phone} onChange={e => setNewEmployee({ ...newEmployee, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Role *</Label>
                <Select onValueChange={v => setNewEmployee({ ...newEmployee, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Username <span className="text-xs font-normal text-gray-500">(Auto-suggested)</span></Label>
                <div className="relative">
                  <Input
                    value={newEmployee.username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    className={
                      usernameStatus === 'valid'   ? 'border-green-500 pr-8' :
                      usernameStatus === 'taken' || usernameStatus === 'invalid_format' ? 'border-red-500 pr-8' : ''
                    }
                  />
                  {usernameStatus === 'valid'   && <CheckCircle size={16} className="text-green-500 absolute right-3 top-3" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid_format') && <XCircle size={16} className="text-red-500 absolute right-3 top-3" />}
                </div>
                {usernameStatus === 'taken'          && <p className="text-[10px] text-red-500">Username already taken.</p>}
                {usernameStatus === 'invalid_format' && <p className="text-[10px] text-red-500">5–20 chars, alphanumeric only.</p>}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddEmployee} disabled={usernameStatus !== 'valid' || submitting}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating…</> : 'Create Account'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* ── EDIT EMPLOYEE DIALOG ── */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Employee — {selectedEmployee?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label>First Name *</Label>
              <Input value={editForm.firstName} onChange={e => setEditForm({ ...editForm, firstName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Last Name</Label>
              <Input value={editForm.lastName} onChange={e => setEditForm({ ...editForm, lastName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email *</Label>
              <Input value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} type="email" />
            </div>
            <div className="space-y-2">
              <Label>Phone</Label>
              <Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div className="space-y-2 col-span-2">
              <Label>Role *</Label>
              <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
                <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <p className="col-span-2 text-xs text-gray-400">
              ⚠️ Username and password cannot be changed here. Use Reset Password for password changes.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>Cancel</Button>
            <Button onClick={handleEditEmployee} disabled={submitting}>
              {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving…</> : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── TABLE ── */}
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
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10">
                      <Loader2 className="animate-spin mx-auto text-gray-400" size={28} />
                      <p className="text-gray-400 mt-2 text-sm">Loading from Supabase…</p>
                    </TableCell>
                  </TableRow>
                ) : employees.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      No employees found. Add one to get started.
                    </TableCell>
                  </TableRow>
                ) : employees.map(employee => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                        <p className="text-xs text-gray-400 md:hidden">{employee.phone}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-mono text-xs">{employee.username}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700">
                        {getRoleLabel(employee.role)}
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        employee.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {employee.status}
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-gray-500">
                      {employee.last_login
                        ? new Date(employee.last_login).toLocaleDateString('en-IN')
                        : 'Never'}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon"><MoreHorizontal size={16} /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          {/* ✅ NEW: Edit Employee */}
                          <DropdownMenuItem onClick={() => openEditDialog(employee)}>
                            <Edit2 className="mr-2 h-4 w-4" /> Edit Details
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => { setSelectedEmployee(employee); setIsResetModalOpen(true); }}>
                            <Key className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => handleToggleStatus(employee.id)}>
                            {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => { setSelectedEmployee(employee); setIsDeleteModalOpen(true); }}
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <ResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        employee={selectedEmployee}
        onResetSuccess={handlePasswordResetSuccess}
      />
      <DeleteEmployeeModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        employee={selectedEmployee}
        onDeleteSuccess={handleDeleteEmployeeSuccess}
      />
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
