import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, Download, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';

const ImportLeads = () => {
  const { user } = useAuth();
  const { employees, addLead, fetchLeads } = useCRMData();
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Check if user is Super Admin
  if (user?.role !== 'super_admin') {
    return (
      <div className="max-w-2xl mx-auto py-10 px-4">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Access denied. Only Super Admin can import leads.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Handle quoted values with commas
      const regex = /,(?=(?:(?:[^"]*"){2})*[^"]*$)/;
      const values = lines[i].split(regex);
      
      if (values.length < headers.length) continue;
      
      const row = {};
      headers.forEach((header, index) => {
        let value = values[index]?.trim() || '';
        value = value.replace(/^"|"$/g, ''); // Remove surrounding quotes
        row[header] = value === '' ? null : value;
      });
      data.push(row);
    }
    return data;
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
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

  const validateRow = (row, rowNum) => {
    const errors = [];
    
    // Required fields
    if (!row['Lead Name']) {
      errors.push('Missing Lead Name');
    }
    if (!row['Phone Number']) {
      errors.push('Missing Phone Number');
    }
    
    // Phone validation (10 digits)
    if (row['Phone Number'] && !/^\d{10}$/.test(row['Phone Number'].replace(/\s+/g, ''))) {
      errors.push('Invalid phone number format (must be 10 digits)');
    }
    
    // Email validation (if provided)
    if (row['Email'] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row['Email'])) {
      errors.push('Invalid email format');
    }
    
    // Validate Assigned To email (if provided)
    if (row['Assigned To']) {
      const assignee = employees.find(e => e.email === row['Assigned To']);
      if (!assignee) {
        errors.push(`Assigned To email not found: ${row['Assigned To']}`);
      }
    }
    
    return errors;
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
          const errorDetails = [];
          
          for (let i = 0; i < csvData.length; i++) {
            const row = csvData[i];
            const rowNum = i + 2; // +2 because index 0 = row 2 (after header)
            
            // Validate row
            const validationErrors = validateRow(row, rowNum);
            if (validationErrors.length > 0) {
              errorDetails.push(`Row ${rowNum}: ${validationErrors.join(', ')}`);
              errorCount++;
              continue;
            }
            
            // Find assigned employee
            let assignedTo = null;
            let assignedToName = null;
            if (row['Assigned To']) {
              const employee = employees.find(e => e.email === row['Assigned To']);
              if (employee) {
                assignedTo = employee.id;
                assignedToName = employee.name;
              }
            }
            
            // Map interest level
            const interestLevelMap = {
              'Hot': 'Hot',
              'Warm': 'Warm',
              'Cold': 'Cold',
              'Very Hot': 'Hot',
              'Medium': 'Warm',
            };
            const interestLevel = interestLevelMap[row['Interest Level']] || 'Cold';
            
            // Map statuses
            const statusMap = {
              'FollowUp': 'FollowUp',
              'Follow Up': 'FollowUp',
              'Follow-Up': 'FollowUp',
              'Booked': 'Booked',
              'Lost': 'Lost',
              'Open': 'Open',
            };
            const finalStatus = statusMap[row['Final Status']] || 'FollowUp';
            
            const siteVisitStatusMap = {
              'Scheduled': 'scheduled',
              'Completed': 'completed',
              'Not Planned': 'not_planned',
              'Cancelled': 'cancelled',
            };
            const siteVisitStatus = siteVisitStatusMap[row['Site Visit Status']] || 'not_planned';
            
            // Prepare lead object
            const leadData = {
              name: row['Lead Name'],
              phone: row['Phone Number'].replace(/\s+/g, ''),
              email: row['Email'] || '',
              source: row['Lead Source'] || 'CSV Import',
              budget: row['Budget'] || '', // Text field, can be anything
              callAttempt: row['Call Attempt'] || '',
              callStatus: row['Call Status'] || '',
              interestLevel: interestLevel,
              notes: [row['Buyer Feedback'], row['Notes']].filter(Boolean).join('\n') || '',
              followUpDate: row['Next Follow-up Date'] || null,
              siteVisitStatus: siteVisitStatus,
              status: finalStatus,
              assignedTo: assignedTo,
              assignedToName: assignedToName,
              project: row['Project'] || null,
              createdBy: user.id,
            };
            
            // Add lead to Supabase
            const result = await addLead(leadData);
            
            if (result) {
              successCount++;
            } else {
              errorDetails.push(`Row ${rowNum}: Failed to add lead to database`);
              errorCount++;
            }
          }
          
          // Refresh leads
          await fetchLeads();
          
          setResult({
            success: successCount,
            errors: errorCount,
            details: errorDetails.slice(0, 15), // Show first 15 errors
          });
        } catch (err) {
          console.error('Import error:', err);
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
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Import Leads from CSV</h1>
        <p className="text-sm text-gray-500 mt-1">Upload CSV file to bulk import leads into the system</p>
      </div>

      {/* Download Sample */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Download Sample CSV Template</p>
                <p className="text-xs text-blue-700">Use this template with the exact column format</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
              onClick={() => window.open('/sample_leads_import.csv', '_blank')}
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
          <div className="bg-gray-50 p-3 rounded-lg overflow-x-auto">
            <p className="text-xs font-mono text-gray-700 whitespace-nowrap">
              Lead Name,Phone Number,Email,Lead Source,Budget,Call Attempt,Call Status,Interest Level,Buyer Feedback,Next Follow-up Date,Site Visit Status,Final Status,Assigned To,Project,Notes
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700 mb-2">Required Fields:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li><code>Lead Name</code> - Full name</li>
                <li><code>Phone Number</code> - 10 digits</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">Optional Fields:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li><code>Email</code> - Valid email</li>
                <li><code>Budget</code> - Any text (e.g., "50-75 Lakh")</li>
                <li><code>Lead Source</code> - Text</li>
                <li><code>Call Attempt</code> - Text</li>
                <li><code>Call Status</code> - Text</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700 mb-2">More Fields:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1">
                <li><code>Interest Level</code> - Hot/Warm/Cold</li>
                <li><code>Assigned To</code> - Employee email</li>
                <li><code>Project</code> - Project name</li>
                <li><code>Notes</code> - Any text</li>
              </ul>
            </div>
          </div>
          
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-xs text-yellow-800">
              <strong>Null values are allowed</strong> - Leave fields empty if data is not available. Budget can be text like "50-75 Lakh" or "1-2 Crore".
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
              accept=".csv"
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
            <CardTitle className="text-base">Preview (First 5 Rows)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-2 text-left font-semibold">Name</th>
                    <th className="px-2 py-2 text-left font-semibold">Phone</th>
                    <th className="px-2 py-2 text-left font-semibold">Source</th>
                    <th className="px-2 py-2 text-left font-semibold">Budget</th>
                    <th className="px-2 py-2 text-left font-semibold">Status</th>
                    <th className="px-2 py-2 text-left font-semibold">Assigned</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-2 py-2">{row['Lead Name'] || '-'}</td>
                      <td className="px-2 py-2">{row['Phone Number'] || '-'}</td>
                      <td className="px-2 py-2">{row['Lead Source'] || '-'}</td>
                      <td className="px-2 py-2">{row['Budget'] || '-'}</td>
                      <td className="px-2 py-2">{row['Final Status'] || '-'}</td>
                      <td className="px-2 py-2">{row['Assigned To'] || '-'}</td>
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
              Importing Leads...
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
                  {result.errors > 0 && (
                    <p className="text-orange-700">
                      ⚠ <strong>{result.errors}</strong> rows had errors
                    </p>
                  )}
                </div>
                
                {result.details && result.details.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded border border-orange-200 max-h-60 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Error Details:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {result.details.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <div className="flex gap-2 mt-4">
                  <Button
                    onClick={() => window.location.href = '/crm/admin/leads'}
                  >
                    View Leads
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null);
                      setPreview([]);
                      setResult(null);
                    }}
                  >
                    Import More
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
