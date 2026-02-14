
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Download, Calendar, DollarSign, TrendingUp } from 'lucide-react';

const RevenueAnalytics = () => {
  const { customers } = useCRMData();
  const [dateRange, setDateRange] = useState('year');

  // Calculate stats
  const totalRevenue = customers.reduce((acc, c) => acc + (c.bookingAmount || 0), 0);
  const avgRevenuePerBooking = customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0;
  
  // Mock monthly data
  const monthlyData = [
    { name: 'Jan', revenue: 4500000, bookings: 4 },
    { name: 'Feb', revenue: 5200000, bookings: 5 },
    { name: 'Mar', revenue: 3800000, bookings: 3 },
    { name: 'Apr', revenue: 6500000, bookings: 6 },
    { name: 'May', revenue: 7200000, bookings: 7 },
    { name: 'Jun', revenue: 5800000, bookings: 5 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
         <div>
            <h1 className="text-2xl font-bold text-[#0F3A5F]">Revenue Analytics</h1>
            <p className="text-sm text-gray-500">Financial performance tracking</p>
         </div>
         <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[150px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="gap-2">
              <Download size={16} /> Export CSV
            </Button>
         </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Total Revenue (YTD)</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F] mt-1">₹{(totalRevenue/100000).toFixed(2)} Lakhs</h3>
            <div className="flex items-center text-xs text-green-600 mt-2">
              <TrendingUp size={14} className="mr-1" /> +15% vs last year
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Avg. Booking Value</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F] mt-1">₹{(avgRevenuePerBooking/100000).toFixed(2)} Lakhs</h3>
            <div className="flex items-center text-xs text-green-600 mt-2">
              <TrendingUp size={14} className="mr-1" /> +5% vs last month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-gray-500 font-medium">Proj. Monthly Revenue</p>
            <h3 className="text-2xl font-bold text-[#0F3A5F] mt-1">₹68.5 Lakhs</h3>
            <div className="flex items-center text-xs text-gray-400 mt-2">
              Based on current run rate
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader><CardTitle>Revenue Trend</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                 <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0F3A5F" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#0F3A5F" stopOpacity={0}/>
                    </linearGradient>
                 </defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} />
                 <XAxis dataKey="name" />
                 <YAxis tickFormatter={(val) => `₹${val/100000}L`} />
                 <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                 <Area type="monotone" dataKey="revenue" stroke="#0F3A5F" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader><CardTitle>Revenue by Project</CardTitle></CardHeader>
          <CardContent className="h-[300px]">
             <ResponsiveContainer width="100%" height="100%">
               <BarChart data={[
                 { name: 'Kunj Bihari', value: 12500000 },
                 { name: 'Khatu Shyam', value: 8500000 },
                 { name: 'Jagannath', value: 18000000 },
                 { name: 'Brij Vatika', value: 6500000 }
               ]} layout="vertical" margin={{ left: 20 }}>
                 <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                 <XAxis type="number" tickFormatter={(val) => `₹${val/100000}L`} />
                 <YAxis dataKey="name" type="category" width={100} />
                 <Tooltip formatter={(val) => `₹${val.toLocaleString()}`} />
                 <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
               </BarChart>
             </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
import { AreaChart, Area } from 'recharts'; // Added missing import
export default RevenueAnalytics;
