
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { Trash2, GripVertical, Save, Plus, ArrowUp, ArrowDown } from 'lucide-react';
import { useNavMenu, updateNavMenu } from '@/lib/contentSync';

const NavigationMenuEditor = () => {
  const { toast } = useToast();
  const navMenu = useNavMenu();
  const [localMenu, setLocalMenu] = useState(navMenu);
  const [newItem, setNewItem] = useState({ label: '', url: '', position: 'header' });

  const handleAddItem = () => {
    if (!newItem.label || !newItem.url) {
      toast({ title: "Error", description: "Label and URL are required", variant: "destructive" });
      return;
    }

    const id = `menu-${Date.now()}`;
    const item = { ...newItem, id, visibility: 'public' };
    
    setLocalMenu(prev => ({
      items: [...prev.items, item],
      order: [...prev.order, id]
    }));
    
    setNewItem({ label: '', url: '', position: 'header' });
    toast({ title: "Success", description: "Menu item added" });
  };

  const handleDeleteItem = (id) => {
    setLocalMenu(prev => ({
      items: prev.items.filter(i => i.id !== id),
      order: prev.order.filter(oid => oid !== id)
    }));
  };

  const moveItem = (index, direction) => {
    const newOrder = [...localMenu.order];
    if (direction === 'up' && index > 0) {
      [newOrder[index], newOrder[index - 1]] = [newOrder[index - 1], newOrder[index]];
    } else if (direction === 'down' && index < newOrder.length - 1) {
      [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    }
    setLocalMenu(prev => ({ ...prev, order: newOrder }));
  };

  const handleSave = () => {
    updateNavMenu(localMenu);
    toast({ title: "Menu Saved", description: "Navigation menu updated successfully" });
  };

  // Sort items based on order array
  const orderedItems = localMenu.order
    .map(id => localMenu.items.find(i => i.id === id))
    .filter(Boolean);

  return (
    <div className="space-y-8 p-4 md:p-8 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Navigation Menu</h1>
          <p className="text-gray-500">Manage website navigation links</p>
        </div>
        <Button onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 w-full md:w-auto">
          <Save className="mr-2" size={18} /> Save Menu
        </Button>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Editor Column */}
        <div className="md:col-span-2 space-y-6">
          <Card>
             <CardHeader>
               <CardTitle>Current Menu Structure</CardTitle>
             </CardHeader>
             <CardContent className="space-y-4">
               {orderedItems.map((item, index) => (
                 <div key={item.id} className="flex items-center gap-3 p-3 bg-white border rounded shadow-sm">
                   <div className="flex flex-col gap-1">
                     <Button 
                       size="icon" variant="ghost" className="h-6 w-6" 
                       disabled={index === 0}
                       onClick={() => moveItem(index, 'up')}
                     >
                       <ArrowUp size={14} />
                     </Button>
                     <Button 
                       size="icon" variant="ghost" className="h-6 w-6" 
                       disabled={index === orderedItems.length - 1}
                       onClick={() => moveItem(index, 'down')}
                     >
                       <ArrowDown size={14} />
                     </Button>
                   </div>
                   <div className="flex-1">
                     <p className="font-semibold text-gray-900">{item.label}</p>
                     <p className="text-xs text-gray-500">{item.url}</p>
                   </div>
                   <div className="px-2 py-1 bg-gray-100 text-xs rounded uppercase">{item.visibility}</div>
                   <Button size="icon" variant="ghost" onClick={() => handleDeleteItem(item.id)} className="text-red-500">
                     <Trash2 size={16} />
                   </Button>
                 </div>
               ))}
               {orderedItems.length === 0 && <p className="text-gray-400 text-center py-4">No menu items</p>}
             </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Add New Item</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label>Label</Label>
                   <Input 
                     value={newItem.label}
                     onChange={(e) => setNewItem({...newItem, label: e.target.value})} 
                     placeholder="e.g. Careers"
                   />
                 </div>
                 <div className="space-y-2">
                   <Label>URL</Label>
                   <Input 
                     value={newItem.url}
                     onChange={(e) => setNewItem({...newItem, url: e.target.value})} 
                     placeholder="e.g. /careers"
                   />
                 </div>
              </div>
              <Button onClick={handleAddItem} variant="secondary" className="w-full">
                <Plus size={16} className="mr-2" /> Add to Menu
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Preview Column */}
        <div>
           <Card className="sticky top-6">
             <CardHeader>
               <CardTitle>Live Preview</CardTitle>
             </CardHeader>
             <CardContent>
               <div className="bg-[#0F3A5F] p-4 rounded-lg shadow-inner">
                  <div className="flex flex-col gap-2">
                    {orderedItems.map(item => (
                      <span key={item.id} className="text-gray-300 hover:text-white text-sm font-medium cursor-pointer transition-colors px-2 py-1 hover:bg-white/10 rounded">
                        {item.label}
                      </span>
                    ))}
                  </div>
               </div>
               <p className="text-xs text-gray-500 mt-2 text-center">Vertical preview (Responsive view)</p>
             </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
};

export default NavigationMenuEditor;
