
import React, { useState } from 'react';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { CheckCircle, Circle, Clock } from 'lucide-react';

const Tasks = () => {
  const { user } = useAuth();
  const { addTask, updateTask, tasks } = useCRMData();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    text: '',
    priority: 'Medium',
    deadline: '',
    category: 'Follow-up'
  });

  const myTasks = tasks.filter(t => t.employeeId === user?.id).sort((a,b) => new Date(a.deadline) - new Date(b.deadline));
  const pendingTasks = myTasks.filter(t => t.status !== 'Completed');
  const completedTasks = myTasks.filter(t => t.status === 'Completed');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.text) return;
    
    addTask({
      ...formData,
      employeeId: user.id
    });

    toast({ title: "Task Added" });
    setFormData({ text: '', priority: 'Medium', deadline: '', category: 'Follow-up' });
  };

  const toggleTask = (task) => {
    updateTask(task.id, { status: task.status === 'Completed' ? 'Pending' : 'Completed' });
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Task Manager</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <Card className="h-fit">
            <CardHeader><CardTitle>Add Task</CardTitle></CardHeader>
            <CardContent>
               <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Task Description</label>
                     <Input value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} placeholder="Call Mr. Sharma..." />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Deadline</label>
                     <Input type="datetime-local" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                     <label className="text-sm font-medium">Priority</label>
                     <Select value={formData.priority} onValueChange={val => setFormData({...formData, priority: val})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                           <SelectItem value="High">High</SelectItem>
                           <SelectItem value="Medium">Medium</SelectItem>
                           <SelectItem value="Low">Low</SelectItem>
                        </SelectContent>
                     </Select>
                  </div>
                  <Button type="submit" className="w-full">Add Task</Button>
               </form>
            </CardContent>
         </Card>

         <Card className="md:col-span-2">
            <CardHeader><CardTitle>My Tasks</CardTitle></CardHeader>
            <CardContent>
               <div className="space-y-4">
                  {pendingTasks.map(task => (
                     <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg bg-white">
                        <button onClick={() => toggleTask(task)} className="text-gray-400 hover:text-green-500">
                           <Circle />
                        </button>
                        <div className="flex-1">
                           <p className="font-medium">{task.text}</p>
                           <div className="flex gap-2 text-xs text-gray-500 mt-1">
                              <span className={`px-1.5 py-0.5 rounded ${task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-gray-100'}`}>{task.priority}</span>
                              <span className="flex items-center gap-1"><Clock size={12}/> {new Date(task.deadline).toLocaleString()}</span>
                           </div>
                        </div>
                     </div>
                  ))}
                  {pendingTasks.length === 0 && <p className="text-center text-gray-500 py-4">No pending tasks! 🎉</p>}
                  
                  {completedTasks.length > 0 && (
                     <>
                        <h4 className="text-sm font-semibold text-gray-500 mt-6 mb-2">Completed</h4>
                        {completedTasks.map(task => (
                           <div key={task.id} className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50 opacity-70">
                              <button onClick={() => toggleTask(task)} className="text-green-500">
                                 <CheckCircle />
                              </button>
                              <div className="flex-1">
                                 <p className="font-medium line-through">{task.text}</p>
                              </div>
                           </div>
                        ))}
                     </>
                  )}
               </div>
            </CardContent>
         </Card>
      </div>
    </div>
  );
};

export default Tasks;
