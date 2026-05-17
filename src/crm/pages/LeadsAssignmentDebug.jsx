import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, CheckCircle, Database, User } from 'lucide-react';

const LeadsAssignmentDebug = () => {
  const { user } = useAuth();
  const { leads, employees } = useCRMData();
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (!leads || !employees || !user) return;

    const userId = user?.uid || user?.id;
    const userEmail = user?.email;

    // Analyze assignments
    const assignmentFormats = new Map();
    const uniqueAssignees = new Set();
    let nullCount = 0;
    let matchingLeads = [];

    leads.forEach(lead => {
      const assignedValue = lead.assignedTo || lead.assigned_to;
      
      if (!assignedValue) {
        nullCount++;
      } else {
        uniqueAssignees.add(assignedValue);
        const format = typeof assignedValue === 'string' && assignedValue.includes('-') ? 'UUID' : 'Other';
        assignmentFormats.set(format, (assignmentFormats.get(format) || 0) + 1);
        
        // Check if matches current user
        if (assignedValue === userId || assignedValue === user?.id || assignedValue === user?.uid) {
          matchingLeads.push(lead);
        }
      }
    });

    setAnalysis({
      userId,
      userEmail,
      totalLeads: leads.length,
      nullAssignments: nullCount,
      uniqueAssignees: Array.from(uniqueAssignees),
      assignmentFormats: Object.fromEntries(assignmentFormats),
      matchingLeads,
      employees: employees.map(e => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: e.role
      })),
      sampleLeads: leads.slice(0, 20).map(l => ({
        id: l.id,
        name: l.name,
        assignedTo: l.assignedTo || l.assigned_to,
        assignedToName: l.assignedToName || l.assigned_to_name,
      }))
    });
  }, [leads, employees, user]);

  if (!analysis) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Card className="border-2 border-blue-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" />
            Lead Assignment Diagnostics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current User Info */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
              <User className="h-4 w-4" />
              Current User Info
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-semibold">User ID (uid):</span>
                <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">{user?.uid || 'N/A'}</code>
              </div>
              <div>
                <span className="font-semibold">User ID (id):</span>
                <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">{user?.id || 'N/A'}</code>
              </div>
              <div>
                <span className="font-semibold">Email:</span>
                <code className="ml-2 bg-blue-100 px-2 py-1 rounded text-xs">{analysis.userEmail}</code>
              </div>
              <div>
                <span className="font-semibold">Role:</span>
                <Badge className="ml-2">{user?.role || 'N/A'}</Badge>
              </div>
            </div>
          </div>

          {/* Assignment Statistics */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-blue-600">{analysis.totalLeads}</div>
                <div className="text-xs text-gray-500 mt-1">Total Leads</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-green-600">{analysis.matchingLeads.length}</div>
                <div className="text-xs text-gray-500 mt-1">Assigned to You</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-3xl font-bold text-gray-600">{analysis.nullAssignments}</div>
                <div className="text-xs text-gray-500 mt-1">Unassigned</div>
              </CardContent>
            </Card>
          </div>

          {/* Assignment Formats */}
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="font-bold text-yellow-900 mb-2">Assignment ID Formats Detected</h3>
            <div className="space-y-2">
              {Object.entries(analysis.assignmentFormats).map(([format, count]) => (
                <div key={format} className="flex items-center justify-between">
                  <span className="text-sm font-medium">{format}:</span>
                  <Badge variant="outline">{count} leads</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Unique Assignees */}
          <div>
            <h3 className="font-bold mb-2">All Unique Assignees in Database</h3>
            <div className="flex flex-wrap gap-2">
              {analysis.uniqueAssignees.slice(0, 10).map((assignee, i) => (
                <code key={i} className="bg-gray-100 px-2 py-1 rounded text-xs">
                  {assignee}
                </code>
              ))}
              {analysis.uniqueAssignees.length > 10 && (
                <Badge>+{analysis.uniqueAssignees.length - 10} more</Badge>
              )}
            </div>
          </div>

          {/* All Employees */}
          <div>
            <h3 className="font-bold mb-2">All Employees in System</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.employees.map(emp => (
                  <TableRow key={emp.id} className={emp.id === analysis.userId ? 'bg-green-50' : ''}>
                    <TableCell className="font-mono text-xs">{emp.id}</TableCell>
                    <TableCell>{emp.name}</TableCell>
                    <TableCell>{emp.email}</TableCell>
                    <TableCell>
                      <Badge>{emp.role}</Badge>
                      {emp.id === analysis.userId && (
                        <Badge className="ml-2 bg-green-600">YOU</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Sample Leads */}
          <div>
            <h3 className="font-bold mb-2">Sample Leads (First 20)</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead Name</TableHead>
                  <TableHead>assigned_to (ID)</TableHead>
                  <TableHead>assigned_to_name</TableHead>
                  <TableHead>Match?</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analysis.sampleLeads.map(lead => {
                  const matches = lead.assignedTo === analysis.userId;
                  return (
                    <TableRow key={lead.id} className={matches ? 'bg-green-50' : ''}>
                      <TableCell>{lead.name}</TableCell>
                      <TableCell className="font-mono text-xs">
                        {lead.assignedTo || <span className="text-gray-400">NULL</span>}
                      </TableCell>
                      <TableCell>
                        {lead.assignedToName || <span className="text-gray-400">-</span>}
                      </TableCell>
                      <TableCell>
                        {matches ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-gray-400" />
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Diagnosis */}
          <Card className={analysis.matchingLeads.length === 0 ? 'border-2 border-red-500 bg-red-50' : 'border-2 border-green-500 bg-green-50'}>
            <CardContent className="p-4">
              <h3 className="font-bold mb-2 flex items-center gap-2">
                {analysis.matchingLeads.length === 0 ? (
                  <><AlertCircle className="h-5 w-5 text-red-600" /> ❌ Problem Detected</>
                ) : (
                  <><CheckCircle className="h-5 w-5 text-green-600" /> ✅ Assignments Working</>
                )}
              </h3>
              {analysis.matchingLeads.length === 0 ? (
                <div className="text-sm text-red-800">
                  <p className="mb-2"><strong>Issue:</strong> No leads are assigned to your user ID.</p>
                  <p className="mb-2"><strong>Your ID:</strong> <code className="bg-red-100 px-2 py-1 rounded">{analysis.userId}</code></p>
                  <p className="mb-2"><strong>Possible Causes:</strong></p>
                  <ul className="list-disc ml-6 space-y-1">
                    <li>Leads were assigned before your account was created</li>
                    <li>Leads are assigned using a different ID format (name/email instead of UUID)</li>
                    <li>Assignment field needs to be updated in bulk</li>
                    <li>Admin hasn't assigned any leads to you yet</li>
                  </ul>
                  <p className="mt-3"><strong>Solution:</strong> Ask admin to assign leads to you, or check if leads use email-based assignment instead of UUID.</p>
                </div>
              ) : (
                <div className="text-sm text-green-800">
                  <p>✅ You have {analysis.matchingLeads.length} leads correctly assigned to your user ID.</p>
                  <p className="mt-2">If you're still not seeing leads in My Leads page, check the browser console for filtering errors.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
};

export default LeadsAssignmentDebug;
