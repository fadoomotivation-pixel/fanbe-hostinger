// src/crm/pages/HRManagerManagement.jsx
// ✅ Super Admin only: Create / Delete / Toggle / Reset Password for HR Managers
// HR Manager logs in at /crm/login and sees ONLY HR pages
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, Key, Trash2, CheckCircle, XCircle, Briefcase } from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader,
  DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { ROLES } from '@/lib/permissions';
import {
  addUser, getUsersByRole, deleteUser,
  toggleUserStatus, generateRandomPassword,
} from '@/lib/authUtilsSupabase';
import EmployeeCredentialsModal from '@/crm/components/EmployeeCredentialsModal';
import ResetPasswordModal from '@/crm/components/ResetPasswordModal';

const HRManagerManagement = () => {
  const { toast } = useToast();

  const [hrManagers,  setHRManagers]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [submitting,  setSubmitting]  = useState(false);
  const [searchTerm,  setSearchTerm]  = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [createdEmployee,    setCreatedEmployee]    = useState(null);
  const [createdCredentials, setCreatedCredentials] = useState(null);
  const [isCredOpen,         setIsCredOpen]         = useState(false);

  const [resetTarget, setResetTarget] = useState(null);
  const [isResetOpen, setIsResetOpen] = useState(false);

  const [usernameStatus, setUsernameStatus] = useState('idle');
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', username: '',
  });

  // ── Fetch ──────────────────────────────────────────────────
  const fetchHRManagers = async () => {
    setLoading(true);
    const data = await getUsersByRole(ROLES.HR_MANAGER);
    setHRManagers(data);
    setLoading(false);
  };
  useEffect(() => { fetchHRManagers(); }, []);

  const filtered = hrManagers.filter(h =>
    h.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.username?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ── Username ────────────────────────────────────────────────
  const validateUsername = u => /^[a-zA-Z0-9]{5,20}$/.test(u);
  const handleUsernameChange = val => {
    const u = val.toLowerCase().replace(/[^a-z0-9]/g, '');
    setFormData(p => ({ ...p, username: u }));
    if (!validateUsername(u)) { setUsernameStatus('invalid_format'); return; }
    setUsernameStatus(hrManagers.some(h => h.username === u) ? 'taken' : 'valid');
  };
  const autoUsername = (first, last) => {
    if (!first || !last) return;
    handleUsernameChange((first + last).toLowerCase().replace(/[^a-z0-9]/g, ''));
  };
  const resetForm = () => {
    setFormData({ firstName: '', lastName: '', email: '', phone: '', username: '' });
    setUsernameStatus('idle');
  };

  // ── Create ────────────────────────────────────────────────
  const handleCreate = async e => {
    e.preventDefault();
    if (!formData.firstName || !formData.email || usernameStatus !== 'valid') {
      toast({ title: 'Validation Error', description: 'Fill all required fields.', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const password = generateRandomPassword();
    const result = await addUser({
      username:   formData.username,
      name:       `${formData.firstName} ${formData.lastName}`.trim(),
      email:      formData.email,
      phone:      formData.phone,
      role:       ROLES.HR_MANAGER,
      password,
      department: 'HR',
    });
    setSubmitting(false);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: '✅ HR Manager Created', description: `${result.user.name} can now login at /crm/login` });
    setCreatedEmployee(result.user);
    setCreatedCredentials({ password });
    setIsModalOpen(false);
    setIsCredOpen(true);
    resetForm();
    await fetchHRManagers();
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (id, name) => {
    if (!confirm(`Delete HR Manager "${name}"? This cannot be undone.`)) return;
    const result = await deleteUser(id);
    if (!result.success) {
      toast({ title: 'Delete Failed', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: '🗑️ Deleted', description: `${name} removed.`, variant: 'destructive' });
    await fetchHRManagers();
  };

  // ── Toggle ────────────────────────────────────────────────
  const handleToggle = async id => {
    const result = await toggleUserStatus(id);
    if (!result.success) {
      toast({ title: 'Error', description: result.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Status Updated', description: `Now ${result.status}` });
    await fetchHRManagers();
  };

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F] flex items-center gap-2">
            <Briefcase className="h-6 w-6" /> HR Manager Setup
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            HR Managers can login at <code className="bg-gray-100 px-1 rounded text-xs">/crm/login</code> and access only HR pages:
            Attendance, Payroll, Documents, Employee Master.
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#0F3A5F] hover:bg-[#0a2742]"
        >
          <Plus size={16} className="mr-2" /> Create HR Manager
        </Button>
      </div>

      {/* Privilege Callout */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-semibold text-amber-800 text-sm mb-2">🔐 HR Manager — What they CAN and CANNOT do</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="space-y-1">
            <p className="text-green-700 font-medium">✅ Allowed</p>
            <ul className="text-gray-700 space-y-0.5 ml-2">
              <li>• Mark & edit attendance</li>
              <li>• Approve / reject leave requests</li>
              <li>• Generate & process payroll</li>
              <li>• Add / edit HR employee records</li>
              <li>• Upload & manage HR documents</li>
              <li>• View HR analytics dashboard</li>
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-red-600 font-medium">❌ Not Allowed</p>
            <ul className="text-gray-700 space-y-0.5 ml-2">
              <li>• View CRM leads or sales data</li>
              <li>• Access employee management (CRM profiles)</li>
              <li>• View revenue or booking analytics</li>
              <li>• Access CRM settings or sub-admins</li>
              <li>• Create or delete CRM users</li>
              <li>• View website content / CMS</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-[#0F3A5F]">{hrManagers.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total HR Managers</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-green-600">{hrManagers.filter(h => h.status === 'Active').length}</p>
          <p className="text-xs text-gray-500 mt-1">Active</p>
        </div>
        <div className="bg-white rounded-lg border p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-red-500">{hrManagers.filter(h => h.status !== 'Active').length}</p>
          <p className="text-xs text-gray-500 mt-1">Suspended</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search HR managers…"
            className="pl-9"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b text-sm text-gray-500">
          {loading ? 'Loading…' : `Showing ${filtered.length} of ${hrManagers.length} HR Manager(s)`}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            <span className="ml-2 text-gray-500">Loading…</span>
          </div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 font-medium border-b">
              <tr>
                <th className="p-4">Name & Contact</th>
                <th className="p-4">Username</th>
                <th className="p-4">Login Route</th>
                <th className="p-4">Last Login</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(hr => (
                <tr key={hr.id} className="hover:bg-gray-50">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-amber-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                        {(hr.name || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-[#0F3A5F]">{hr.name}</p>
                        <p className="text-xs text-gray-400">{hr.email}</p>
                        {hr.phone && <p className="text-xs text-gray-400">{hr.phone}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{hr.username}</span>
                  </td>
                  <td className="p-4">
                    <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">/crm/login → /crm/hr/dashboard</span>
                  </td>
                  <td className="p-4 text-xs text-gray-500">
                    {hr.last_login
                      ? new Date(hr.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : <span className="text-gray-300">Never</span>}
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggle(hr.id)}
                      className={`px-3 py-1 rounded-full text-xs font-bold transition-colors ${
                        hr.status === 'Active'
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {hr.status}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => { setResetTarget(hr); setIsResetOpen(true); }}
                        className="p-1.5 hover:bg-blue-50 rounded text-blue-600"
                        title="Reset Password"
                      >
                        <Key size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(hr.id, hr.name)}
                        className="p-1.5 hover:bg-red-50 rounded text-red-500"
                        title="Delete HR Manager"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-400">
                    {searchTerm ? 'No results match.' : 'No HR Managers yet. Create one above.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      <Dialog open={isModalOpen} onOpenChange={o => { if (!o) resetForm(); setIsModalOpen(o); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-[#0F3A5F]">
              <Briefcase className="inline h-5 w-5 mr-2" />
              Create HR Manager Account
            </DialogTitle>
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
                <Label>Username <span className="text-xs font-normal text-gray-400">(auto-suggested)</span></Label>
                <div className="relative">
                  <Input
                    value={formData.username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    className={[
                      usernameStatus === 'valid'          ? 'border-green-500 pr-8' : '',
                      usernameStatus === 'taken'          ? 'border-red-500 pr-8'   : '',
                      usernameStatus === 'invalid_format' ? 'border-red-500 pr-8'   : '',
                    ].join(' ')}
                  />
                  {usernameStatus === 'valid'  && <CheckCircle size={16} className="text-green-500 absolute right-3 top-3" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid_format') && <XCircle size={16} className="text-red-500 absolute right-3 top-3" />}
                </div>
                {usernameStatus === 'taken'          && <p className="text-[10px] text-red-500">Username already taken.</p>}
                {usernameStatus === 'invalid_format' && <p className="text-[10px] text-red-500">5–20 alphanumeric chars only.</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 mb-4 bg-amber-50 p-2 rounded border border-amber-100">
              🏢 This account logs in at <strong>/crm/login</strong> and will only see HR pages. CRM leads &amp; settings are completely hidden.
            </p>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => { resetForm(); setIsModalOpen(false); }}>Cancel</Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700"
                disabled={usernameStatus !== 'valid' || submitting}
              >
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</> : 'Create HR Manager'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <EmployeeCredentialsModal
        isOpen={isCredOpen}
        onClose={() => setIsCredOpen(false)}
        employee={createdEmployee}
        credentials={createdCredentials}
      />

      <ResetPasswordModal
        isOpen={isResetOpen}
        onClose={() => { setIsResetOpen(false); setResetTarget(null); }}
        employee={resetTarget}
        onResetSuccess={fetchHRManagers}
      />
    </div>
  );
};

export default HRManagerManagement;
