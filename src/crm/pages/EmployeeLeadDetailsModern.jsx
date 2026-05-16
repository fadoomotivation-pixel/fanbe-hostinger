// Modern redesigned version - Copy this later
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  User, Phone, Mail, MapPin, Calendar, DollarSign, 
  Building, Clock, MessageSquare, TrendingUp, AlertCircle,
  CheckCircle, XCircle, Home, Briefcase
} from 'lucide-react';

const EmployeeLeadDetailsModern = () => {
  // Your existing logic here...
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section with Gradient */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl shadow-xl p-8 text-white">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold flex items-center gap-3">
                <User className="w-8 h-8" />
                {lead.name || 'Lead Details'}
              </h1>
              <p className="text-blue-100 flex items-center gap-2">
                <Phone className="w-4 h-4" />
                {lead.phone}
              </p>
            </div>
            <Badge className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 text-lg">
              {lead.status}
            </Badge>
          </div>
        </div>

        {/* Stats Grid with Gradients */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Budget</p>
                  <p className="text-2xl font-bold">{lead.budget || 'N/A'}</p>
                </div>
                <DollarSign className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Source</p>
                  <p className="text-xl font-bold">{lead.source}</p>
                </div>
                <TrendingUp className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Interest</p>
                  <p className="text-xl font-bold">{lead.interest}</p>
                </div>
                <Home className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Priority</p>
                  <p className="text-xl font-bold capitalize">{lead.priority || 'Medium'}</p>
                </div>
                <AlertCircle className="w-10 h-10 opacity-80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rest of your existing components styled with modern cards */}
        
      </div>
    </div>
  );
};

export default EmployeeLeadDetailsModern;
