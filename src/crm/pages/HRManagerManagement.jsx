// src/crm/pages/HRManagerManagement.jsx
// ✅ Super Admin only — Create / Delete / Toggle / Reset HR Managers
// Fully mobile-first layout
import React, { useState, useEffect } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, Key, Trash2, CheckCircle, XCircle, Briefcase, Phone } from 'lucide-react';
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

  // ── Fetch ────────────────────────────────────────────────────────────────
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

  // ── Username validation ──────────────────────────────────────────────────
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

  // ── Create ───────────────────────────────────────────────────────────────
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

  // ── Delete ───────────────────────────────────────────────────────────────
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

  // ── Toggle Status ────────────────────────────────────────────────────────
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
    <div className="space-y-5 pb-20">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#0F3A5F] flex items-center gap-2">
            <Briefcase className="h-5 w-5 sm:h-6 sm:w-6" /> HR Manager Setup
          </h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">
            HR Managers log in at <code className="bg-gray-100 px-1.5 py-0.5 rounded text-[10px] font-mono">/crm/login</code> → see only HR pages.
          </p>
        </div>
        <Button
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="bg-[#0F3A5F] hover:bg-[#0a2742] w-full sm:w-auto"
          size="sm"
        >
          <Plus size={15} className="mr-1.5" /> Create HR Manager
        </Button>
      </div>

      {/* ── Privilege Info ─────────────────────────────────────────────── */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h3 className="font-semibold text-amber-800 text-sm mb-3">🔐 HR Manager Privileges</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="bg-green-50 rounded-xl p-3">
            <p className="text-green-700 font-semibold text-xs mb-1.5">✅ Can Do</p>
            <ul className="text-gray-600 text-xs space-y-1">
              {['Mark & edit attendance', 'Approve / reject leaves', 'Generate payroll', 'Manage HR employee records', 'Upload HR documents', 'View HR analytics'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><CheckCircle size={11} className="text-green-500 shrink-0" />{t}</li>
              ))}
            </ul>
          </div>
          <div className="bg-red-50 rounded-xl p-3">
            <p className="text-red-600 font-semibold text-xs mb-1.5">❌ Cannot Do</p>
            <ul className="text-gray-600 text-xs space-y-1">
              {['View CRM leads or sales', 'Access employee (CRM) profiles', 'See revenue / booking analytics', 'Access CRM settings', 'Create / delete CRM users', 'View website content / CMS'].map(t => (
                <li key={t} className="flex items-center gap-1.5"><XCircle size={11} className="text-red-400 shrink-0" />{t}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total', val: hrManagers.length,                               color: 'text-[#0F3A5F]' },
          { label: 'Active',   val: hrManagers.filter(h => h.status === 'Active').length,  color: 'text-green-600' },
          { label: 'Suspended',val: hrManagers.filter(h => h.status !== 'Active').length,  color: 'text-red-500'   },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-2xl border p-4 text-center shadow-sm">
            <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
            <p className="text-[10px] text-gray-400 mt-0.5 uppercase tracking-wide">{s.label}</p>
          </div>
        ))}
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search HR managers…"
          className="pl-9 rounded-xl"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* ── List ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          <span className="ml-2 text-gray-400 text-sm">Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Briefcase className="h-10 w-10 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">{searchTerm ? 'No results.' : 'No HR Managers yet.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(hr => (
            <div key={hr.id} className="bg-white rounded-2xl border shadow-sm p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="h-11 w-11 rounded-xl bg-amber-600 text-white flex items-center justify-center text-base font-bold shrink-0">
                  {(hr.name || '?').charAt(0).toUpperCase()}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-[#0F3A5F] text-sm">{hr.name}</p>
                    <button
                      onClick={() => handleToggle(hr.id)}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors touch-manipulation ${
                        hr.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-600'
                      }`}
                    >
                      {hr.status}
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 truncate">{hr.email}</p>
                  {hr.phone && <p className="text-xs text-gray-400">{hr.phone}</p>}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-[10px] font-mono bg-gray-100 px-2 py-0.5 rounded">@{hr.username}</span>
                    <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">→ /crm/hr/dashboard</span>
                  </div>
                  {hr.last_login && (
                    <p className="text-[10px] text-gray-300 mt-1">
                      Last login: {new Date(hr.last_login).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' })}
                    </p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button
                    onClick={() => { setResetTarget(hr); setIsResetOpen(true); }}
                    className="p-2 hover:bg-blue-50 active:bg-blue-100 rounded-lg text-blue-500 touch-manipulation"
                    title="Reset Password"
                  >
                    <Key size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(hr.id, hr.name)}
                    className="p-2 hover:bg-red-50 active:bg-red-100 rounded-lg text-red-400 touch-manipulation"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ────────────────────────────────────────────────── */}
      <Dialog open={isModalOpen} onOpenChange={o => { if (!o) resetForm(); setIsModalOpen(o); }}>
        <DialogContent className="max-w-lg mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#0F3A5F] flex items-center gap-2">
              <Briefcase className="h-5 w-5" /> Create HR Manager
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
              <div className="space-y-1.5">
                <Label className="text-xs">First Name *</Label>
                <Input
                  value={formData.firstName}
                  onChange={e => {
                    setFormData(p => ({ ...p, firstName: e.target.value }));
                    if (formData.lastName) autoUsername(e.target.value, formData.lastName);
                  }}
                  className="rounded-xl"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Last Name</Label>
                <Input
                  value={formData.lastName}
                  onChange={e => {
                    setFormData(p => ({ ...p, lastName: e.target.value }));
                    if (formData.firstName) autoUsername(formData.firstName, e.target.value);
                  }}
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Email *</Label>
                <Input type="email" value={formData.email}
                  onChange={e => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="rounded-xl" required
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Phone</Label>
                <Input value={formData.phone}
                  onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
              <div className="sm:col-span-2 space-y-1.5">
                <Label className="text-xs">Username <span className="text-gray-400 font-normal">(auto-suggested)</span></Label>
                <div className="relative">
                  <Input
                    value={formData.username}
                    onChange={e => handleUsernameChange(e.target.value)}
                    className={`rounded-xl pr-9 ${
                      usernameStatus === 'valid'          ? 'border-green-500' :
                      usernameStatus === 'taken'          ? 'border-red-500'   :
                      usernameStatus === 'invalid_format' ? 'border-red-500'   : ''
                    }`}
                  />
                  {usernameStatus === 'valid'  && <CheckCircle size={16} className="text-green-500 absolute right-3 top-3" />}
                  {(usernameStatus === 'taken' || usernameStatus === 'invalid_format') && <XCircle size={16} className="text-red-500 absolute right-3 top-3" />}
                </div>
                {usernameStatus === 'taken'          && <p className="text-[10px] text-red-500">Username already taken.</p>}
                {usernameStatus === 'invalid_format' && <p className="text-[10px] text-red-500">5–20 alphanumeric chars only.</p>}
              </div>
            </div>
            <p className="text-xs text-gray-400 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 mb-4">
              🏢 Logs in at <strong>/crm/login</strong> → sees only HR pages. CRM leads &amp; settings are completely hidden.
            </p>
            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" className="rounded-xl"
                onClick={() => { resetForm(); setIsModalOpen(false); }}>
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-amber-600 hover:bg-amber-700 rounded-xl"
                disabled={usernameStatus !== 'valid' || submitting}
              >
                {submitting
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating…</>
                  : 'Create HR Manager'}
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
