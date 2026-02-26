// Clear localStorage cache utility
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Trash2 } from 'lucide-react';

const ClearCacheUtility = () => {
  const [cleared, setCleared] = useState(false);
  const [loading, setLoading] = useState(false);

  const clearAllCache = () => {
    setLoading(true);
    
    // Remove old localStorage keys
    const keysToRemove = [
      'crm_work_logs',
      'crm_customers',
      'crm_invoices',
      'crm_payments',
      'crm_tasks',
      'crm_eod_reports',
    ];
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
    });
    
    setTimeout(() => {
      setLoading(false);
      setCleared(true);
      
      // Reload after 1 second
      setTimeout(() => {
        window.location.href = '/crm/admin/dashboard';
      }, 1000);
    }, 500);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <Card className="shadow-lg">
        <CardHeader className="bg-orange-50">
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <AlertCircle size={24} />
            Clear Cache & Reset Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {!cleared ? (
            <>
              <div className="space-y-2">
                <h3 className="font-semibold text-gray-800">What This Does:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  <li>Removes old cached mock data (including EMP001)</li>
                  <li>Clears localStorage work logs, customers, invoices</li>
                  <li>Forces fresh load from Supabase database</li>
                  <li>Fixes "EMP001" showing as top performer</li>
                </ul>
              </div>

              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> This will clear all locally cached data. Any unsaved changes in localStorage will be lost. Real Supabase data is not affected.
                </p>
              </div>

              <Button
                onClick={clearAllCache}
                disabled={loading}
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Clearing Cache...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Trash2 size={16} />
                    Clear Cache Now
                  </span>
                )}
              </Button>
            </>
          ) : (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto text-green-600 mb-4" />
              <h3 className="text-lg font-bold text-green-800 mb-2">Cache Cleared Successfully!</h3>
              <p className="text-sm text-gray-600">Redirecting to dashboard...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClearCacheUtility;
