// src/crm/pages/SubAdminManagement.jsx
// Uses real Supabase addUser / deleteUser / toggleUserStatus from authUtilsSupabase
// (addEmployee / deleteEmployee do NOT exist in useCRMData — was the crash cause)
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Edit2, Trash2, Plus, Search, Key, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ROLES } from '@/lib/permissions';
import {
  addUser,
  getAllUsers,
  deleteUser,
  toggleUserStatus,
  generateRandomPassword,
} from '@/lib/authUtilsSupabase';
import EmployeeCredentialsModal from '@/crm/components/EmployeeCredentialsModal';

const SubAdminManagement = () => {
  const { user }  = useAuth();
  const { toast } = useToast();

  const [subAdmins,   setSubAdmins]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdEmployee,   setCreatedEmployee]   = useState(null);
  const [createdCredentials,setCreatedCredentials]= useState(null);
  const [isCredOpen,  setIsCredOpen]  = useState(false);

  // username validation
  const [usernameStatus, setUsernameStatus] = useState('idle'); // idle | valid | taken | invalid_format
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', username: '',
  });

  // ── Load sub-admins from profiles ───────────────────────────────────────
  const fetchSubAdmins = async () => {
    setLoading(true);
    const all = await getAllUsers();
    setSubAdmins(all.filter(u => u.role === ROLES.SUB_ADMIN));
    setLoading(false);
  };
  useEffect(() => { fetchSubAdmins(); }, []);

  // ── Filtered list ────────────────────────────────────────────────────
  const filtered = subAdmins.filter(s =>
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Username helpers ────────────────────────────────────────────────
  const validateUsername = (u) => /^[a-zA-Z0-9]{5,20}$/.test(u);
  const handleUsernameChange = (val) => {
    const u = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(p => ({ ...p, username: u }));
    if (!validateUsername(u)) { setUsernameStatus('invalid_format'); return; }
    const taken = subAdmins.some(s => s.username === u);
    setUsernameStatus(taken ? 'taken' : 'valid');
  };
  const autoUsername = (first, last) => {
    if (!first || !last) return;
    handleUsernameChange((first + last).toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', username: '' });
    setUsernameStatus('idle');
  };

  // ── Create Sub Admin ────────────────────────────────────────────────
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || usernameStatus !== 'valid') {
      toast({ title: 'Validation Error', description: 'Fill all fields and ensure username is valid.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const password = generateRandomPassword();
    const result = await addUser({
      username:   formData.username,
      name:       `${formData.firstName} ${formData.lastName}`.trim(),
      email:      formData.email,
      phone:      formData.phone,
      role:       ROLES.SUB_ADMIN,
      password,
      department: 'Management',
    });
    setSubmitting(false);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ Sub Admin Created', description: `${result.user.name} added to Supabase.` });
    setCreatedEmployee(result.user);
    setCreatedCredentials({ password });
    setIsModalOpen(false);
    setIsCredOpen(true);
    resetForm();
    await fetchSubAdmins();
  };

  // ── Delete ─────────────────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!confirm(`Delete sub admin "${name}"? This cannot be undone.`)) return;
    const result = await deleteUser(id);
    if (!result.success) {
      toast({ title: 'Delete Failed', description: result.message, variant: 'destructive' }); return;
    }
    toast({ title: '🗑️ Deleted', description: `${name} removed from Supabase.`, variant: 'destructive' });
    await fetchSubAdmins();
  };

  // ── Toggle status ────────────────────────────────────────────────────
  const handleToggle = async (id) => {
    const result = await toggleUserStatus(id);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' }); return;
    }
    toast({ title: 'Status Updated', description: `Now ${result.status}` });
    await fetchSubAdmins();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Executive CRM Management</h1>
          <p className="text-gray-500">Manage regional managers and executive admins.</p>
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-[#0F3A5F] hover:bg-[#0a2742]">
          <Plus size={16} className="mr-2" /> Create Executive CRM
        </Button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search executives..."
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b text-sm text-gray-500">
          {loading ? 'Loading...' : `Showing ${filtered.length} Executive(s)`}
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading from Supabase...</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              <tr>
                <th className="p-4">Name & Contact</th>
                <th className="p-4">Username</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(emp => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-[#0F3A5F] text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(emp.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#0F3A5F]">{emp.name}</p>
                        <p className="text-xs text-gray-400">{emp.email}</p>
                        {emp.phone && <p className="text-xs text-gray-400">{emp.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-mono text-xs text-gray-600">{emp.username}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(emp.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        emp.status === 'Active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                      title="Click to toggle status"
                    >
                      {emp.status}
                    </button>
                  </td>
                  <td className="p-4 text-right space-x-1">
                    <button
                      onClick={() => handleDelete(emp.id, emp.name)}
                      className="p-1.5 hover:bg-red-50 rounded text-red-500 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={4} className="p-8 text-center text-gray-500">No executives found. Create one above.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Create Modal ── */}
      <Dialog open={isModalOpen} onOpenChange={(o) => { if (!o) resetForm(); setIsModalOpen(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0F3A5F]">Add New Executive CRM (Sub Admin)</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-1">
                <Label>First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => {
                    setFormData(p => ({ ...p, firstName: e.target.value }));
                    if (formData.lastName) autoUsername(e.target.value, formData.lastName);
                  }}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => {
                    setFormData(p => ({ ...p, lastName: e.target.value }));
                    if (formData.firstName) autoUsername(formData.firstName, e.target.value);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Phone</Label>
                <Input
                  value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="col-span-2 space-y-1">
                <Label>Username <span className="text-xs font-normal text-gray-400">(Auto-suggested)</span></Label>
                <div className="relative">
                  <Input
                    value={formData.username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    className={
                      usernameStatus === 'valid' ? 'border-green-500 pr-8' :
                      (usernameStatus === 'taken' || usernameStatus === 'invalid_format') ? 'border-red-500 pr-8' : ''
                    }
                  />
                  {usernameStatus === 'valid' && <CheckCircle size={16} className="text-green-500 absolute right-3 top-3" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid_format') && <XCircle size={16} className="text-red-500 absolute right-3 top-3" />}
                </div>
                {usernameStatus === 'taken'          && <p className="text-[10px] text-red-500">Username already taken.</p>}
                {usernameStatus === 'invalid_format' && <p className="text-[10px] text-red-500">5-20 chars, alphanumeric only.</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4">A random password will be auto-generated and shown after creation.</p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setIsModalOpen(false); }}>Cancel</Button>
              <Button
                type="submit"
                className="bg-[#0F3A5F]"
                disabled={usernameStatus !== 'valid' || submitting}
              >
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating...</> : 'Create Sub Admin'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Credentials Modal (same as EmployeeManagement) */}
      <EmployeeCredentialsModal
        isOpen={isCredOpen}
        onClose={() => setIsCredOpen(false)}
        employee={createdEmployee}
        credentials={createdCredentials}
      />
    </div>
  );
};

export default SubAdminManagement;
