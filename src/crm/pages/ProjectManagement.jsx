
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { Edit2, Trash2, Search, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';

const ProjectManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('list');
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    location: '',
    type: 'residential',
    priceRange: '',
    description: '',
    status: 'upcoming',
    launchDate: '',
    amenities: '',
    bookingAmount: ''
  });

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('projects');
    if (stored) {
      setProjects(JSON.parse(stored));
    }
  }, []);

  const saveProjects = (newProjects) => {
    localStorage.setItem('projects', JSON.stringify(newProjects));
    setProjects(newProjects);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isEditing) {
      const updated = projects.map(p => p.id === formData.id ? formData : p);
      saveProjects(updated);
      toast({ title: "Updated", description: "Project updated successfully!" });
    } else {
      const newProject = { ...formData, id: `PROJ${Date.now()}` };
      saveProjects([...projects, newProject]);
      toast({ title: "Created", description: "Project created successfully!" });
    }
    resetForm();
    setActiveTab('list');
  };

  const handleDelete = (id) => {
    if (confirm('Delete this project?')) {
      const filtered = projects.filter(p => p.id !== id);
      saveProjects(filtered);
      toast({ title: "Deleted", description: "Project deleted successfully!" });
    }
  };

  const handleEdit = (project) => {
    setFormData(project);
    setIsEditing(true);
    setActiveTab('create');
  };

  const resetForm = () => {
    setFormData({
      id: '', name: '', location: '', type: 'residential', priceRange: '',
      description: '', status: 'upcoming', launchDate: '', amenities: '', bookingAmount: ''
    });
    setIsEditing(false);
  };

  const filteredProjects = projects.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Project Inventory</h1>
          <p className="text-gray-500">Manage real estate projects and details.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="list">List Projects</TabsTrigger>
          <TabsTrigger value="create" onClick={resetForm}>
            {isEditing ? 'Edit Project' : 'Create Project'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input 
                placeholder="Search projects..." 
                className="pl-10"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Launch Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProjects.map(proj => (
                  <TableRow key={proj.id}>
                    <TableCell className="font-medium">{proj.name}</TableCell>
                    <TableCell>{proj.location}</TableCell>
                    <TableCell className="capitalize">{proj.type}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${proj.status === 'upcoming' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>
                        {proj.status}
                      </span>
                    </TableCell>
                    <TableCell>{proj.launchDate}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(proj)}>
                        <Edit2 size={16} />
                      </Button>
                      {user.role === ROLES.SUPER_ADMIN && (
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(proj.id)} className="text-red-600">
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProjects.length === 0 && (
                   <TableRow><TableCell colSpan={6} className="text-center py-8">No projects found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="create">
          <Card>
            <CardHeader><CardTitle>{isEditing ? 'Edit Project Details' : 'Add New Project'}</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project Name</label>
                    <Input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Location</label>
                    <Input required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Type</label>
                    <Select value={formData.type} onValueChange={v => setFormData({...formData, type: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="residential">Residential</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="plots">Plots</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Status</label>
                    <Select value={formData.status} onValueChange={v => setFormData({...formData, status: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Ongoing</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Price Range</label>
                    <Input placeholder="e.g. 15L - 25L" value={formData.priceRange} onChange={e => setFormData({...formData, priceRange: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Booking Amount</label>
                    <Input placeholder="e.g. 21000" value={formData.bookingAmount} onChange={e => setFormData({...formData, bookingAmount: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Launch Date</label>
                    <Input type="date" value={formData.launchDate} onChange={e => setFormData({...formData, launchDate: e.target.value})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Description</label>
                  <Textarea rows={4} value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Amenities (comma separated)</label>
                  <Input placeholder="Park, Gym, Security..." value={formData.amenities} onChange={e => setFormData({...formData, amenities: e.target.value})} />
                </div>

                <div className="flex justify-end gap-4">
                  <Button type="button" variant="outline" onClick={() => setActiveTab('list')}>Cancel</Button>
                  <Button type="submit">{isEditing ? 'Update Project' : 'Create Project'}</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProjectManagement;
