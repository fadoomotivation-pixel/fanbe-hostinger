import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Layers, Monitor, Clock, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projectsData } from '@/data/projectsData';
import { useNavMenu, useSliderData } from '@/lib/contentSync';

const ContentManagementDashboard = () => {
  const navMenu = useNavMenu();
  const sliderData = useSliderData();

  const stats = [
    { label: 'Total Projects', value: projectsData.length, icon: Layers, color: 'text-blue-600', bg: 'bg-blue-100' },
    { label: 'Menu Items', value: navMenu.items.length, icon: Monitor, color: 'text-green-600', bg: 'bg-green-100' },
    { label: 'Active Sliders', value: sliderData.images.length, icon: Globe, color: 'text-purple-600', bg: 'bg-purple-100' },
  ];

  const quickLinks = [
    { title: 'Homepage Settings', desc: 'Manage hero slider, featured sections', path: '/crm/admin/cms/homepage', icon: Globe },
    { title: 'Project Pages', desc: 'Edit details, pricing, gallery', path: '/crm/admin/cms/projects', icon: Layers },
    { title: 'Navigation Menu', desc: 'Reorder and edit site menu', path: '/crm/admin/cms/navigation', icon: Monitor },
  ];

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Content Management</h1>
          <p className="text-gray-500">Overview of website content and settings</p>
        </div>
        <div className="flex items-center text-sm text-gray-500 bg-white px-4 py-2 rounded-lg border shadow-sm">
          <Clock size={16} className="mr-2" />
          Last System Update: {new Date().toLocaleDateString()}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, idx) => (
          <Card key={idx} className="border-none shadow-md hover:shadow-lg transition-shadow">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
              </div>
              <div className={`p-4 rounded-full ${stat.bg}`}>
                <stat.icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {quickLinks.map((link, idx) => (
          <Link key={idx} to={link.path} className="block group">
            <Card className="h-full border-none shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-12 h-12 bg-[#0F3A5F] rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <link.icon className="text-white h-6 w-6" />
                </div>
                <CardTitle className="text-xl text-gray-900 group-hover:text-[#0F3A5F] transition-colors">{link.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-500 mb-4">{link.desc}</p>
                <div className="flex items-center text-[#D4AF37] font-semibold text-sm">
                  Access Editor <ChevronRight size={16} className="ml-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-none shadow-md">
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start gap-4 pb-4 border-b last:border-0 last:pb-0">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="font-medium text-gray-900">System Initialized</p>
                <p className="text-sm text-gray-500">Content Management System ready for use.</p>
                <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString()}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ContentManagementDashboard;