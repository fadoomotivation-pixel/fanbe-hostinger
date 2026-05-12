import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Edit2, Trash2, Key, Copy, Plus, MoreHorizontal } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const StaffManagement = () => {
  const { toast } = useToast();
  
  // Mock Data
  const [staff, setStaff] = useState([
    { id: 'EMP001', name: 'John Doe', username: 'johnd', email: 'john@fanbe.com', role: 'Sales Executive', status: 'Active', lastLogin: '2023-10-25 10:30 AM' },
    { id: 'EMP002', name: 'Jane Smith', username: 'janes', email: 'jane@fanbe.com', role: 'Team Lead', status: 'Active', lastLogin: '2023-10-24 02:15 PM' },
  ]);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', email: '', username: '', role: '', sendEmail: true });
  const [generatedPass, setGeneratedPass] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  const generatePassword = () => {
    return Math.random().toString(36).slice(-8).toUpperCase();
  };

  const handleAddStaff = () => {
    if (!newStaff.name || !newStaff.username) return;
    
    const tempPass = generatePassword();
    const newEntry = {
      id: `EMP${String(staff.length + 1).padStart(3, '0')}`,
      ...newStaff,
      status: 'Active',
      lastLogin: 'Never'
    };
    
    setStaff([...staff, newEntry]);
    setGeneratedPass(tempPass);
    // In real app, modal would stay open to show password or password shown in toast
    toast({ title: "Staff Added", description: `Account created. Temp Password: ${tempPass}` });
    setIsAddModalOpen(false);
    setNewStaff({ name: '', email: '', username: '', role: '', sendEmail: true });
  };

  const handleDeleteStaff = (id) => {
    setStaff(staff.filter(s => s.id !== id));
    toast({ title: "Deleted", description: "Staff member removed successfully" });
  };

  const handleToggleStatus = (id) => {
    setStaff(staff.map(s => s.id === id ? { ...s, status: s.status === 'Active' ? 'Inactive' : 'Active' } : s));
    toast({ title: "Updated", description: "Status updated successfully" });
  };

  const handleResetPassword = () => {
    const newPass = generatePassword();
    setGeneratedPass(newPass);
    // Show password to admin
    toast({ title: "Password Reset", description: `New Password: ${newPass}` });
    setIsResetModalOpen(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-24 p-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500">Manage employees, roles, and access.</p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button className="w-full md:w-auto"><Plus className="mr-2" size={16} /> Add New Staff</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Staff Member</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input value={newStaff.username} onChange={e => setNewStaff({...newStaff, username: e.target.value})} placeholder="Unique username" />
              </div>
              <div className="space-y-2">
                <Label>Role</Label>
                <Select onValueChange={v => setNewStaff({...newStaff, role: v})}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Sales Executive">Sales Executive</SelectItem>
                    <SelectItem value="Team Lead">Team Lead</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch checked={newStaff.sendEmail} onCheckedChange={c => setNewStaff({...newStaff, sendEmail: c})} />
                <Label>Send welcome email with credentials</Label>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddStaff}>Create Account</Button>
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
                  <TableHead className="hidden md:table-cell">Role</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Last Login</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((employee) => (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-gray-900">{employee.name}</p>
                        <p className="text-xs text-gray-500">{employee.email}</p>
                        <p className="text-xs text-gray-400 md:hidden">{employee.role}</p>
                      </div>
                    </TableCell>
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
                          <DropdownMenuItem onClick={() => { setSelectedStaff(employee); setIsResetModalOpen(true); }}>
                            <Key className="mr-2 h-4 w-4" /> Reset Password
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleToggleStatus(employee.id)}>
                             {employee.status === 'Active' ? 'Deactivate' : 'Activate'}
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-600" onClick={() => handleDeleteStaff(employee.id)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
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

      {/* Reset Password Dialog */}
      <Dialog open={isResetModalOpen} onOpenChange={setIsResetModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reset Password for {selectedStaff?.name}</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-500">This will generate a new random password. The user will need to use this to log in.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetModalOpen(false)}>Cancel</Button>
            <Button onClick={handleResetPassword} variant="destructive">Reset Password</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;