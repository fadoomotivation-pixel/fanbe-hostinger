
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Upload, FileUp, AlertTriangle, CheckCircle, Copy, FileSpreadsheet, XCircle, ArrowRight, UserPlus, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

const ImportLeadsModal = ({ isOpen, onClose, employees = [] }) => {
  const { addLead, leads } = useCRMData();
  const { toast } = useToast();
  const fileInputRef = useRef(null);
  
  const [activeTab, setActiveTab] = useState('file');
  const [file, setFile] = useState(null);
  const [pastedText, setPastedText] = useState('');
  
  const [data, setData] = useState([]);
  const [step, setStep] = useState(1); 
  const [importStats, setImportStats] = useState({ total: 0, current: 0, success: 0, failed: 0 });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');

  // Improved Smart Source Detection Maps
  const COLUMN_ALIASES = {
      name: ['name', 'first_name', 'full_name', 'lead_name', 'client_name', 'customer_name', 'firstname', 'fullname', 'full name'],
      phone: ['phone', 'mobile', 'contact', 'cell', 'phone_number', 'phonenumber', 'contact_number', 'mobile_number', 'whatsapp', 'phone number'],
      budget: ['budget', 'price', 'range', 'amount', 'investment', 'आपका_बजट_कितना_है?', 'client_budget'],
      email: ['email', 'e-mail', 'email_address', 'mail'],
      source: ['source', 'lead_source', 'platform'],
      // Source clues for Facebook/Instagram/Google ads
      ad_clues: ['ad_name', 'campaign', 'adset_name', 'campaign_name', 'ad name', 'campaign name'],
      form_clues: ['form_id', 'form_name', 'form name'],
      platform_clues: ['platform'] // fb, ig, google
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({ title: "Error", description: "File size exceeds 10MB limit.", variant: "destructive" });
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
        
        // Check if it's a CSV/TSV file by extension
        const isCSV = file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.tsv');
        
        if (isCSV) {
          // Handle CSV/TSV files (including Facebook Lead Ads format)
          // Try to detect encoding and parse
          Papa.parse(rawData, {
            header: false,
            skipEmptyLines: true,
            delimiter: '', // Auto-detect (handles tabs and commas)
            encoding: 'UTF-16LE', // Support UTF-16
            complete: (results) => {
              if (results.data && results.data.length >= 2) {
                let headers = results.data[0];
                let rows = results.data.slice(1);
                
                // Clean headers (remove BOM and extra spaces)
                headers = headers.map(h => String(h).trim().replace(/^\uFEFF/, ''));
                
                // Filter out empty rows
                rows = rows.filter(row => row.some(cell => cell && String(cell).trim()));
                
                if (rows.length === 0) {
                  toast({ title: "Error", description: "No valid data rows found in file.", variant: "destructive" });
                  return;
                }
                
                processParsedData(headers, rows, 'File Import');
              } else {
                toast({ title: "Error", description: "File is empty or missing data.", variant: "destructive" });
              }
            },
            error: (error) => {
              console.error('Papa Parse Error:', error);
              toast({ title: "Error", description: "Failed to parse CSV file.", variant: "destructive" });
            }
          });
        } else {
          // Handle Excel files (.xlsx, .xls)
          const data = new Uint8Array(rawData);
          const wb = XLSX.read(data, { type: 'array' });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          
          const json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
          if (json.length < 2) {
              toast({ title: "Error", description: "File is empty or missing headers.", variant: "destructive" });
              return;
          }

          const headers = json[0].map(h => String(h).trim());
          const rows = json.slice(1);
          processParsedData(headers, rows, 'File Import');
        }
      } catch (err) {
        console.error('File Parse Error:', err);
        toast({ title: "Error", description: "Failed to parse file. Please ensure it's a valid CSV or Excel file.", variant: "destructive" });
      }
    };
    
    // Read as text for CSV, arraybuffer for Excel
    if (file.name.toLowerCase().endsWith('.csv') || file.name.toLowerCase().endsWith('.tsv')) {
      reader.readAsText(file, 'UTF-16LE'); // Try UTF-16 first for Facebook files
    } else {
      reader.readAsArrayBuffer(file);
    }
  };

  const handlePasteParse = () => {
      if (!pastedText.trim()) return;

      Papa.parse(pastedText, {
          header: false,
          skipEmptyLines: true,
          complete: (results) => {
              if (results.data && results.data.length > 0) {
                  let headers = results.data[0];
                  let rows = results.data.slice(1);
                  
                  const looksLikeHeader = headers.some(h => COLUMN_ALIASES.name.includes(String(h).toLowerCase()) || COLUMN_ALIASES.phone.includes(String(h).toLowerCase()));
                  
                  if (!looksLikeHeader && results.data.length > 0) {
                      rows = results.data;
                      headers = ["Name", "Phone", "Budget", "Source"];
                  }

                  processParsedData(headers, rows, 'Manual Paste');
              }
          }
      });
  };

  const getColumnIndex = (headers, type) => {
      const aliases = COLUMN_ALIASES[type];
      return headers.findIndex(h => aliases.includes(String(h).toLowerCase()));
  };

  const detectSource = (row, map, sourceDefault) => {
      // 1. Check explicit source/platform column
      if (map.sourceIdx !== -1 && row[map.sourceIdx]) {
        const platform = String(row[map.sourceIdx]).toLowerCase().trim();
        if (platform === 'fb') return 'Facebook Ads';
        if (platform === 'ig') return 'Instagram Ads';
        if (platform === 'google') return 'Google Ads';
        return row[map.sourceIdx];
      }
      
      // 2. Check platform clues column
      if (map.platformClueIdx !== -1 && row[map.platformClueIdx]) {
        const platform = String(row[map.platformClueIdx]).toLowerCase().trim();
        if (platform === 'fb') return 'Facebook Ads';
        if (platform === 'ig') return 'Instagram Ads';
        if (platform === 'google') return 'Google Ads';
      }
      
      // 3. Check Ad clues
      if (map.adClueIdx !== -1 && row[map.adClueIdx]) {
           const val = String(row[map.adClueIdx]).toLowerCase();
           if(val.includes('google')) return 'Google Ads';
           if(val.includes('facebook') || val.includes('fb')) return 'Facebook Ads';
           if(val.includes('instagram') || val.includes('ig')) return 'Instagram Ads';
           // Default to Facebook Ads if ad_name exists
           return 'Facebook Ads';
      }

      // 4. Check Form clues
      if (map.formClueIdx !== -1 && row[map.formClueIdx]) return 'Website Form';

      // 5. Fallback
      return sourceDefault;
  };

  const processParsedData = (headers, rows, sourceDefault) => {
        // Map Columns
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

        const processed = rows.map((row, idx) => {
            const detectedSource = detectSource(row, map, sourceDefault);
            
            // Clean phone number (remove 'p:', '+', extra spaces)
            let phone = map.phoneIdx !== -1 ? String(row[map.phoneIdx]) : (row[1] || '');
            phone = phone.replace(/^p:/, '').replace(/\+/g, '').trim();
            
            const lead = {
                id: idx,
                name: map.nameIdx !== -1 ? String(row[map.nameIdx]).trim() : (row[0] || ''),
                phone: phone,
                budget: map.budgetIdx !== -1 ? row[map.budgetIdx] : (row[2] || ''),
                email: map.emailIdx !== -1 ? row[map.emailIdx] : '',
                source: detectedSource,
                isValid: true,
                errors: []
            };

            // Validation
            if (!lead.name || String(lead.name).trim() === '') {
                lead.isValid = false;
                lead.errors.push("Missing Name");
            }
            
            const cleanPhone = String(lead.phone).replace(/[^0-9]/g, '');
            if (cleanPhone.length < 10) {
                lead.isValid = false;
                lead.errors.push("Invalid Phone (10+ digits)");
            } else {
                lead.phone = cleanPhone;
                // Duplicate Check in Current Batch is handled implicitly by user review, 
                // Global Duplicate Check happens at import time or here? 
                // Let's do a soft check here against existing DB
                if (leads.some(l => l.phone === cleanPhone)) {
                    lead.isValid = false;
                    lead.errors.push("Duplicate Phone");
                }
            }

            if (lead.budget && isNaN(String(lead.budget).replace(/[^0-9.]/g, ''))) {
                lead.errors.push("Check Budget Format"); // Warning
            }

            return lead;
        });

        setData(processed);
        setStep(2);
  };

  const handleCreateLeads = async () => {
    setStep(3);
    const validLeads = data.filter(d => d.isValid);
    setImportStats({ total: validLeads.length, current: 0, success: 0, failed: 0 });

    let assignedTo = null;
    let assignedToName = null;
    
    if (selectedEmployeeId) {
        const emp = employees.find(e => e.id === selectedEmployeeId);
        if (emp) {
            assignedTo = emp.id;
            assignedToName = emp.name;
        }
    }

    const batchSize = 10;
    for (let i = 0; i < validLeads.length; i += batchSize) {
         const batch = validLeads.slice(i, i + batchSize);
         await new Promise(r => setTimeout(r, 100));

         batch.forEach(item => {
             // Double check duplicates (race condition protection)
             const isDuplicate = leads.some(l => l.phone === item.phone);
             if (isDuplicate) {
                 setImportStats(prev => ({ ...prev, failed: prev.failed + 1, current: prev.current + 1 }));
             } else {
                 addLead({
                     name: item.name,
                     phone: item.phone,
                     budget: item.budget,
                     source: item.source,
                     assignedTo: assignedTo,
                     assignedToName: assignedToName,
                     assignmentDate: assignedTo ? new Date().toISOString() : null,
                     notes: [],
                     status: 'Open' // Default
                 });
                 setImportStats(prev => ({ ...prev, success: prev.success + 1, current: prev.current + 1 }));
             }
         });
    }
    setStep(4);
  };
  
  const handleDownloadSkipped = () => {
      const skipped = data.filter(d => !d.isValid);
      const csvContent = "data:text/csv;charset=utf-8," 
          + "Name,Phone,Budget,Error\n"
          + skipped.map(r => `${r.name},${r.phone},${r.budget},"${r.errors.join('; ')}"`).join("\n");
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "skipped_leads.csv");
      document.body.appendChild(link);
      link.click();
  };

  const reset = () => {
      setFile(null);
      setPastedText('');
      setData([]);
      setStep(1);
      setSelectedEmployeeId('');
      setImportStats({ total: 0, current: 0, success: 0, failed: 0 });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if(!open) reset(); onClose(open); }}>
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
                            <TabsTrigger value="paste">Copy & Paste</TabsTrigger>
                        </TabsList>
                    </div>
                    
                    <div className="flex-1 p-6 overflow-y-auto">
                        <TabsContent value="file" className="mt-0 h-full flex flex-col gap-4">
                            <div 
                                className="flex-1 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all p-10"
                                onClick={() => fileInputRef.current.click()}
                            >
                                <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                    <Upload className="h-8 w-8 text-blue-600" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">{file ? file.name : "Click to upload"}</h3>
                                <p className="text-sm text-gray-500 mt-2">{file ? `${(file.size / 1024).toFixed(2)} KB` : "Supports .csv, .xlsx, .xls"}</p>
                                <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                            </div>
                            {file && <div className="flex justify-end"><Button onClick={parseFile}>Parse File <ArrowRight className="ml-2 h-4 w-4" /></Button></div>}
                        </TabsContent>

                        <TabsContent value="paste" className="mt-0 h-full flex flex-col gap-4">
                            <Textarea 
                                placeholder="Example: Rahul Kumar | 9876543210 | 50L"
                                className="flex-1 font-mono text-sm min-h-[300px]"
                                value={pastedText}
                                onChange={(e) => setPastedText(e.target.value)}
                            />
                            <div className="flex justify-end"><Button onClick={handlePasteParse} disabled={!pastedText.trim()}>Parse Data <ArrowRight className="ml-2 h-4 w-4" /></Button></div>
                        </TabsContent>
                    </div>
                </Tabs>
            )}

            {step === 2 && (
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
                        <div>
                            <h3 className="font-semibold text-gray-900">Review Data</h3>
                            <p className="text-sm text-gray-500">Found {data.length} rows. {data.filter(r => !r.isValid).length} skipped.</p>
                        </div>
                        <div className="flex items-center gap-3">
                             <div className="flex items-center gap-2">
                                 <UserPlus size={16} className="text-gray-500"/>
                                 <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                                    <SelectTrigger className="w-[200px] h-9 bg-white"><SelectValue placeholder="Assign to..." /></SelectTrigger>
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

                    <div className="flex-1 overflow-hidden p-0 bg-white">
                         <div className="overflow-auto h-full">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-100 sticky top-0 z-10 shadow-sm">
                                    <tr>
                                        <th className="p-3 w-10">#</th>
                                        <th className="p-3">Name</th>
                                        <th className="p-3">Phone</th>
                                        <th className="p-3">Source (Auto)</th>
                                        <th className="p-3">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {data.map((row, i) => (
                                        <tr key={i} className={`hover:bg-gray-50 ${!row.isValid ? 'bg-red-50' : ''}`}>
                                            <td className="p-3 text-center">{row.isValid ? <CheckCircle size={16} className="text-green-500" /> : <XCircle size={16} className="text-red-500" />}</td>
                                            <td className="p-3 font-medium">{row.name}</td>
                                            <td className="p-3 font-mono">{row.phone}</td>
                                            <td className="p-3"><Badge variant="outline">{row.source}</Badge></td>
                                            <td className="p-3 text-xs text-gray-500">{row.isValid ? 'Ready' : <span className="text-red-600 font-medium">{row.errors.join(', ')}</span>}</td>
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
                             <span className="text-green-600 font-bold">{importStats.success} Success</span>
                             <span className="text-red-500 font-bold">{importStats.failed + data.filter(d => !d.isValid).length} Skipped/Failed</span>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        {data.some(d => !d.isValid) && (
                            <Button variant="outline" onClick={handleDownloadSkipped}>
                                <Download className="w-4 h-4 mr-2" /> Download Skipped Rows
                            </Button>
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
