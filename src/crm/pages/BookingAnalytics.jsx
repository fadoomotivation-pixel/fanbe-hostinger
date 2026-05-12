
import React from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp } from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';

const BookingAnalytics = () => {
  // Using sample data for visualization
  const projectBookings = [
    { name: 'Kunj Bihari', bookings: 12 },
    { name: 'Khatu Shyam', bookings: 8 },
    { name: 'Jagannath', bookings: 15 },
    { name: 'Brij Vatika', bookings: 6 }
  ];

  const staffBookings = [
    { name: 'Rajesh Kumar', bookings: 8 },
    { name: 'Priya Singh', bookings: 12 },
    { name: 'Amit Sharma', bookings: 5 },
    { name: 'Sneha Gupta', bookings: 3 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <div className="space-y-6">
       <div className="flex justify-between items-center">
         <div>
           <h1 className="text-2xl font-bold text-[#0F3A5F]">Booking Analytics</h1>
           <p className="text-sm text-gray-500">Sales closure insights</p>
         </div>
         <Button variant="outline" className="gap-2">
           <Download size={16} /> Export Data
         </Button>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="shadow-sm">
            <CardHeader><CardTitle>Bookings by Project</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectBookings} layout="vertical" margin={{ left: 20 }}>
                   <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                   <XAxis type="number" />
                   <YAxis dataKey="name" type="category" width={100} />
                   <Tooltip />
                   <Bar dataKey="bookings" fill="#8884d8" radius={[0, 4, 4, 0]}>
                     {projectBookings.map((entry, index) => (
                       <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                     ))}
                   </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm">
            <CardHeader><CardTitle>Bookings by Staff</CardTitle></CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={staffBookings}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} />
                   <XAxis dataKey="name" />
                   <YAxis />
                   <Tooltip />
                   <Bar dataKey="bookings" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
       </div>

       <Card>
         <CardHeader><CardTitle>Monthly Booking Trend</CardTitle></CardHeader>
         <CardContent className="h-[100px] flex items-center justify-center text-gray-400 border-2 border-dashed m-4 rounded-lg">
            Visualization placeholder for Monthly Trend Line Chart
         </CardContent>
       </Card>
    </div>
  );
};

export default BookingAnalytics;
