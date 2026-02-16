// src/crm/pages/StaffManagement.jsx
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { 
  UserPlus, 
  Edit, 
  Trash2, 
  Power, 
  Search,
  Mail,
  Phone,
  Building2,
  Shield,
  Copy,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { 
  addUser, 
  getAllUsers, 
  deleteUser, 
  toggleUserStatus,
  generateRandomPassword 
} from '@/lib/authUtilsFirebase';

const StaffManagement = () => {
  const { toast } = useToast();
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [generatedPass, setGeneratedPass] = useState('');
  const [newStaff, setNewStaff] = useState({
    name: '',
    email: '',
    username: '',
    role: '',
    phone: '',
    department: ''
  });

  // Load users from Firebase on component mount
  useEffect(() => {
    loadUsersFromFirebase();
  }, []);

  const loadUsersFromFirebase = async () => {
    try {
      setLoading(true);
      const users = await getAllUsers();
      const staffList = users.map(u => ({
        id: u.id,
        name: u.name,
        username: u.username,
        email: u.email,
        role: u.role,
        status: u.status,
        phone: u.phone || '',
        department: u.department || 'Sales',
        lastLogin: u.lastLogin || 'Never'
      }));
      setStaff(staffList);
      console.log('✅ Loaded users from Firebase:', staffList.length);
    } catch (error) {
      console.error('❌ Error loading users:', error);
      toast({
        title: "Error",
        description: "Failed to load users from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddStaff = async () => {
    // Validation
    if (!newStaff.name || !newStaff.username || !newStaff.role) {
      toast({ 
        title: "Error", 
        description: "Please fill all required fields (Name, Username, Role)",
        variant: "destructive" 
      });
      return;
    }

    // Validate username format (no spaces, lowercase)
    if (!/^[a-z0-9._]+$/.test(newStaff.username.toLowerCase())) {
      toast({ 
        title: "Invalid Username", 
        description: "Username can only contain lowercase letters, numbers, dots and underscores",
        variant: "destructive" 
      });
      return;
    }
    
    // Generate email if not provided
    const email = newStaff.email || `${newStaff.username.toLowerCase()}@fanbegroup.com`;
    
    // Generate secure password
    const tempPassword = generateRandomPassword();
    
    // Show loading
    toast({ title: "Creating user...", description: "Please wait" });
    
    try {
      // Add user to Firebase
      const result = await addUser({
        name: newStaff.name,
        email: email,
        username: newStaff.username.toLowerCase(),
        role: newStaff.role,
        password: tempPassword,
        phone: newStaff.phone || '',
        department: newStaff.department || 'Sales'
      });
      
      if (result.success) {
        // Update local state
        const newEntry = {
          id: result.userId,
          name: result.user.name,
          username: result.user.username,
          email: result.user.email,
          role: result.user.role,
          status: result.user.status,
          phone: result.user.phone,
          department: result.user.department,
          lastLogin: 'Never'
        };

        setStaff([...staff, newEntry]);
        setGeneratedPass(tempPassword);

        // Show success with password
        toast({
          title: "Employee Created Successfully!",
          description: `Username: ${newStaff.username} | Password: ${tempPassword}`,
          duration: 25000
        });

        // Log credentials for admin reference
        console.log('NEW USER CREDENTIALS:');
        console.log('==========================================');
        console.log('Name:', result.user.name);
        console.log('Username:', result.user.username);
        console.log('Email:', result.user.email);
        console.log('Password:', tempPassword);
        console.log('Role:', result.user.role);
        console.log('==========================================');

        // Reset form
        setIsAddModalOpen(false);
        setNewStaff({
          name: '',
          email: '',
          username: '',
          role: '',
          phone: '',
          department: ''
        });

        // Show credential card
        showCredentialCard(result.user.username, tempPassword, result.user.name);
        
      } else {
        toast({ 
          title: "❌ Error Creating User", 
          description: result.message,
          variant: "destructive",
          duration: 10000
        });
      }
    } catch (error) {
      console.error('Error creating user:', error);
      toast({ 
        title: "❌ Failed to Create User", 
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const showCredentialCard = (username, password, name) => {
    // Log credentials in a formatted way
    const credentials = `
╔════════════════════════════════════════════╗
║     EMPLOYEE CREDENTIALS - SAVE THIS!      ║
╠════════════════════════════════════════════╣
║ Name:     ${name.padEnd(34)}║
║ Username: ${username.padEnd(34)}║
║ Password: ${password.padEnd(34)}║
║ Login:    fanbegroup.com/crm/login${' '.repeat(8)}║
╚════════════════════════════════════════════╝
    `;
    console.log(credentials);
    setGeneratedPass(password);
  };

  const handleDeleteStaff = async (id, username) => {
    if (!window.confirm(`Are you sure you want to delete user: ${username}?\n\nThis action cannot be undone.`)) {
      return;
    }
    
    try {
      const result = await deleteUser(id);
      
      if (result.success) {
        setStaff(staff.filter(s => s.id !== id));
        toast({ 
          title: "✅ Deleted", 
          description: `User ${username} removed successfully` 
        });
      } else {
        toast({ 
          title: "❌ Error", 
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({ 
        title: "❌ Failed to Delete", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleToggleStatus = async (id, currentStatus, username) => {
    try {
      const result = await toggleUserStatus(id);
      
      if (result.success) {
        setStaff(staff.map(s => 
          s.id === id ? { ...s, status: result.status } : s
        ));
        
        const action = result.status === 'Active' ? 'activated' : 'suspended';
        toast({ 
          title: "✅ Status Updated", 
          description: `User ${username} ${action} successfully` 
        });
      } else {
        toast({ 
          title: "❌ Error", 
          description: result.message,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      toast({ 
        title: "❌ Failed to Update Status", 
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    toast({ 
      title: "✅ Copied!", 
      description: `${label} copied to clipboard` 
    });
  };

  // Filter staff
  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         s.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || s.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadge = (role) => {
    const roleStyles = {
      super_admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      sales_executive: 'bg-green-100 text-green-800',
      telecaller: 'bg-orange-100 text-orange-800'
    };
    
    const roleNames = {
      super_admin: 'Super Admin',
      manager: 'Manager',
      sales_executive: 'Sales Executive',
      telecaller: 'Telecaller'
    };
    
    return (
      <Badge className={roleStyles[role] || 'bg-gray-100 text-gray-800'}>
        {roleNames[role] || role}
      </Badge>
    );
  };

  const getStatusBadge = (status) => {
    return status === 'Active' ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Suspended
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="p-8">
        <Card>
          <CardContent className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading staff data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-gray-500 mt-1">Manage your team members and access</p>
        </div>
        <Button onClick={() => setIsAddModalOpen(true)} className="bg-blue-600 hover:bg-blue-700">
          <UserPlus className="w-4 h-4 mr-2" />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Staff</p>
                <p className="text-2xl font-bold">{staff.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                <p className="text-2xl font-bold text-green-600">
                  {staff.filter(s => s.status === 'Active').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Managers</p>
                <p className="text-2xl font-bold">
                  {staff.filter(s => s.role === 'manager').length}
                </p>
              </div>
              <Building2 className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Sales Team</p>
                <p className="text-2xl font-bold">
                  {staff.filter(s => s.role === 'sales_executive').length}
                </p>
              </div>
              <UserPlus className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by name, username, or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="sales_executive">Sales Executive</SelectItem>
                <SelectItem value="telecaller">Telecaller</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members ({filteredStaff.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    No staff members found
                  </TableCell>
                </TableRow>
              ) : (
                filteredStaff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">{member.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                        {member.username}
                      </code>
                    </TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>{getRoleBadge(member.role)}</TableCell>
                    <TableCell>{member.department || 'Sales'}</TableCell>
                    <TableCell>{getStatusBadge(member.status)}</TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {member.lastLogin === 'Never' ? 'Never' : new Date(member.lastLogin).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleToggleStatus(member.id, member.status, member.username)}
                          title={member.status === 'Active' ? 'Suspend User' : 'Activate User'}
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStaff(member.id, member.username)}
                          className="text-red-600 hover:text-red-700"
                          title="Delete User"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add Staff Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Create a new employee account. A secure password will be generated automatically.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Rajesh Kumar"
                value={newStaff.name}
                onChange={(e) => setNewStaff({...newStaff, name: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="username">Username *</Label>
              <Input
                id="username"
                placeholder="e.g., rajesh.kumar"
                value={newStaff.username}
                onChange={(e) => setNewStaff({...newStaff, username: e.target.value.toLowerCase()})}
              />
              <p className="text-xs text-gray-500">Lowercase letters, numbers, dots and underscores only</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g., rajesh@fanbegroup.com"
                value={newStaff.email}
                onChange={(e) => setNewStaff({...newStaff, email: e.target.value})}
              />
              <p className="text-xs text-gray-500">Optional - will auto-generate if empty</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select value={newStaff.role} onValueChange={(value) => setNewStaff({...newStaff, role: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="sales_executive">Sales Executive</SelectItem>
                  <SelectItem value="telecaller">Telecaller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="department">Department</Label>
              <Input
                id="department"
                placeholder="e.g., Sales"
                value={newStaff.department}
                onChange={(e) => setNewStaff({...newStaff, department: e.target.value})}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="e.g., +91-XXXXXXXXXX"
                value={newStaff.phone}
                onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddStaff} className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="w-4 h-4 mr-2" />
              Create Employee
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagement;
