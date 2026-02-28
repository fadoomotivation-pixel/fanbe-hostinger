import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { supabaseAdmin } from '@/lib/supabase';
import { Upload, Download, CheckCircle, AlertCircle, FileText, Loader2, Users } from 'lucide-react';

const ImportLeads = () => {
  const { user } = useAuth();
  const { employees, projects, fetchLeads } = useCRMData();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is Super Admin or Sub Admin
  if (!['super_admin', 'sub_admin'].includes(user?.role)) {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only Super Admin and Sub Admin can import leads.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Parse date from multiple formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY, etc.
  const parseFlexibleDate = (dateString) => {
    if (!dateString || !dateString.trim()) return null;
    
    const cleaned = dateString.trim();
    
    // Try parsing as-is first (works for YYYY-MM-DD and ISO formats)
    let parsed = new Date(cleaned);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split('T')[0]; // Return YYYY-MM-DD
    }
    
    // Try DD/MM/YYYY or DD-MM-YYYY format (common in Excel exports)
    const dmyMatch = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (dmyMatch) {
      const [, day, month, year] = dmyMatch;
      parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    // Try MM/DD/YYYY format
    const mdyMatch = cleaned.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (mdyMatch) {
      const [, month, day, year] = mdyMatch;
      parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    // Try YYYY/MM/DD format
    const ymdMatch = cleaned.match(/^(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})$/);
    if (ymdMatch) {
      const [, year, month, day] = ymdMatch;
      parsed = new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
    }
    
    return null;
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');

    // Auto-detect delimiter: if header line has tabs, use tab; otherwise use comma
    const headerLine = lines[0];
    const delimiter = headerLine.includes('\t') ? '\t' : ',';

    const headers = headerLine.split(delimiter).map(h => h.trim().toLowerCase());

    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;

      let values;
      if (delimiter === '\t') {
        // Tab-separated: split by tab
        values = lines[i].split('\t').map(v => v.trim());
      } else {
        // Comma-separated: handle commas in quoted fields
        const regex = /(?:,|\n|^)("(?:(?:"")*[^"]*)*"|[^",\n]*|(?:\n|$))/g;
        values = [];
        let match;

        while ((match = regex.exec(lines[i])) !== null) {
          let value = match[1];
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1).replace(/""/g, '"');
          }
          values.push(value.trim());
        }
      }

      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });

      // Skip rows where all values are empty
      if (Object.values(row).every(v => !v)) continue;

      data.push(row);
    }
    return data;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv') && !selectedFile.name.endsWith('.tsv')) {
      setError('Please upload a CSV or TSV file');
      return;
    }
    
    setFile(selectedFile);
    setError(null);
    setResult(null);
    
    // Read and preview CSV
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvData = parseCSV(event.target.result);
        setPreview(csvData.slice(0, 5)); // Show first 5 rows
      } catch (err) {
        setError('Error parsing CSV file: ' + err.message);
      }
    };
    reader.readAsText(selectedFile);
  };

  const normalizePhone = (phone) => {
    // Remove all non-digit characters
    let cleaned = phone.replace(/\D/g, '');
    
    // Handle different formats
    if (cleaned.startsWith('91') && cleaned.length === 12) {
      return '+' + cleaned;
    } else if (cleaned.startsWith('0') && cleaned.length === 11) {
      return '+91' + cleaned.slice(1);
    } else if (cleaned.length === 10) {
      return '+91' + cleaned;
    }
    
    return '+91' + cleaned; // Default fallback
  };

  const validateRow = (row, rowNumber) => {
    const errors = [];
    
    // Required fields
    if (!row.lead_name || row.lead_name.length < 2) {
      errors.push('Invalid or missing lead name');
    }
    
    if (!row.phone || row.phone.length < 10) {
      errors.push('Invalid or missing phone number');
    }
    
    // Flexible date validation - date is optional, defaults to today
    if (row.date && row.date.trim()) {
      const parsedDate = parseFlexibleDate(row.date);
      if (!parsedDate) {
        errors.push(`Invalid date format: ${row.date}`);
      }
    }
    
    // Optional but validated if present
    if (row.interest_level && !['hot', 'warm', 'cold'].includes(row.interest_level.toLowerCase())) {
      errors.push('Interest level must be hot, warm, or cold');
    }
    
    // More flexible call status matching
    if (row.call_status) {
      const status = row.call_status.toLowerCase().replace(/[\s_-]+/g, ' ').trim();
      const validStatuses = ['connected', 'not answered', 'call back requested', 'busy', 'switched off', 'switch off', 'invalid number', 'not reached', 'call back'];
      if (!validStatuses.some(vs => status.includes(vs) || vs.includes(status))) {
        errors.push(`Invalid call status: ${row.call_status}`);
      }
    }
    
    if (row.final_status && !['new', 'follow up', 'site visit', 'booked', 'lost', 'not interested'].includes(row.final_status.toLowerCase().replace(/[\s_-]+/g, ' '))) {
      errors.push('Invalid final status');
    }
    
    return errors;
  };

  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/sample_leads_import.csv';
    link.download = 'sample_leads_import.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    setError(null);
    setResult(null);
    
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        try {
          const csvData = parseCSV(event.target.result);
          
          let successCount = 0;
          let errorCount = 0;
          let duplicateCount = 0;
          const errors = [];
          
          for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNumber = i + 2; // +2 because row 1 is header and arrays are 0-indexed
            
            // Validate row
            const validationErrors = validateRow(row, rowNumber);
            if (validationErrors.length > 0) {
              errors.push(`Row ${rowNumber} (${row.lead_name || 'Unknown'}): ${validationErrors.join(', ')}`);
              errorCount++;
              continue;
            }
            
            // Normalize phone number
            const phone = normalizePhone(row.phone);
            
            // Parse date flexibly - default to today if empty
            const parsedDate = (row.date && row.date.trim())
              ? parseFlexibleDate(row.date)
              : new Date().toISOString().split('T')[0];
            if (!parsedDate) {
              errors.push(`Row ${rowNumber}: Could not parse date: ${row.date}`);
              errorCount++;
              continue;
            }
            
            // Check for duplicate phone number - FIX: Use array instead of .single()
            const { data: existingLeads, error: checkError } = await supabaseAdmin
              .from('leads')
              .select('id, name')
              .eq('phone', phone)
              .limit(1);
            
            if (checkError) {
              console.error('Duplicate check error:', checkError);
              // Continue anyway, let unique constraint handle it
            }
            
            if (existingLeads && existingLeads.length > 0) {
              errors.push(`Row ${rowNumber}: Duplicate phone ${phone} (Existing lead: ${existingLeads[0].name})`);
              duplicateCount++;
              errorCount++;
              continue;
            }
            
            // Find employee by email (if provided)
            let employeeId = null;
            if (row.assigned_to_email) {
              const employee = employees.find(e => e.email === row.assigned_to_email);
              if (!employee) {
                errors.push(`Row ${rowNumber}: Employee not found (${row.assigned_to_email})`);
                errorCount++;
                continue;
              }
              employeeId = employee.id;
            }
            
            // Normalize call status
            let callStatus = null;
            if (row.call_status) {
              const status = row.call_status.toLowerCase().replace(/[\s_-]+/g, '_');
              if (status.includes('connect')) callStatus = 'connected';
              else if (status.includes('not_answer') || status.includes('no_answer')) callStatus = 'not_answered';
              else if (status.includes('call_back')) callStatus = 'call_back_requested';
              else if (status.includes('busy')) callStatus = 'busy';
              else if (status.includes('switch_off') || status.includes('switched_off')) callStatus = 'switched_off';
              else if (status.includes('not_reach')) callStatus = 'not_answered';
              else callStatus = status;
            }
            
            // Create lead object
            const leadData = {
              name: row.lead_name.trim(),
              phone: phone,
              email: row.email || null,
              source: row.lead_source || 'Import',
              status: row.final_status ? row.final_status.toLowerCase().replace(/\s+/g, '_') : 'new',
              interest_level: row.interest_level ? row.interest_level.toLowerCase() : 'warm',
              project_name: row.project_name || null,
              budget: row.budget || null,
              notes: row.notes || row.buyer_feedback || '',
              assigned_to: employeeId,
              created_at: new Date(parsedDate + 'T00:00:00Z').toISOString(),
              updated_at: new Date().toISOString(),
            };
            
            // Insert lead - FIX: Remove .single() to avoid 406 error
            const { data: newLeadArray, error: leadError } = await supabaseAdmin
              .from('leads')
              .insert(leadData)
              .select();
            
            if (leadError) {
              errors.push(`Row ${rowNumber} (${row.lead_name}): ${leadError.message}`);
              errorCount++;
              continue;
            }
            
            const newLead = newLeadArray && newLeadArray.length > 0 ? newLeadArray[0] : null;
            if (!newLead) {
              errors.push(`Row ${rowNumber} (${row.lead_name}): Failed to create lead`);
              errorCount++;
              continue;
            }
            
            // If call data provided, create call record
            if (callStatus && row.call_attempt) {
              await supabaseAdmin.from('calls').insert({
                employee_id: employeeId,
                lead_id: newLead.id,
                lead_name: row.lead_name,
                phone: phone,
                project_name: row.project_name || null,
                call_type: 'outbound',
                status: callStatus,
                duration: callStatus === 'connected' ? 120 : 0,
                notes: row.buyer_feedback || 'Imported call',
                feedback: row.buyer_feedback || '',
                call_date: parsedDate,
                created_at: new Date(parsedDate + 'T00:00:00Z').toISOString(),
              });
            }
            
            // If site visit data provided, create site visit record
            if (row.site_visit_status === 'visited' || row.site_visit_status === 'planned') {
              await supabaseAdmin.from('site_visits').insert({
                employee_id: employeeId,
                lead_id: newLead.id,
                lead_name: row.lead_name,
                phone: phone,
                project_name: row.project_name || null,
                visit_date: parsedDate,
                visit_time: '14:00',
                status: row.site_visit_status === 'visited' ? 'completed' : 'scheduled',
                location: row.project_name || 'Site',
                duration: 60,
                notes: row.buyer_feedback || 'Imported site visit',
                feedback: row.buyer_feedback || '',
                interest_level: row.interest_level ? row.interest_level.toLowerCase() : null,
                created_at: new Date(parsedDate + 'T00:00:00Z').toISOString(),
              });
            }
            
            // If follow-up date provided, create task
            if (row.next_followup_date && row.next_followup_date.trim()) {
              const followupDate = parseFlexibleDate(row.next_followup_date);
              if (followupDate) {
                await supabaseAdmin.from('tasks').insert({
                  employee_id: employeeId,
                  title: `Follow up: ${row.lead_name}`,
                  description: row.buyer_feedback || 'Follow up call',
                  type: 'call',
                  priority: row.interest_level === 'hot' ? 'high' : 'medium',
                  status: 'pending',
                  due_date: followupDate,
                  related_lead_id: newLead.id,
                  created_at: new Date().toISOString(),
                });
              }
            }
            
            successCount++;
          }
          
          // Refresh leads data
          await fetchLeads();
          
          setResult({
            success: successCount,
            errors: errorCount,
            duplicates: duplicateCount,
            details: errors.slice(0, 20), // Show first 20 errors
          });
        } catch (err) {
          setError('Import error: ' + err.message);
        } finally {
          setImporting(false);
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Error reading file: ' + err.message);
      setImporting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Users className="h-8 w-8 text-[#0F3A5F]" />
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Import Leads (Bulk Upload)</h1>
          <p className="text-sm text-gray-500 mt-1">Upload CSV file to import leads with call logs and follow-ups</p>
        </div>
      </div>

      {/* Download Sample */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Download Sample CSV Template</p>
                <p className="text-xs text-blue-700">Use this template to format your lead data correctly</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={handleDownloadSample}
            >
              <Download size={16} className="mr-2" />
              Download Sample
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CSV Format Info */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Required CSV Format</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <p className="text-xs font-mono text-gray-700 mb-2 whitespace-nowrap">
              date,lead_name,phone,lead_source,call_attempt,call_status,interest_level,buyer_feedback,next_followup_date,site_visit_status,final_status,budget,assigned_to_email,project_name,notes
            </p>
            <p className="text-xs text-gray-600 whitespace-nowrap">
              31/01/2026,A Singh,8851481867,Website,1st,connected,hot,today visit,01/02/2026,visited,site visit,₹8–12 लाख,nidhi@fanbegroup.com,Maa Simri Vatika,follow up
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-1">📋 Required Fields:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li><code>lead_name</code> - Full name</li>
                <li><code>phone</code> - 10-digit number</li>
                <li><code>date</code> - DD/MM/YYYY or YYYY-MM-DD (optional, defaults to today)</li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold text-gray-700 mb-1">📞 Call Fields:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li><code>call_status</code> - connected, not answered, busy, etc.</li>
                <li><code>interest_level</code> - hot, warm, cold</li>
                <li><code>buyer_feedback</code> - Free text</li>
              </ul>
            </div>
            
            <div>
              <p className="font-semibold text-gray-700 mb-1">✅ Optional Fields:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li><code>lead_source</code> - Website, Facebook, etc.</li>
                <li><code>next_followup_date</code> - Any date format</li>
                <li><code>site_visit_status</code> - visited, planned, not planned</li>
                <li><code>final_status</code> - new, follow up, site visit, booked, lost</li>
                <li><code>budget</code> - Price range</li>
                <li><code>assigned_to_email</code> - Employee email</li>
                <li><code>project_name</code> - Project name</li>
                <li><code>notes</code> - Additional notes</li>
              </ul>
            </div>
          </div>

          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-800">
              <strong>Flexible Formatting:</strong> Supports both CSV (comma) and TSV (tab) files. Date formats: DD/MM/YYYY, YYYY-MM-DD, MM/DD/YYYY (leave blank for today). Phone numbers will auto-add +91 prefix. Duplicate phones are skipped.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Upload CSV File</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv,.tsv"
              onChange={handleFileChange}
              className="hidden"
              id="csv-upload"
              disabled={importing}
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center"
            >
              <Upload className="h-12 w-12 text-gray-400 mb-3" />
              <p className="text-sm font-medium text-gray-700">Click to upload CSV file</p>
              <p className="text-xs text-gray-500 mt-1">or drag and drop</p>
            </label>
          </div>

          {file && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-green-800">{file.name}</span>
                <span className="text-xs text-green-600">({preview.length} leads preview)</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFile(null);
                  setPreview([]);
                  setResult(null);
                }}
                disabled={importing}
              >
                Remove
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview */}
      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Preview (First 5 Leads)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold">Name</th>
                    <th className="px-3 py-2 text-left font-semibold">Phone</th>
                    <th className="px-3 py-2 text-left font-semibold">Source</th>
                    <th className="px-3 py-2 text-center font-semibold">Interest</th>
                    <th className="px-3 py-2 text-left font-semibold">Status</th>
                    <th className="px-3 py-2 text-left font-semibold">Budget</th>
                    <th className="px-3 py-2 text-left font-semibold">Assigned To</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium">{row.lead_name}</td>
                      <td className="px-3 py-2">{row.phone}</td>
                      <td className="px-3 py-2">{row.lead_source || 'Import'}</td>
                      <td className="px-3 py-2 text-center">
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          row.interest_level === 'hot' ? 'bg-red-100 text-red-700' :
                          row.interest_level === 'warm' ? 'bg-orange-100 text-orange-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {row.interest_level || 'warm'}
                        </span>
                      </td>
                      <td className="px-3 py-2">{row.final_status || 'new'}</td>
                      <td className="px-3 py-2">{row.budget || '-'}</td>
                      <td className="px-3 py-2 text-xs text-gray-500">{row.assigned_to_email || 'Unassigned'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Button */}
      {file && !result && (
        <Button
          onClick={handleImport}
          disabled={importing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white h-12 text-base font-semibold"
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Importing Leads... This may take a few minutes
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Import {preview.length} Leads
            </>
          )}
        </Button>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Success Result */}
      {result && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">Import Completed</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-green-800">
                    ✓ <strong>{result.success}</strong> leads imported successfully
                  </p>
                  {result.duplicates > 0 && (
                    <p className="text-yellow-700">
                      ⚠ <strong>{result.duplicates}</strong> duplicates skipped (phone already exists)
                    </p>
                  )}
                  {result.errors - result.duplicates > 0 && (
                    <p className="text-red-700">
                      ✗ <strong>{result.errors - result.duplicates}</strong> rows had validation errors
                    </p>
                  )}
                </div>
                
                {result.details && result.details.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded border border-orange-200 max-h-64 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-700 mb-2">Error Details (First 20):</p>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {result.details.map((err, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-red-500 flex-shrink-0">•</span>
                          <span>{err}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="mt-4 flex gap-2">
                  <Button
                    onClick={() => window.location.href = '/crm/admin/leads'}
                  >
                    View All Leads
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                      setResult(null);
                    }}
                  >
                    Import More Leads
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportLeads;
