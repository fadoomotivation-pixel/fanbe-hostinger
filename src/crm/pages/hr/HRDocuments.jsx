// src/crm/pages/hr/HRDocuments.jsx
import React, { useState, useEffect, useRef } from 'react';
import { supabaseAdmin } from '@/lib/supabase';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  FolderOpen, Upload, Trash2, Download, Eye, Search,
  Loader2, FileText, FileImage, FileCheck, File, PlusCircle,
  ShieldCheck, CreditCard, Briefcase, BookOpen
} from 'lucide-react';

const DOC_CATEGORIES = [
  'Offer Letter',
  'Appointment Letter',
  'ID Proof (Aadhar)',
  'ID Proof (PAN)',
  'Address Proof',
  'Educational Certificate',
  'Experience Letter',
  'Resignation Letter',
  'Relieving Letter',
  'Bank Proof',
  'Photo',
  'Contract / Agreement',
  'Other',
];

const CATEGORY_ICONS = {
  'Offer Letter':              FileCheck,
  'Appointment Letter':        FileCheck,
  'ID Proof (Aadhar)':         CreditCard,
  'ID Proof (PAN)':            CreditCard,
  'Address Proof':             ShieldCheck,
  'Educational Certificate':   BookOpen,
  'Experience Letter':         Briefcase,
  'Resignation Letter':        FileText,
  'Relieving Letter':          FileText,
  'Bank Proof':                FileText,
  'Photo':                     FileImage,
  'Contract / Agreement':      FileCheck,
  'Other':                     File,
};

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN') : '—';
const fmtSize = (bytes) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes/1024).toFixed(1)} KB`;
  return `${(bytes/1048576).toFixed(1)} MB`;
};

const HRDocuments = () => {
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [employees,   setEmployees]   = useState([]);
  const [documents,   setDocuments]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [uploading,   setUploading]   = useState(false);
  const [search,      setSearch]      = useState('');
  const [filterEmp,   setFilterEmp]   = useState('all');
  const [filterCat,   setFilterCat]   = useState('all');

  // Upload modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm,   setUploadForm]   = useState({
    emp_id: '', category: 'Offer Letter', doc_name: '', file: null, expiry_date: '', notes: ''
  });

  // Preview modal
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl,    setPreviewUrl]    = useState('');
  const [previewType,   setPreviewType]   = useState('');
  const [previewName,   setPreviewName]   = useState('');

  // ── Load ─────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    const [empRes, docRes] = await Promise.all([
      supabaseAdmin.from('hr_employees').select('emp_id,name,department,designation').eq('status','Active').order('name'),
      supabaseAdmin.from('hr_documents').select('*').order('created_at', { ascending: false }),
    ]);
    setEmployees(empRes.data || []);
    setDocuments(docRes.data || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const empName = (id) => employees.find(e => e.emp_id === id)?.name || id;

  // ── Stats ─────────────────────────────────────────────────
  const totalDocs   = documents.length;
  const totalEmps   = [...new Set(documents.map(d => d.emp_id))].length;
  const expiringSoon = documents.filter(d => {
    if (!d.expiry_date) return false;
    const diff = (new Date(d.expiry_date) - new Date()) / (1000*60*60*24);
    return diff >= 0 && diff <= 30;
  }).length;
  const expired = documents.filter(d => {
    if (!d.expiry_date) return false;
    return new Date(d.expiry_date) < new Date();
  }).length;

  // ── Filter ────────────────────────────────────────────────
  const filtered = documents.filter(d => {
    const matchEmp  = filterEmp === 'all' || d.emp_id === filterEmp;
    const matchCat  = filterCat === 'all' || d.category === filterCat;
    const matchSrch = !search ||
      empName(d.emp_id).toLowerCase().includes(search.toLowerCase()) ||
      d.doc_name?.toLowerCase().includes(search.toLowerCase()) ||
      d.category?.toLowerCase().includes(search.toLowerCase());
    return matchEmp && matchCat && matchSrch;
  });

  // ── Handle file pick ──────────────────────────────────────
  const handleFilePick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max 10 MB allowed.', variant: 'destructive' });
      return;
    }
    setUploadForm(p => ({ ...p, file, doc_name: p.doc_name || file.name }));
  };

  // ── Upload ────────────────────────────────────────────────
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!uploadForm.emp_id) { toast({ title: 'Select employee', variant: 'destructive' }); return; }
    if (!uploadForm.file)   { toast({ title: 'Choose a file', variant: 'destructive' }); return; }

    setUploading(true);
    const ext      = uploadForm.file.name.split('.').pop();
    const filePath = `hr-docs/${uploadForm.emp_id}/${Date.now()}_${uploadForm.category.replace(/[^a-z0-9]/gi,'_')}.${ext}`;

    const { data: storageData, error: storageErr } = await supabaseAdmin
      .storage.from('hr-documents')
      .upload(filePath, uploadForm.file, { cacheControl: '3600', upsert: false });

    if (storageErr) {
      setUploading(false);
      toast({ title: 'Upload failed', description: storageErr.message, variant: 'destructive' });
      return;
    }

    const { data: urlData } = supabaseAdmin.storage.from('hr-documents').getPublicUrl(filePath);

    const { error: dbErr } = await supabaseAdmin.from('hr_documents').insert({
      emp_id:       uploadForm.emp_id,
      category:     uploadForm.category,
      doc_name:     uploadForm.doc_name || uploadForm.file.name,
      file_path:    filePath,
      file_url:     urlData?.publicUrl || '',
      file_type:    uploadForm.file.type,
      file_size:    uploadForm.file.size,
      expiry_date:  uploadForm.expiry_date || null,
      notes:        uploadForm.notes || null,
      created_at:   new Date().toISOString(),
    });

    setUploading(false);
    if (dbErr) { toast({ title: 'DB Error', description: dbErr.message, variant: 'destructive' }); return; }
    toast({ title: '✅ Document uploaded', description: `${uploadForm.doc_name} saved for ${empName(uploadForm.emp_id)}` });
    setIsUploadOpen(false);
    setUploadForm({ emp_id: '', category: 'Offer Letter', doc_name: '', file: null, expiry_date: '', notes: '' });
    if (fileInputRef.current) fileInputRef.current.value = '';
    await load();
  };

  // ── Delete ────────────────────────────────────────────────
  const handleDelete = async (doc) => {
    await supabaseAdmin.storage.from('hr-documents').remove([doc.file_path]);
    await supabaseAdmin.from('hr_documents').delete().eq('id', doc.id);
    toast({ title: '🗑️ Document deleted', variant: 'destructive' });
    await load();
  };

  // ── Preview ───────────────────────────────────────────────
  const handlePreview = (doc) => {
    setPreviewUrl(doc.file_url);
    setPreviewType(doc.file_type || '');
    setPreviewName(doc.doc_name);
    setIsPreviewOpen(true);
  };

  // ── Expiry badge ──────────────────────────────────────────
  const expiryBadge = (dateStr) => {
    if (!dateStr) return null;
    const diff = (new Date(dateStr) - new Date()) / (1000*60*60*24);
    if (diff < 0)  return <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-red-100 text-red-600 font-semibold">Expired</span>;
    if (diff <= 30) return <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-700 font-semibold">Expiring Soon</span>;
    return <span className="ml-1 px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">{fmtDate(dateStr)}</span>;
  };

  // ── File type icon ─────────────────────────────────────────
  const fileIcon = (mime) => {
    if (!mime) return <File className="h-4 w-4 text-gray-400" />;
    if (mime.includes('image'))       return <FileImage className="h-4 w-4 text-blue-500" />;
    if (mime.includes('pdf'))         return <FileText  className="h-4 w-4 text-red-500" />;
    return <FileText className="h-4 w-4 text-gray-500" />;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Document Vault</h1>
          <p className="text-sm text-gray-500">HR Module — Employee documents, ID proofs & certificates</p>
        </div>
        <Button onClick={() => setIsUploadOpen(true)} className="bg-[#0F3A5F] hover:bg-[#1a5a8f]">
          <Upload className="mr-2 h-4 w-4" /> Upload Document
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Documents',  val: totalDocs,    color: 'border-blue-500 text-blue-700' },
          { label: 'Employees w/ Docs',val: totalEmps,    color: 'border-indigo-400 text-indigo-700' },
          { label: 'Expiring (30 days)',val: expiringSoon, color: 'border-yellow-400 text-yellow-700' },
          { label: 'Expired',          val: expired,      color: 'border-red-400 text-red-600' },
        ].map(s => (
          <Card key={s.label} className={`border-l-4 ${s.color.split(' ')[0]}`}>
            <CardContent className="p-3">
              <p className="text-xs text-gray-500 uppercase">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color.split(' ')[1]}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={filterEmp} onValueChange={setFilterEmp}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Employees" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Employees</SelectItem>
            {employees.map(e => <SelectItem key={e.emp_id} value={e.emp_id}>{e.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterCat} onValueChange={setFilterCat}>
          <SelectTrigger className="w-48 h-9"><SelectValue placeholder="All Categories" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <Search className="h-4 w-4 text-gray-400 shrink-0" />
          <Input placeholder="Search name, doc, category..." value={search} onChange={e => setSearch(e.target.value)} className="h-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[#0F3A5F] hover:bg-[#0F3A5F]">
                    {['#', 'Employee', 'Category', 'Document Name', 'Size', 'Expiry', 'Uploaded', 'Actions'].map(h =>
                      <TableHead key={h} className="text-white text-xs whitespace-nowrap">{h}</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((doc, i) => {
                    const CatIcon = CATEGORY_ICONS[doc.category] || File;
                    return (
                      <TableRow key={doc.id} className="hover:bg-gray-50">
                        <TableCell className="text-xs text-gray-400">{i + 1}</TableCell>
                        <TableCell>
                          <p className="text-sm font-medium">{empName(doc.emp_id)}</p>
                          <p className="text-xs text-gray-400">{doc.emp_id}</p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <CatIcon className="h-3.5 w-3.5 text-[#0F3A5F]" />
                            <span className="text-xs">{doc.category}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            {fileIcon(doc.file_type)}
                            <span className="text-sm">{doc.doc_name}</span>
                          </div>
                          {doc.notes && <p className="text-xs text-gray-400 mt-0.5">{doc.notes}</p>}
                        </TableCell>
                        <TableCell className="text-xs text-gray-500">{fmtSize(doc.file_size)}</TableCell>
                        <TableCell>{expiryBadge(doc.expiry_date)}</TableCell>
                        <TableCell className="text-xs text-gray-500">{fmtDate(doc.created_at)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" title="Preview" onClick={() => handlePreview(doc)}>
                              <Eye className="h-4 w-4 text-blue-500" />
                            </Button>
                            <a href={doc.file_url} download target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="icon" title="Download">
                                <Download className="h-4 w-4 text-green-600" />
                              </Button>
                            </a>
                            <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(doc)}>
                              <Trash2 className="h-4 w-4 text-red-400" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-14">
                        <FolderOpen className="h-10 w-10 text-gray-200 mx-auto mb-2" />
                        <p className="text-gray-400 text-sm">No documents found. Click "Upload Document" to start.</p>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Upload Modal ── */}
      <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="text-[#0F3A5F]">Upload Document</DialogTitle></DialogHeader>
          <form onSubmit={handleUpload} className="space-y-4">

            <div className="space-y-1">
              <Label>Employee *</Label>
              <Select value={uploadForm.emp_id} onValueChange={v => setUploadForm(p => ({ ...p, emp_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select Employee" /></SelectTrigger>
                <SelectContent>
                  {employees.map(e => <SelectItem key={e.emp_id} value={e.emp_id}>{e.name} ({e.emp_id})</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Category *</Label>
              <Select value={uploadForm.category} onValueChange={v => setUploadForm(p => ({ ...p, category: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DOC_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Document Name</Label>
              <Input
                value={uploadForm.doc_name}
                onChange={e => setUploadForm(p => ({ ...p, doc_name: e.target.value }))}
                placeholder="e.g. Aadhar Card — Rahul Sharma"
              />
            </div>

            <div className="space-y-1">
              <Label>Choose File * <span className="text-gray-400 font-normal text-xs">(PDF, JPG, PNG — max 10 MB)</span></Label>
              <div
                className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0F3A5F] transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {uploadForm.file ? (
                  <div className="flex items-center justify-center gap-2">
                    {fileIcon(uploadForm.file.type)}
                    <span className="text-sm font-medium text-gray-700">{uploadForm.file.name}</span>
                    <span className="text-xs text-gray-400">({fmtSize(uploadForm.file.size)})</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="h-8 w-8 text-gray-300 mx-auto mb-1" />
                    <p className="text-sm text-gray-400">Click to select file</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" className="hidden" onChange={handleFilePick} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Expiry Date <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
                <Input type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm(p => ({ ...p, expiry_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <Label>Notes <span className="text-gray-400 font-normal text-xs">(optional)</span></Label>
                <Input value={uploadForm.notes} onChange={e => setUploadForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Original submitted" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsUploadOpen(false)}>Cancel</Button>
              <Button type="submit" className="bg-[#0F3A5F]" disabled={uploading}>
                {uploading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</> : <><Upload className="mr-2 h-4 w-4" />Upload</>}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Preview Modal ── */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh]">
          <DialogHeader><DialogTitle className="truncate text-[#0F3A5F]">{previewName}</DialogTitle></DialogHeader>
          <div className="overflow-auto max-h-[70vh] flex items-center justify-center bg-gray-50 rounded-lg p-2">
            {previewType.includes('image') ? (
              <img src={previewUrl} alt={previewName} className="max-w-full max-h-[65vh] object-contain rounded" />
            ) : previewType.includes('pdf') ? (
              <iframe src={previewUrl} title={previewName} className="w-full h-[65vh] rounded" />
            ) : (
              <div className="text-center py-12">
                <File className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Preview not available for this file type.</p>
                <a href={previewUrl} target="_blank" rel="noreferrer">
                  <Button className="mt-3 bg-[#0F3A5F]"><Download className="mr-2 h-4 w-4" />Download to View</Button>
                </a>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>Close</Button>
            <a href={previewUrl} download target="_blank" rel="noreferrer">
              <Button className="bg-[#0F3A5F]"><Download className="mr-2 h-4 w-4" />Download</Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRDocuments;
