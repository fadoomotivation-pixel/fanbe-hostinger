import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert.jsx';
import { supabaseAdmin } from '@/lib/supabase';
import { Upload, Download, CheckCircle, AlertCircle, FileText, Loader2 } from 'lucide-react';

const ImportWorkLogs = () => {
  const { user } = useAuth();
  const { employees, fetchCalls, fetchSiteVisits, fetchBookings } = useCRMData();
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
            Access denied. Only Super Admin can import historical work logs.
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
      const values = lines[i].split(',');
      if (values.length !== headers.length) continue;
      
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.trim().replace(/^\"|\"$/g, ''); // Remove quotes
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

  const validateRow = (row) => {
    const errors = [];
    
    if (!row.date || isNaN(Date.parse(row.date))) {
      errors.push('Invalid date format');
    }
    if (!row.employee_email) {
      errors.push('Missing employee email');
    }
    if (isNaN(parseInt(row.total_calls)) || parseInt(row.total_calls) < 0) {
      errors.push('Invalid total_calls');
    }
    if (isNaN(parseInt(row.connected_calls)) || parseInt(row.connected_calls) < 0) {
      errors.push('Invalid connected_calls');
    }
    if (isNaN(parseInt(row.site_visits)) || parseInt(row.site_visits) < 0) {
      errors.push('Invalid site_visits');
    }
    if (isNaN(parseInt(row.bookings)) || parseInt(row.bookings) < 0) {
      errors.push('Invalid bookings');
    }
    
    return errors;
  };

  // Function to download sample CSV
  const handleDownloadSample = () => {
    const link = document.createElement('a');
    link.href = '/sample_work_logs_import.csv';
    link.download = 'sample_work_logs_import.csv';
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
          const errors = [];
          
          for (const row of csvData) {
            // Validate row
            const validationErrors = validateRow(row);
            if (validationErrors.length > 0) {
              errors.push(`Row ${successCount + errorCount + 1}: ${validationErrors.join(', ')}`);
              errorCount++;
              continue;
            }
            
            // Find employee by email
            const employee = employees.find(e => e.email === row.employee_email);
            if (!employee) {
              errors.push(`Row ${successCount + errorCount + 1}: Employee not found (${row.employee_email})`);
              errorCount++;
              continue;
            }
            
            const totalCalls = parseInt(row.total_calls);
            const connectedCalls = parseInt(row.connected_calls);
            const siteVisitsCount = parseInt(row.site_visits);
            const bookingsCount = parseInt(row.bookings);
            
            // Import calls as individual records
            for (let i = 0; i < totalCalls; i++) {
              const isConnected = i < connectedCalls;
              await supabaseAdmin.from('calls').insert({
                employee_id: employee.id,
                lead_id: null,
                lead_name: 'Historical Import',
                project_name: null,
                call_type: 'outbound',
                status: isConnected ? 'connected' : 'not_answered',
                duration: isConnected ? 120 : 0,
                notes: row.notes || 'Imported from historical data',
                created_at: new Date(row.date + 'T12:00:00Z').toISOString(),
              });
            }
            
            // Import site visits
            for (let i = 0; i < siteVisitsCount; i++) {
              await supabaseAdmin.from('site_visits').insert({
                employee_id: employee.id,
                lead_id: null,
                lead_name: 'Historical Import',
                project_name: null,
                visit_date: row.date,
                visit_time: '14:00',
                status: 'completed',
                location: 'Site',
                duration: 60,
                notes: row.notes || 'Imported from historical data',
                feedback: 'Imported',
                created_at: new Date(row.date + 'T14:00:00Z').toISOString(),
              });
            }
            
            // Import bookings
            for (let i = 0; i < bookingsCount; i++) {
              await supabaseAdmin.from('bookings').insert({
                employee_id: employee.id,
                lead_id: null,
                lead_name: 'Historical Import',
                project_name: null,
                unit_type: 'Plot',
                unit_number: null,
                booking_amount: 5000000,
                payment_mode: 'bank_transfer',
                payment_status: 'paid',
                booking_date: row.date,
                expected_closure_date: null,
                notes: row.notes || 'Imported from historical data',
                created_at: new Date(row.date + 'T16:00:00Z').toISOString(),
              });
            }
            
            successCount++;
          }
          
          // Refresh data
          await fetchCalls();
          await fetchSiteVisits();
          await fetchBookings();
          
          setResult({
            success: successCount,
            errors: errorCount,
            details: errors.slice(0, 10), // Show first 10 errors
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
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#0F3A5F]">Import Historical Work Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Upload CSV file to import previous employee performance data</p>
      </div>

      {/* Download Sample */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Download Sample CSV Template</p>
                <p className="text-xs text-blue-700">Use this template to format your data correctly</p>
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
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm font-mono text-gray-700 mb-2">
              date,employee_email,total_calls,connected_calls,site_visits,bookings,notes
            </p>
            <p className="text-xs text-gray-600">
              2026-02-20,nidhi@fanbegroup.com,45,32,2,1,"Good response from leads"
            </p>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-semibold text-gray-700">Required Columns:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1 mt-1">
                <li><code>date</code> - Format: YYYY-MM-DD</li>
                <li><code>employee_email</code> - Must exist in system</li>
                <li><code>total_calls</code> - Number (0 or positive)</li>
                <li><code>connected_calls</code> - Number (≤ total_calls)</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-gray-700">Optional Columns:</p>
              <ul className="list-disc list-inside text-gray-600 text-xs space-y-1 mt-1">
                <li><code>site_visits</code> - Number (default: 0)</li>
                <li><code>bookings</code> - Number (default: 0)</li>
                <li><code>notes</code> - Text description</li>
              </ul>
            </div>
          </div>
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
                    <th className="px-3 py-2 text-left font-semibold">Date</th>
                    <th className="px-3 py-2 text-left font-semibold">Email</th>
                    <th className="px-3 py-2 text-right font-semibold">Calls</th>
                    <th className="px-3 py-2 text-right font-semibold">Connected</th>
                    <th className="px-3 py-2 text-right font-semibold">Visits</th>
                    <th className="px-3 py-2 text-right font-semibold">Bookings</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {preview.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-3 py-2">{row.date}</td>
                      <td className="px-3 py-2">{row.employee_email}</td>
                      <td className="px-3 py-2 text-right">{row.total_calls}</td>
                      <td className="px-3 py-2 text-right">{row.connected_calls}</td>
                      <td className="px-3 py-2 text-right">{row.site_visits}</td>
                      <td className="px-3 py-2 text-right">{row.bookings}</td>
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
              Importing Data...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Import Work Logs
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
              <CheckCircle className="h-6 w-6 text-green-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-green-900 text-lg">Import Completed</h3>
                <div className="mt-3 space-y-1 text-sm">
                  <p className="text-green-800">
                    ✓ <strong>{result.success}</strong> rows imported successfully
                  </p>
                  {result.errors > 0 && (
                    <p className="text-orange-700">
                      ⚠ <strong>{result.errors}</strong> rows had errors
                    </p>
                  )}
                </div>
                
                {result.details && result.details.length > 0 && (
                  <div className="mt-3 p-3 bg-white rounded border border-orange-200">
                    <p className="text-xs font-semibold text-gray-700 mb-1">Error Details:</p>
                    <ul className="text-xs text-gray-600 space-y-0.5">
                      {result.details.map((err, i) => (
                        <li key={i}>• {err}</li>
                      ))}
                    </ul>
                  </div>
                )}
                
                <Button
                  className="mt-4"
                  onClick={() => window.location.href = '/crm/admin/performance'}
                >
                  View Performance Dashboard
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ImportWorkLogs;
