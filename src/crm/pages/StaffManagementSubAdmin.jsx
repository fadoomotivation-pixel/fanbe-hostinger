import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Edit, Trash2, RotateCcw, Ban, CheckCircle, Search, UserPlus, Loader2, Copy } from 'lucide-react';
import {
  addUser,
  updateUser,
  deleteUser,
  toggleUserStatus,
  getAllUsers,
  generateRandomPassword,
} from '@/lib/authUtilsSupabase';
import { supabaseAdmin } from '@/lib/supabase';
import { ROLES } from '@/lib/permissions';

const StaffManagementSubAdmin = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [staffList, setStaffList]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isAddOpen, setIsAddOpen]       = useState(false);
  const [isEditOpen, setIsEditOpen]     = useState(false);
  const [isResetOpen, setIsResetOpen]   = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedStaff, setSelectedStaff] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', username: '', role: 'sales_executive' });
  const [resetPass, setResetPass] = useState('');

  // ── Load staff from Supabase ──────────────────────────────────────────────
  const loadStaff = async () => {
    setLoading(true);
    const all = await getAllUsers();
    // Sub Admin can see everyone except Super Admin and themselves
    const filtered = all.filter(
      (e) => e.role !== ROLES.SUPER_ADMIN && e.id !== user.id
    );
    setStaffList(filtered);
    setLoading(false);
  };

  useEffect(() => { loadStaff(); }, []);

  // ── Search filter ─────────────────────────────────────────────────────────
  const displayed = staffList.filter((s) =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Add Staff ─────────────────────────────────────────────────────────────
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    const tempPass = generateRandomPassword();
    const result = await addUser({ ...formData, password: tempPass });
    setSaving(false);

    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }

    toast({
      title: '✅ Staff Added to Supabase',
      description: `Temp Password: ${tempPass} — Share this with ${formData.name}`,
      duration: 10000,
    });
    setIsAddOpen(false);
    setFormData({ name: '', email: '', username: '', role: 'sales_executive' });
    await loadStaff();
  };

  // ── Edit Staff ────────────────────────────────────────────────────────────
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!selectedStaff) return;
    setSaving(true);
    const result = await updateUser(selectedStaff.id, {
      name: formData.name,
      role: formData.role,
    });
    setSaving(false);

    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }

    toast({ title: '✅ Staff Updated', description: `${formData.name} details saved to Supabase.` });
    setIsEditOpen(false);
    setSelectedStaff(null);
    await loadStaff();
  };

  // ── Reset Password ────────────────────────────────────────────────────────
  const handleResetPassword = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    const newPass = generateRandomPassword();

    // Update password in Supabase Auth via admin API
    const { error } = await supabaseAdmin.auth.admin.updateUserById(selectedStaff.id, {
      password: newPass,
    });
    setSaving(false);

    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
      return;
    }

    setResetPass(newPass);
    toast({
      title: '✅ Password Reset in Supabase Auth',
      description: `New password set for ${selectedStaff.name}`,
    });
  };

  // ── Toggle Active/Inactive ────────────────────────────────────────────────
  const handleToggleStatus = async (staff) => {
    const result = await toggleUserStatus(staff.id);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({
      title: `Status Changed`,
      description: `${staff.name} is now ${result.status}`,
      variant: result.status === 'Active' ? 'default' : 'destructive',
    });
    await loadStaff();
  };

  // ── Delete Staff ──────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!selectedStaff) return;
    setSaving(true);
    const result = await deleteUser(selectedStaff.id);
    setSaving(false);

    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }

    toast({ title: '🗑️ Staff Deleted from Supabase', variant: 'destructive' });
    setIsDeleteOpen(false);
    setSelectedStaff(null);
    await loadStaff();
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const openEdit = (staff) => {
    setSelectedStaff(staff);
    setFormData({ name: staff.name, email: staff.email, username: staff.username, role: staff.role });
    setIsEditOpen(true);
  };
  const openReset  = (staff) => { setSelectedStaff(staff); setResetPass(''); setIsResetOpen(true); };
  const openDelete = (staff) => { setSelectedStaff(staff); setIsDeleteOpen(true); };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied!', description: 'Password copied to clipboard.' });
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Staff Management</h1>
          <p className="text-sm text-gray-500">Manage your team — all changes sync to Supabase</p>
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
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading staff from Supabase...</span>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayed.map((staff) => (
                <TableRow key={staff.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-[#0F3A5F] flex items-center justify-center text-xs font-bold text-white">
                        {(staff.name || 'U').charAt(0).toUpperCase()}
                      </div>
                      {staff.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{staff.username}</TableCell>
                  <TableCell className="text-xs text-gray-500">{staff.email}</TableCell>
                  <TableCell className="text-xs text-blue-600 capitalize">
                    {staff.role?.replace('_', ' ')}
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                      staff.status === 'Active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {staff.status || 'Active'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(staff)} title="Edit">
                      <Edit className="h-4 w-4 text-blue-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openReset(staff)} title="Reset Password">
                      <RotateCcw className="h-4 w-4 text-orange-600" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(staff)}
                      title={staff.status === 'Active' ? 'Deactivate' : 'Activate'}>
                      {staff.status === 'Active'
                        ? <Ban className="h-4 w-4 text-yellow-600" />
                        : <CheckCircle className="h-4 w-4 text-green-600" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => openDelete(staff)} title="Delete">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {displayed.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    No staff members found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ── Add Modal ── */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Staff Member</DialogTitle></DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input required type="email" value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Username</Label>
              <Input required value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_executive">Sales Executive</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Account'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Edit Modal ── */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Staff</DialogTitle></DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input required value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input disabled value={formData.email} className="bg-gray-50 text-gray-400" />
              <p className="text-xs text-gray-400">Email cannot be changed here</p>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales_executive">Sales Executive</SelectItem>
                  <SelectItem value="sub_admin">Sub Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>
                {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Reset Password Modal ── */}
      <Dialog open={isResetOpen} onOpenChange={setIsResetOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reset Password</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <p>Generate a new password for <strong>{selectedStaff?.name}</strong>?</p>
            {resetPass ? (
              <div className="bg-gray-100 p-4 rounded text-center space-y-2">
                <p className="text-sm text-gray-500">New Password (Supabase Auth updated):</p>
                <p className="text-xl font-mono font-bold tracking-widest">{resetPass}</p>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(resetPass)}>
                  <Copy className="h-3 w-3 mr-1" /> Copy Password
                </Button>
                <p className="text-xs text-red-500">Share this with {selectedStaff?.name} now.</p>
              </div>
            ) : (
              <Button onClick={handleResetPassword} className="w-full" disabled={saving}>
                {saving
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Resetting...</>
                  : 'Generate & Set New Password'}
              </Button>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsResetOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Delete Modal ── */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p>Are you sure you want to permanently delete <strong>{selectedStaff?.name}</strong> from Supabase? This cannot be undone.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Deleting...</> : 'Delete Permanently'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffManagementSubAdmin;
