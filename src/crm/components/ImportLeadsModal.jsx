import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload, CheckCircle, XCircle, ArrowRight, UserPlus, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ImportLeadsModal = ({ isOpen, onClose, employees = [] }) => {
  const { addLead, updateLead, leads } = useCRMData();
  const { toast } = useToast();
  const fileInputRef = useRef(null);

  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  const [data, setData] = useState([]);
  const [step, setStep] = useState(1);
  const [importStats, setImportStats] = useState({ total: 0, current: 0, success: 0, failed: 0, reassigned: 0 });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  // Track per-row reassign selections: { [rowIdx]: employeeId }
  const [reassignSelections, setReassignSelections] = useState({});

  const COLUMN_ALIASES = {
    name: ['name', 'first_name', 'full_name', 'lead_name', 'client_name', 'customer_name', 'firstname', 'fullname', 'full name'],
    phone: ['phone', 'mobile', 'contact', 'cell', 'phone_number', 'phonenumber', 'contact_number', 'mobile_number', 'whatsapp', 'phone number'],
    budget: ['budget', 'price', 'range', 'amount', 'investment', 'आपका_बजट_कितना_है?', 'client_budget'],
    email: ['email', 'e-mail', 'email_address', 'mail'],
    source: ['source', 'lead_source', 'platform'],
    ad_clues: ['ad_name', 'campaign', 'adset_name', 'campaign_name', 'ad name', 'campaign name'],
    form_clues: ['form_id', 'form_name', 'form name'],
    platform_clues: ['platform'],
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: 'Error', description: 'File size exceeds 10MB limit.', variant: 'destructive' });
        return;
      }
      setFile(selectedFile);
    }
  };

  const parseFile = () => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        let rawData = e.target.result;
        const isCSV = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.tsv');
        if (isCSV) {
          Papa.parse(rawData, {
            header: false, skipEmptyLines: true, delimiter: '', encoding: 'UTF-16LE',
            complete: (results) => {
              if (results.data && results.data.length >= 2) {
                let headers = results.data[0].map(h => String(h).trim().replace(/^\uFEFF/, ''));
                let rows = results.data.slice(1).filter(row => row.some(cell => cell && String(cell).trim()));
                if (!rows.length) { toast({ title: 'Error', description: 'No valid data rows found.', variant: 'destructive' }); return; }
                processParsedData(headers, rows, 'File Import');
              } else { toast({ title: 'Error', description: 'File is empty or missing data.', variant: 'destructive' }); }
            },
            error: () => toast({ title: 'Error', description: 'Failed to parse CSV file.', variant: 'destructive' }),
          });
        } else {
          const wb = XLSX.read(new Uint8Array(rawData), { type: 'array' });
          const json = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: '' });
          if (json.length < 2) { toast({ title: 'Error', description: 'File is empty or missing headers.', variant: 'destructive' }); return; }
          processParsedData(json[0].map(h => String(h).trim()), json.slice(1), 'File Import');
        }
      } catch (err) {
        console.error(err);
        toast({ title: 'Error', description: "Failed to parse file.", variant: 'destructive' });
      }
    };
    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.tsv')) reader.readAsText(file, 'UTF-16LE');
    else reader.readAsArrayBuffer(file);
  };

  const handlePasteParse = () => {
    if (!pastedText.trim()) return;
    Papa.parse(pastedText, {
      header: false, skipEmptyLines: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          let headers = results.data[0];
          let rows = results.data.slice(1);
          const looksLikeHeader = headers.some(h => COLUMN_ALIASES.name.includes(String(h).toLowerCase()) || COLUMN_ALIASES.phone.includes(String(h).toLowerCase()));
          if (!looksLikeHeader) { rows = results.data; headers = ['Name', 'Phone', 'Budget', 'Source']; }
          processParsedData(headers, rows, 'Manual Paste');
        }
      },
    });
  };

  const getColumnIndex = (headers, type) => headers.findIndex(h => COLUMN_ALIASES[type].includes(String(h).toLowerCase()));

  const detectSource = (row, map, sourceDefault) => {
    if (map.sourceIdx !== -1 && row[map.sourceIdx]) {
      const p = String(row[map.sourceIdx]).toLowerCase().trim();
      if (p === 'fb') return 'Facebook Ads';
      if (p === 'ig') return 'Instagram Ads';
      if (p === 'google') return 'Google Ads';
      return row[map.sourceIdx];
    }
    if (map.platformClueIdx !== -1 && row[map.platformClueIdx]) {
      const p = String(row[map.platformClueIdx]).toLowerCase().trim();
      if (p === 'fb') return 'Facebook Ads';
      if (p === 'ig') return 'Instagram Ads';
      if (p === 'google') return 'Google Ads';
    }
    if (map.adClueIdx !== -1 && row[map.adClueIdx]) {
      const v = String(row[map.adClueIdx]).toLowerCase();
      if (v.includes('google')) return 'Google Ads';
      if (v.includes('facebook') || v.includes('fb')) return 'Facebook Ads';
      if (v.includes('instagram') || v.includes('ig')) return 'Instagram Ads';
      return 'Facebook Ads';
    }
    if (map.formClueIdx !== -1 && row[map.formClueIdx]) return 'Website Form';
    return sourceDefault;
  };

  const processParsedData = (headers, rows, sourceDefault) => {
    const map = {
      nameIdx: getColumnIndex(headers, 'name'),
      phoneIdx: getColumnIndex(headers, 'phone'),
      budgetIdx: getColumnIndex(headers, 'budget'),
      emailIdx: getColumnIndex(headers, 'email'),
      sourceIdx: getColumnIndex(headers, 'source'),
      adClueIdx: headers.findIndex(h => COLUMN_ALIASES.ad_clues.includes(String(h).toLowerCase())),
      formClueIdx: headers.findIndex(h => COLUMN_ALIASES.form_clues.includes(String(h).toLowerCase())),
      platformClueIdx: headers.findIndex(h => COLUMN_ALIASES.platform_clues.includes(String(h).toLowerCase())),
    };

    // Build phone->lead map for rich duplicate info
    const existingPhoneMap = {};
    leads.forEach(l => {
      const p = String(l.phone).replace(/[^0-9]/g, '');
      if (p) existingPhoneMap[p] = l;
    });
    const batchPhones = new Set();

    const processed = rows.map((row, idx) => {
      const detectedSource = detectSource(row, map, sourceDefault);
      let phone = map.phoneIdx !== -1 ? String(row[map.phoneIdx]) : (row[1] || '');
      phone = phone.replace(/^p:/, '').replace(/\+/g, '').trim();

      const lead = {
        id: idx,
        name: map.nameIdx !== -1 ? String(row[map.nameIdx]).trim() : (row[0] || ''),
        phone,
        budget: map.budgetIdx !== -1 ? row[map.budgetIdx] : (row[2] || ''),
        email: map.emailIdx !== -1 ? row[map.emailIdx] : '',
        source: detectedSource,
        isValid: true,
        errors: [],
        duplicateInfo: null,
        existingLeadId: null,
      };

      if (!lead.name || !String(lead.name).trim()) { lead.isValid = false; lead.errors.push('Missing Name'); }

      const cleanPhone = String(lead.phone).replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        lead.isValid = false;
        lead.errors.push('Invalid Phone (10+ digits)');
      } else {
        lead.phone = cleanPhone;
        if (existingPhoneMap[cleanPhone]) {
          const existing = existingPhoneMap[cleanPhone];
          lead.isValid = false;
          lead.errors.push('Duplicate Phone');
          lead.existingLeadId = existing.id;
          lead.duplicateInfo = {
            assignedTo: existing.assignedToName || 'Unassigned',
            status: existing.status || 'Unknown',
            source: existing.source || '',
          };
        } else if (batchPhones.has(cleanPhone)) {
          lead.isValid = false;
          lead.errors.push('Duplicate in Batch');
        } else {
          batchPhones.add(cleanPhone);
        }
      }

      if (lead.budget && isNaN(String(lead.budget).replace(/[^0-9.]/g, ''))) lead.errors.push('Check Budget Format');
      return lead;
    });

    setData(processed);
    setReassignSelections({});
    setStep(2);
  };

  // Apply reassign for a single duplicate row
  const handleReassign = (rowIdx) => {
    const empId = reassignSelections[rowIdx];
    if (!empId || empId === '__none__') return;
    const row = data[rowIdx];
    if (!row || !row.existingLeadId) return;
    const emp = employees.find(e => e.id === empId);
    if (!emp) return;

    updateLead(row.existingLeadId, {
      assignedTo: emp.id,
      assignedToName: emp.name,
      assignmentDate: new Date().toISOString(),
    });

    // Update local data to reflect done state
    setData(prev => prev.map((d, i) =>
      i === rowIdx
        ? { ...d, duplicateInfo: { ...d.duplicateInfo, assignedTo: emp.name }, reassigned: true }
        : d
    ));
    toast({ title: 'Reassigned', description: `${row.name} reassigned to ${emp.name}.` });
  };

  // Reassign ALL duplicates that have a selection
  const handleReassignAll = () => {
    let count = 0;
    data.forEach((row, idx) => {
      const empId = reassignSelections[idx];
      if (!empId || empId === '__none__' || !row.existingLeadId || row.reassigned) return;
      const emp = employees.find(e => e.id === empId);
      if (!emp) return;
      updateLead(row.existingLeadId, {
        assignedTo: emp.id,
        assignedToName: emp.name,
        assignmentDate: new Date().toISOString(),
      });
      count++;
    });
    // Mark all as reassigned
    setData(prev => prev.map((d, idx) => {
      const empId = reassignSelections[idx];
      if (!empId || empId === '__none__' || !d.existingLeadId || d.reassigned) return d;
      const emp = employees.find(e => e.id === empId);
      return emp ? { ...d, duplicateInfo: { ...d.duplicateInfo, assignedTo: emp.name }, reassigned: true } : d;
    }));
    if (count > 0) toast({ title: 'Reassigned', description: `${count} duplicate lead(s) reassigned.` });
  };

  const handleCreateLeads = async () => {
    setStep(3);
    const validLeads = data.filter(d => d.isValid);
    setImportStats({ total: validLeads.length, current: 0, success: 0, failed: 0, reassigned: 0 });

    let assignedTo = null;
    let assignedToName = null;
    if (selectedEmployeeId && selectedEmployeeId !== 'unassigned' && selectedEmployeeId.trim() !== '') {
      const emp = employees.find(e => e.id === selectedEmployeeId);
      if (emp) { assignedTo = emp.id; assignedToName = emp.name; }
    }

    const importedPhones = new Set(leads.map(l => String(l.phone).replace(/[^0-9]/g, '')));
    const batchSize = 10;
    for (let i = 0; i < validLeads.length; i += batchSize) {
      const batch = validLeads.slice(i, i + batchSize);
      await new Promise(r => setTimeout(r, 100));
      batch.forEach(item => {
        if (importedPhones.has(item.phone)) {
          setImportStats(prev => ({ ...prev, failed: prev.failed + 1, current: prev.current + 1 }));
        } else {
          importedPhones.add(item.phone);
          addLead({ name: item.name, phone: item.phone, budget: item.budget, email: item.email || '', source: item.source, assignedTo, assignedToName, assignmentDate: assignedTo ? new Date().toISOString() : null, notes: [], status: 'Open' });
          setImportStats(prev => ({ ...prev, success: prev.success + 1, current: prev.current + 1 }));
        }
      });
    }
    setStep(4);
  };

  const handleDownloadSkipped = () => {
    const skipped = data.filter(d => !d.isValid);
    const csvContent = 'data:text/csv;charset=utf-8,Name,Phone,Budget,Error,Existing Assigned To,Existing Status\n'
      + skipped.map(r => `${r.name},${r.phone},${r.budget},"${r.errors.join('; ')}","${r.duplicateInfo ? r.duplicateInfo.assignedTo : ''}","${r.duplicateInfo ? r.duplicateInfo.status : ''}"`).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', 'skipped_leads.csv');
    document.body.appendChild(link);
    link.click();
  };

  const reset = () => {
    setFile(null); setPastedText(''); setData([]); setStep(1);
    setSelectedEmployeeId(''); setReassignSelections({});
    setImportStats({ total: 0, current: 0, success: 0, failed: 0, reassigned: 0 });
  };

  const statusColor = (status) => {
    switch ((status || '').toLowerCase()) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'won': return 'bg-green-100 text-green-700';
      case 'lost': return 'bg-red-100 text-red-700';
      case 'follow up': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const duplicateRows = data.filter(d => d.duplicateInfo);
  const pendingReassigns = duplicateRows.filter((_, i) => {
    const idx = data.indexOf(duplicateRows[i]);
    return reassignSelections[idx] && reassignSelections[idx] !== '__none__' && !duplicateRows[i].reassigned;
  });

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) reset(); onClose(open); }}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Import Leads</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col">
          {step === 1 && (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
              <div className="px-6 pt-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="file">Upload File (CSV/Excel)</TabsTrigger>
                  <TabsTrigger value="paste">Copy &amp; Paste</TabsTrigger>
                </TabsList>
              </div>
              <div className="flex-1 p-6 overflow-y-auto">
                <TabsContent value="file" className="mt-0 h-full flex flex-col gap-4">
                  <div className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all p-10" onClick={() => fileInputRef.current.click()}>
                    <div className="bg-white p-4 rounded-full shadow-sm mb-4"><Upload className="h-8 w-8 text-blue-600" /></div>
                    <h3 className="text-lg font-semibold text-gray-900">{file ? file.name : 'Click to upload'}</h3>
                    <p className="text-sm text-gray-500 mt-2">{file ? `${(file.size / 1024).toFixed(2)} KB` : 'Supports .csv, .xlsx, .xls'}</p>
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                  </div>
                  {file && <div className="flex justify-end"><Button onClick={parseFile}>Parse File <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
                </TabsContent>
                <TabsContent value="paste" className="mt-0 h-full flex flex-col gap-4">
                  <Textarea placeholder="Example: Rahul Kumar | 9876543210 | 50L" className="flex-1 font-mono text-sm min-h-[300px]" value={pastedText} onChange={(e) => setPastedText(e.target.value)} />
                  <div className="flex justify-end"><Button onClick={handlePasteParse} disabled={!pastedText.trim()}>Parse Data <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
                </TabsContent>
              </div>
            </Tabs>
          )}

          {step === 2 && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900">Review Data</h3>
                  <p className="text-sm text-gray-500">Found {data.length} rows. {data.filter(r => !r.isValid).length} skipped.</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Reassign All button — only shows when there are pending reassign selections */}
                  {pendingReassigns.length > 0 && (
                    <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50" onClick={handleReassignAll}>
                      <RefreshCw className="w-3.5 h-3.5 mr-1" />
                      Reassign {pendingReassigns.length} Selected
                    </Button>
                  )}
                  <div className="flex items-center gap-2">
                    <UserPlus size={16} className="text-gray-500" />
                    <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                      <SelectTrigger className="w-[180px] h-9 bg-white"><SelectValue placeholder="Assign to..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                        {employees.map(emp => <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateLeads} disabled={data.filter(d => d.isValid).length === 0} className="bg-green-600 hover:bg-green-700">
                    Import {data.filter(d => d.isValid).length} Leads
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden bg-white">
                <div className="overflow-auto h-full">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                      <tr>
                        <th className="p-3 w-10">#</th>
                        <th className="p-3">Name</th>
                        <th className="p-3">Phone</th>
                        <th className="p-3">Source (Auto)</th>
                        <th className="p-3">Status / Duplicate Info</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.map((row, i) => (
                        <tr key={i} className={`hover:bg-gray-50 ${!row.isValid ? 'bg-red-50' : ''} ${row.reassigned ? 'bg-green-50' : ''}`}>
                          <td className="p-3 text-center">
                            {row.reassigned
                              ? <CheckCircle size={16} className="text-green-500" />
                              : row.isValid
                                ? <CheckCircle size={16} className="text-green-500" />
                                : <XCircle size={16} className="text-red-500" />}
                          </td>
                          <td className="p-3 font-medium">{row.name}</td>
                          <td className="p-3 font-mono">{row.phone}</td>
                          <td className="p-3"><Badge variant="outline">{row.source}</Badge></td>
                          <td className="p-3 text-xs">
                            {row.isValid ? (
                              <span className="text-gray-500">Ready</span>
                            ) : row.reassigned ? (
                              <span className="text-green-600 font-semibold">✓ Reassigned to {row.duplicateInfo.assignedTo}</span>
                            ) : row.duplicateInfo ? (
                              <div className="flex flex-col gap-1.5">
                                <div className="flex flex-wrap items-center gap-1">
                                  <span className="text-red-600 font-semibold">Duplicate Phone</span>
                                  <span className="inline-flex items-center gap-1 bg-orange-50 border border-orange-200 text-orange-700 rounded px-1.5 py-0.5 text-[11px] font-medium">
                                    👤 {row.duplicateInfo.assignedTo}
                                  </span>
                                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${statusColor(row.duplicateInfo.status)}`}>
                                    {row.duplicateInfo.status}
                                  </span>
                                  {row.duplicateInfo.source && (
                                    <span className="inline-flex items-center bg-gray-100 text-gray-500 rounded px-1.5 py-0.5 text-[11px]">
                                      {row.duplicateInfo.source}
                                    </span>
                                  )}
                                </div>
                                {/* Per-row reassign controls */}
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <Select
                                    value={reassignSelections[i] || '__none__'}
                                    onValueChange={(val) => setReassignSelections(prev => ({ ...prev, [i]: val }))}
                                  >
                                    <SelectTrigger className="h-7 text-xs w-[150px] bg-white border-orange-300">
                                      <SelectValue placeholder="Reassign to..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="__none__">-- Select employee --</SelectItem>
                                      <SelectItem value="unassigned_emp">Unassigned</SelectItem>
                                      {employees.map(emp => (
                                        <SelectItem key={emp.id} value={emp.id}>{emp.name}</SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 text-xs px-2 border-orange-400 text-orange-700 hover:bg-orange-50"
                                    disabled={!reassignSelections[i] || reassignSelections[i] === '__none__'}
                                    onClick={() => handleReassign(i)}
                                  >
                                    <RefreshCw className="w-3 h-3 mr-1" /> Reassign
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <span className="text-red-600 font-medium">{row.errors.join(', ')}</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-6">
              <div className="w-full max-w-md space-y-2">
                <div className="flex justify-between text-sm font-medium"><span>Importing...</span><span>{importStats.current} / {importStats.total}</span></div>
                <Progress value={(importStats.current / importStats.total) * 100} className="h-3" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex-1 flex flex-col items-center justify-center p-10 space-y-8 animate-in fade-in zoom-in duration-300">
              <div className="bg-green-100 p-4 rounded-full"><CheckCircle className="h-12 w-12 text-green-600" /></div>
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-gray-900">Import Complete!</h2>
                <div className="flex gap-4 justify-center text-sm">
                  <span className="text-green-600 font-bold">{importStats.success} Imported</span>
                  <span className="text-red-500 font-bold">{importStats.failed + data.filter(d => !d.isValid).length} Skipped</span>
                </div>
              </div>
              <div className="flex gap-2">
                {data.some(d => !d.isValid) && (
                  <Button variant="outline" onClick={handleDownloadSkipped}><Download className="w-4 h-4 mr-2" /> Download Skipped</Button>
                )}
                <Button onClick={() => { onClose(false); reset(); }}>Done</Button>
              </div>
            </div>
          )}
        </div>

        {(step === 1 || step === 2) && (
          <div className="px-6 py-4 border-t bg-white flex justify-between">
            <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(1)}>{step === 1 ? 'Cancel' : 'Back'}</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ImportLeadsModal;
