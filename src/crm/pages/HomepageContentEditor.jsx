
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Save, Image as ImageIcon, Users, LayoutTemplate, BarChart3, Star, Settings } from 'lucide-react';

// Default initial states
const defaultHero = {
  heading: "Building Trust. Creating Value. Shaping Tomorrow.",
  subheading: "Experience the pinnacle of residential living with Fanbe Group. Where integrity meets excellence.",
  ctaText: "Explore Projects",
  bgImage: "https://images.unsplash.com/photo-1679931676577-b79a86e99bb7",
  overlayColor: "rgba(15, 58, 95, 0.8)"
};

const defaultStats = {
  foundedLabel: "Founded",
  foundedValue: "2012",
  projectsLabel: "Projects Delivered",
  projectsValue: "50+",
  customersLabel: "Happy Customers",
  customersValue: "15,000+",
  legalLabel: "Legal Clarity",
  legalDesc: "100% Legal Clarity"
};

const defaultProjects = {
  heading: "Our Projects",
  description: "Explore our premium plotted developments designed for your spiritual and peaceful living.",
  sqYardLabel: "Sq Yard",
  bookingLabel: "Booking Amount",
  emiLabel: "EMI",
  ctaText: "View Details"
};

const defaultFeatured = {
  heading: "Shree Kunj Bihari Enclave",
  description: "Our flagship project offering premium residential plots with modern amenities in the heart of the holy city.",
  image: "https://images.unsplash.com/photo-1600596542815-e328701102b9",
  whatsapp: "8076146988",
  whatsappBtnText: "Enquire Now",
  ctaText: "View Details"
};

const defaultTeam = {
  enabled: false,
  members: []
};

const defaultGeneral = {
  title: "Fanbe Developer",
  tagline: "Since 2012",
  primaryColor: "#0F3A5F",
  secondaryColor: "#D4AF37",
  accentColor: "#25D366"
};

const HomepageContentEditor = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [hero, setHero] = useState(defaultHero);
  const [stats, setStats] = useState(defaultStats);
  const [projects, setProjects] = useState(defaultProjects);
  const [featured, setFeatured] = useState(defaultFeatured);
  const [team, setTeam] = useState(defaultTeam);
  const [general, setGeneral] = useState(defaultGeneral);

  // Load from local storage
  useEffect(() => {
    const load = (key, setter, def) => {
      const saved = localStorage.getItem(key);
      if (saved) setter(JSON.parse(saved));
      else setter(def);
    };

    load('homepage_hero_settings', setHero, defaultHero);
    load('homepage_stats_settings', setStats, defaultStats);
    load('homepage_projects_settings', setProjects, defaultProjects);
    load('homepage_featured_project_settings', setFeatured, defaultFeatured);
    load('homepage_team_settings', setTeam, defaultTeam);
    load('homepage_general_settings', setGeneral, defaultGeneral);
  }, []);

  const saveSettings = (key, data, sectionName) => {
    localStorage.setItem(key, JSON.stringify(data));
    toast({
      title: "Success",
      description: `${sectionName} updated successfully!`,
      className: "bg-green-50 border-green-200"
    });
    // Trigger update event for real-time sync if listeners exist
    window.dispatchEvent(new Event('homepage_content_updated'));
  };

  const handleImageUpload = (e, section, field) => {
    const file = e.target.files[0];
    if (file) {
      // Create a fake local URL for preview
      const url = URL.createObjectURL(file);
      if (section === 'hero') setHero({...hero, [field]: url});
      if (section === 'featured') setFeatured({...featured, [field]: url});
      if (section === 'general') setGeneral({...general, [field]: url});
    }
  };

  // Check permissions - strictly ANKITFG role (Super Admin)
  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return <div className="p-8 text-center text-red-600">Access Denied. Super Admin only.</div>;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="bg-white border-b px-6 py-4 flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-[#0F3A5F]">Homepage Content Editor</h1>
          <p className="text-sm text-gray-500">Live preview editor for website content</p>
        </div>
        <Button onClick={() => window.open('/', '_blank')} variant="outline">View Live Site</Button>
      </div>

      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Editor Panel */}
        <div className="w-full lg:w-[40%] border-r bg-white overflow-y-auto p-6">
          <Tabs defaultValue="hero">
            <TabsList className="grid grid-cols-3 lg:grid-cols-6 mb-6">
              <TabsTrigger value="hero" title="Hero"><LayoutTemplate className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="stats" title="Stats"><BarChart3 className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="projects" title="Projects"><ImageIcon className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="featured" title="Featured"><Star className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="team" title="Team"><Users className="h-4 w-4" /></TabsTrigger>
              <TabsTrigger value="general" title="Settings"><Settings className="h-4 w-4" /></TabsTrigger>
            </TabsList>

            {/* Hero Editor */}
            <TabsContent value="hero" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Hero Section</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Main Heading</Label>
                    <Textarea 
                      value={hero.heading} 
                      onChange={e => setHero({...hero, heading: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Subheading</Label>
                    <Textarea 
                      value={hero.subheading} 
                      onChange={e => setHero({...hero, subheading: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>CTA Button Text</Label>
                    <Input 
                      value={hero.ctaText} 
                      onChange={e => setHero({...hero, ctaText: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Background Image</Label>
                    <Input type="file" onChange={e => handleImageUpload(e, 'hero', 'bgImage')} accept="image/*" />
                    <p className="text-xs text-gray-400">Current: {hero.bgImage ? 'Set' : 'Default'}</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Overlay Color (RGBA)</Label>
                    <div className="flex gap-2">
                      <Input 
                        value={hero.overlayColor} 
                        onChange={e => setHero({...hero, overlayColor: e.target.value})}
                      />
                      <div className="w-10 h-10 border rounded" style={{background: hero.overlayColor}}></div>
                    </div>
                  </div>
                  <Button onClick={() => saveSettings('homepage_hero_settings', hero, 'Hero section')}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Editor */}
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Stats Section</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Founded Label</Label>
                      <Input value={stats.foundedLabel} onChange={e => setStats({...stats, foundedLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>Founded Value</Label>
                      <Input value={stats.foundedValue} onChange={e => setStats({...stats, foundedValue: e.target.value})} />
                    </div>
                    <div>
                      <Label>Projects Label</Label>
                      <Input value={stats.projectsLabel} onChange={e => setStats({...stats, projectsLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>Projects Value</Label>
                      <Input value={stats.projectsValue} onChange={e => setStats({...stats, projectsValue: e.target.value})} />
                    </div>
                    <div>
                      <Label>Customers Label</Label>
                      <Input value={stats.customersLabel} onChange={e => setStats({...stats, customersLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>Customers Value</Label>
                      <Input value={stats.customersValue} onChange={e => setStats({...stats, customersValue: e.target.value})} />
                    </div>
                    <div>
                      <Label>Legal Label</Label>
                      <Input value={stats.legalLabel} onChange={e => setStats({...stats, legalLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>Legal Desc</Label>
                      <Input value={stats.legalDesc} onChange={e => setStats({...stats, legalDesc: e.target.value})} />
                    </div>
                  </div>
                  <Button onClick={() => saveSettings('homepage_stats_settings', stats, 'Stats section')}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Projects Editor */}
            <TabsContent value="projects" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Projects Section Labels</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Section Heading</Label>
                    <Input value={projects.heading} onChange={e => setProjects({...projects, heading: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Section Description</Label>
                    <Textarea value={projects.description} onChange={e => setProjects({...projects, description: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Sq Yard Label</Label>
                      <Input value={projects.sqYardLabel} onChange={e => setProjects({...projects, sqYardLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>Booking Amt Label</Label>
                      <Input value={projects.bookingLabel} onChange={e => setProjects({...projects, bookingLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>EMI Label</Label>
                      <Input value={projects.emiLabel} onChange={e => setProjects({...projects, emiLabel: e.target.value})} />
                    </div>
                    <div>
                      <Label>CTA Button Text</Label>
                      <Input value={projects.ctaText} onChange={e => setProjects({...projects, ctaText: e.target.value})} />
                    </div>
                  </div>
                  <Button onClick={() => saveSettings('homepage_projects_settings', projects, 'Projects section')}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Featured Editor */}
            <TabsContent value="featured" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Featured Project</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Project Name</Label>
                    <Input value={featured.heading} onChange={e => setFeatured({...featured, heading: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea value={featured.description} onChange={e => setFeatured({...featured, description: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <Label>Featured Image</Label>
                    <Input type="file" onChange={e => handleImageUpload(e, 'featured', 'image')} accept="image/*" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <Label>WhatsApp Number</Label>
                       <Input value={featured.whatsapp} onChange={e => setFeatured({...featured, whatsapp: e.target.value})} />
                    </div>
                    <div>
                       <Label>WA Button Text</Label>
                       <Input value={featured.whatsappBtnText} onChange={e => setFeatured({...featured, whatsappBtnText: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-2">
                     <Label>Main CTA Text</Label>
                     <Input value={featured.ctaText} onChange={e => setFeatured({...featured, ctaText: e.target.value})} />
                  </div>
                  <Button onClick={() => saveSettings('homepage_featured_project_settings', featured, 'Featured section')}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Team Editor */}
            <TabsContent value="team" className="space-y-4">
              <Card>
                <CardHeader><CardTitle>Team Section</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                   <div className="flex items-center space-x-2">
                      <Switch 
                        checked={team.enabled} 
                        onCheckedChange={checked => setTeam({...team, enabled: checked})} 
                        id="team-mode" 
                      />
                      <Label htmlFor="team-mode">Show Team Section on Homepage</Label>
                   </div>
                   
                   {!team.enabled ? (
                      <div className="p-4 bg-gray-100 rounded text-center text-gray-500 text-sm">
                         Team section is currently hidden.
                      </div>
                   ) : (
                      <div className="space-y-4 border-t pt-4">
                         <div className="text-sm font-medium">Manage Members</div>
                         {team.members.map((member, idx) => (
                            <div key={idx} className="p-3 border rounded bg-gray-50 flex justify-between items-center">
                               <div className="flex items-center gap-3">
                                  {member.image && <img src={member.image} alt={member.name} className="w-8 h-8 rounded-full object-cover" />}
                                  <div>
                                     <div className="font-bold text-sm">{member.name}</div>
                                     <div className="text-xs text-gray-500">{member.position}</div>
                                  </div>
                               </div>
                               <Button variant="ghost" size="sm" className="text-red-500 h-8 w-8 p-0" onClick={() => {
                                  const newMembers = [...team.members];
                                  newMembers.splice(idx, 1);
                                  setTeam({...team, members: newMembers});
                               }}>×</Button>
                            </div>
                         ))}
                         
                         {/* Simple Add Form */}
                         <div className="grid gap-2 p-3 border border-dashed rounded bg-blue-50/50">
                            <Input placeholder="Name" id="new-name" />
                            <Input placeholder="Position" id="new-pos" />
                            <Textarea placeholder="Bio" id="new-bio" className="h-20" />
                            <Button size="sm" variant="outline" onClick={() => {
                               const name = document.getElementById('new-name').value;
                               const pos = document.getElementById('new-pos').value;
                               const bio = document.getElementById('new-bio').value;
                               if(name && pos) {
                                  setTeam({...team, members: [...team.members, { name, position: pos, bio, image: "https://via.placeholder.com/150" }]});
                                  document.getElementById('new-name').value = '';
                                  document.getElementById('new-pos').value = '';
                                  document.getElementById('new-bio').value = '';
                               }
                            }}>Add Member</Button>
                         </div>
                      </div>
                   )}
                   <Button onClick={() => saveSettings('homepage_team_settings', team, 'Team section')}>Save Changes</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* General Settings */}
            <TabsContent value="general" className="space-y-4">
               <Card>
                  <CardHeader><CardTitle>General Branding</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <Label>Website Title</Label>
                           <Input value={general.title} onChange={e => setGeneral({...general, title: e.target.value})} />
                        </div>
                        <div>
                           <Label>Tagline</Label>
                           <Input value={general.tagline} onChange={e => setGeneral({...general, tagline: e.target.value})} />
                        </div>
                     </div>
                     <div className="grid grid-cols-3 gap-4">
                        <div>
                           <Label>Primary Color</Label>
                           <div className="flex gap-2 mt-1">
                              <div className="w-8 h-8 rounded border" style={{background: general.primaryColor}}></div>
                              <Input type="color" className="w-full h-8 p-0 border-0" value={general.primaryColor} onChange={e => setGeneral({...general, primaryColor: e.target.value})} />
                           </div>
                        </div>
                        <div>
                           <Label>Secondary Color</Label>
                           <div className="flex gap-2 mt-1">
                              <div className="w-8 h-8 rounded border" style={{background: general.secondaryColor}}></div>
                              <Input type="color" className="w-full h-8 p-0 border-0" value={general.secondaryColor} onChange={e => setGeneral({...general, secondaryColor: e.target.value})} />
                           </div>
                        </div>
                        <div>
                           <Label>Accent Color</Label>
                           <div className="flex gap-2 mt-1">
                              <div className="w-8 h-8 rounded border" style={{background: general.accentColor}}></div>
                              <Input type="color" className="w-full h-8 p-0 border-0" value={general.accentColor} onChange={e => setGeneral({...general, accentColor: e.target.value})} />
                           </div>
                        </div>
                     </div>
                     <Button onClick={() => saveSettings('homepage_general_settings', general, 'General settings')}>Save Changes</Button>
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="w-full lg:w-[60%] bg-gray-100 overflow-y-auto p-8 flex justify-center">
           <div className="w-full max-w-[800px] bg-white shadow-2xl rounded-xl overflow-hidden min-h-[800px] transform scale-[0.85] origin-top border-4 border-gray-800">
               {/* Preview Header */}
               <div className="bg-gray-800 text-white p-2 text-xs text-center">Live Preview</div>
               
               {/* Hero Preview */}
               <div className="relative h-[400px] flex items-center justify-center text-center text-white p-8 bg-cover bg-center" style={{backgroundImage: `url(${hero.bgImage})`}}>
                  <div className="absolute inset-0" style={{backgroundColor: hero.overlayColor}}></div>
                  <div className="relative z-10 max-w-2xl">
                     <h1 className="text-4xl font-bold mb-4">{hero.heading}</h1>
                     <p className="text-lg mb-8 opacity-90">{hero.subheading}</p>
                     <button className="px-6 py-3 rounded font-bold shadow-lg" style={{backgroundColor: general.secondaryColor, color: general.primaryColor}}>
                        {hero.ctaText}
                     </button>
                  </div>
               </div>

               {/* Stats Preview */}
               <div className="py-10 px-8 bg-white border-b">
                  <div className="grid grid-cols-4 gap-4 text-center">
                     {[
                        {v: stats.foundedValue, l: stats.foundedLabel},
                        {v: stats.projectsValue, l: stats.projectsLabel},
                        {v: stats.customersValue, l: stats.customersLabel},
                        {v: stats.legalDesc, l: stats.legalLabel}
                     ].map((s, i) => (
                        <div key={i} className="p-4 bg-gray-800 text-white rounded">
                           <div className="text-2xl font-bold" style={{color: general.secondaryColor}}>{s.v}</div>
                           <div className="text-xs opacity-70">{s.l}</div>
                        </div>
                     ))}
                  </div>
               </div>

               {/* Projects Preview */}
               <div className="py-10 px-8 bg-gray-50">
                   <div className="text-center mb-8">
                      <h2 className="text-2xl font-bold" style={{color: general.primaryColor}}>{projects.heading}</h2>
                      <p className="text-gray-500 text-sm">{projects.description}</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                       {[1, 2].map((i) => (
                          <div key={i} className="bg-white rounded shadow p-4">
                             <div className="h-32 bg-gray-200 mb-4 rounded"></div>
                             <h3 className="font-bold mb-2">Sample Project {i}</h3>
                             <div className="flex justify-between text-xs text-gray-500 mb-4">
                                <span>{projects.sqYardLabel}</span>
                                <span>{projects.bookingLabel}</span>
                             </div>
                             <button className="w-full py-2 rounded text-sm font-bold border" style={{borderColor: general.primaryColor, color: general.primaryColor}}>
                                {projects.ctaText}
                             </button>
                          </div>
                       ))}
                   </div>
               </div>

               {/* Featured Preview */}
               <div className="py-10 px-8 bg-white">
                  <div className="flex gap-6 items-center">
                      <div className="flex-1">
                          <h2 className="text-2xl font-bold mb-2" style={{color: general.primaryColor}}>{featured.heading}</h2>
                          <p className="text-sm text-gray-600 mb-4">{featured.description}</p>
                          <div className="flex gap-2">
                             <button className="px-4 py-2 rounded text-sm text-white" style={{backgroundColor: general.primaryColor}}>{featured.ctaText}</button>
                             <button className="px-4 py-2 rounded text-sm text-white bg-[#25D366]">{featured.whatsappBtnText}</button>
                          </div>
                      </div>
                      <div className="w-1/3">
                          <img src={featured.image} alt="Featured" className="rounded shadow-lg" />
                      </div>
                  </div>
               </div>

               {/* Team Preview */}
               {team.enabled && (
                  <div className="py-10 px-8 bg-gray-50">
                     <h2 className="text-2xl font-bold text-center mb-6" style={{color: general.primaryColor}}>Our Team</h2>
                     <div className="grid grid-cols-3 gap-4 text-center">
                        {team.members.length > 0 ? team.members.map((m, i) => (
                           <div key={i} className="bg-white p-4 rounded shadow">
                              <div className="w-16 h-16 bg-gray-200 rounded-full mx-auto mb-2 overflow-hidden">
                                 {m.image && <img src={m.image} className="w-full h-full object-cover" />}
                              </div>
                              <div className="font-bold text-sm">{m.name}</div>
                              <div className="text-xs text-gray-500">{m.position}</div>
                           </div>
                        )) : <div className="col-span-3 text-sm text-gray-400">No members added yet</div>}
                     </div>
                  </div>
               )}
           </div>
        </div>
      </div>
    </div>
  );
};

export default HomepageContentEditor;
