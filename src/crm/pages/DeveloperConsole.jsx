
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { ROLES } from '@/lib/permissions';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { 
  Terminal, Upload, FileCode, RotateCcw, AlertTriangle, 
  Folder, FolderOpen, File, FileImage, Search, X, Save, Trash2, Database
} from 'lucide-react';
import JSZip from 'jszip';
import Prism from 'prismjs';
import 'prismjs/themes/prism-tomorrow.css';
import { useCRMData } from '@/crm/hooks/useCRMData';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';

const DeveloperConsole = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { clearDummyData } = useCRMData();
  
  // States
  const [zipFile, setZipFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deployStatus, setDeployStatus] = useState('idle');
  const [fileSystem, setFileSystem] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [deploymentLogs, setDeploymentLogs] = useState([]);
  const [versionHistory, setVersionHistory] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Data Clearing States
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [clearProgress, setClearProgress] = useState(0);

  // Refs
  const fileInputRef = useRef(null);
  const codeEditorRef = useRef(null);

  // Load initial data
  useEffect(() => {
    const logs = localStorage.getItem('dev_console_logs');
    if (logs) setDeploymentLogs(JSON.parse(logs));
    
    const versions = localStorage.getItem('dev_console_versions');
    if (versions) setVersionHistory(JSON.parse(versions));

    if(fileSystem.length === 0) {
        setFileSystem([
            { name: 'assets', type: 'folder', children: [
                { name: 'logo.png', type: 'file', ext: 'png', size: '24KB' },
                { name: 'hero.jpg', type: 'file', ext: 'jpg', size: '1.2MB' }
            ]},
            { name: 'config', type: 'folder', children: [
                { name: 'theme.json', type: 'file', ext: 'json', size: '2KB', content: '{\n  "theme": "dark"\n}' }
            ]}
        ]);
    }
  }, []);

  // Effect for Prism highlighting
  useEffect(() => {
    if (isEditorOpen && codeEditorRef.current) {
        Prism.highlightElement(codeEditorRef.current);
    }
  }, [isEditorOpen, editorContent]);

  // Auth Check
  if (!user || user.role !== ROLES.SUPER_ADMIN) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-red-500 font-mono">
        <AlertTriangle className="mr-2" /> Access Denied: ROOT privileges required.
      </div>
    );
  }

  // --- Data Clearing Logic ---
  const handleClearData = async () => {
      setIsClearing(true);
      setClearProgress(10);
      
      // Simulate steps
      await new Promise(r => setTimeout(r, 500));
      setClearProgress(40);
      
      await new Promise(r => setTimeout(r, 500));
      setClearProgress(70);
      
      clearDummyData();
      
      await new Promise(r => setTimeout(r, 500));
      setClearProgress(100);
      
      setTimeout(() => {
          setIsClearing(false);
          setIsClearModalOpen(false);
          setClearProgress(0);
          toast({ title: "Data Cleared", description: "All dummy data has been removed successfully." });
      }, 500);
  };

  // --- File Upload & ZIP Handling ---
  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
        if (file.name.endsWith('.zip')) {
            if (file.size > 500 * 1024 * 1024) {
                toast({ title: "Error", description: "File size exceeds 500MB limit", variant: "destructive" });
                return;
            }
            setZipFile(file);
        } else {
            toast({ title: "Invalid File", description: "Please upload a .zip file", variant: "destructive" });
        }
    }
  };

  const handleDeploy = async () => {
      if (!zipFile) return;
      
      setDeployStatus('extracting');
      setUploadProgress(10);
      
      try {
          const interval = setInterval(() => {
              setUploadProgress(prev => Math.min(prev + 10, 90));
          }, 200);

          const zip = new JSZip();
          const contents = await zip.loadAsync(zipFile);
          const newFiles = [];

          const filePromises = [];
          
          contents.forEach((relativePath, zipEntry) => {
              filePromises.push(async () => {
                  if (!zipEntry.dir) {
                      const content = await zipEntry.async("string");
                      newFiles.push({
                          name: zipEntry.name,
                          type: 'file',
                          ext: zipEntry.name.split('.').pop(),
                          size: '10KB',
                          content: content
                      });
                  }
              });
          });

          await Promise.all(filePromises.map(f => f()));
          
          clearInterval(interval);
          setUploadProgress(100);
          setDeployStatus('success');
          setFileSystem(prev => [...prev, ...newFiles]);

          const newLog = {
              id: Date.now(),
              timestamp: new Date().toISOString(),
              admin: user.name,
              action: `Deployed ZIP: ${zipFile.name}`,
              status: 'Success'
          };
          const updatedLogs = [newLog, ...deploymentLogs];
          setDeploymentLogs(updatedLogs);
          localStorage.setItem('dev_console_logs', JSON.stringify(updatedLogs));

          toast({ title: "Deployment Successful", description: `${newFiles.length} files processed.` });

      } catch (error) {
          console.error(error);
          setDeployStatus('error');
          toast({ title: "Deployment Failed", description: error.message, variant: "destructive" });
      }
  };

  // --- Editor Functions ---
  const openEditor = (file) => {
      if (file.type === 'folder') return;
      setSelectedFile(file);
      setEditorContent(file.content || '// No content available or binary file');
      setIsEditorOpen(true);
  };

  const saveFile = () => {
      const updateFile = (files) => {
          return files.map(f => {
              if (f.name === selectedFile.name) return { ...f, content: editorContent };
              if (f.children) return { ...f, children: updateFile(f.children) };
              return f;
          });
      };
      setFileSystem(updateFile(fileSystem));
      setIsEditorOpen(false);
      toast({ title: "File Saved", description: `${selectedFile.name} updated.` });
  };

  const FileTreeItem = ({ item, depth = 0 }) => {
      const [isOpen, setIsOpen] = useState(false);
      
      const getIcon = () => {
          if (item.type === 'folder') return isOpen ? <FolderOpen size={16} className="text-yellow-400" /> : <Folder size={16} className="text-yellow-400" />;
          if (['jpg', 'png', 'svg'].includes(item.ext)) return <FileImage size={16} className="text-green-400" />;
          if (['js', 'jsx'].includes(item.ext)) return <FileCode size={16} className="text-blue-400" />;
          return <File size={16} className="text-gray-400" />;
      };

      return (
          <div className="select-none">
              <div 
                className="flex items-center gap-2 py-1 px-2 hover:bg-[#2a2a2a] cursor-pointer text-sm font-mono text-gray-300"
                style={{ paddingLeft: `${depth * 20 + 8}px` }}
                onClick={() => {
                    if (item.type === 'folder') setIsOpen(!isOpen);
                    else openEditor(item);
                }}
              >
                  {getIcon()}
                  <span>{item.name}</span>
                  {item.size && <span className="ml-auto text-xs text-gray-600">{item.size}</span>}
              </div>
              {isOpen && item.children && (
                  <div>
                      {item.children.map((child, i) => <FileTreeItem key={i} item={child} depth={depth + 1} />)}
                  </div>
              )}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#e0e0e0] font-mono flex flex-col">
       {/* Header */}
       <div className="border-b border-[#333] p-4 flex justify-between items-center bg-[#0f0f0f]">
           <div>
               <h1 className="text-lg font-bold flex items-center gap-2 text-[#10b981]">
                   <Terminal size={20} /> Developer Console
               </h1>
               <p className="text-xs text-gray-500">Fanbe Developer • System v2.4.0 • root@{user.name.toLowerCase().replace(/\s/g, '')}</p>
           </div>
           <div className="flex gap-2">
               <Button variant="outline" size="sm" className="border-[#333] hover:bg-[#333] text-gray-400">Docs</Button>
               <Button variant="destructive" size="sm" onClick={() => window.close()}>Exit</Button>
           </div>
       </div>

       {/* Main Content */}
       <div className="flex-1 overflow-hidden">
           <Tabs defaultValue="deploy" className="h-full flex flex-col">
               <div className="border-b border-[#333] bg-[#1a1a1a] px-4">
                   <TabsList className="bg-transparent border-none p-0 h-12 gap-6">
                       <TabsTrigger value="deploy" className="data-[state=active]:bg-transparent data-[state=active]:text-[#10b981] data-[state=active]:border-b-2 data-[state=active]:border-[#10b981] rounded-none border-b-2 border-transparent px-0">ZIP Deployment</TabsTrigger>
                       <TabsTrigger value="files" className="data-[state=active]:bg-transparent data-[state=active]:text-[#10b981] data-[state=active]:border-b-2 data-[state=active]:border-[#10b981] rounded-none border-b-2 border-transparent px-0">File Manager</TabsTrigger>
                       <TabsTrigger value="data" className="data-[state=active]:bg-transparent data-[state=active]:text-[#10b981] data-[state=active]:border-b-2 data-[state=active]:border-[#10b981] rounded-none border-b-2 border-transparent px-0">Data Management</TabsTrigger>
                       <TabsTrigger value="logs" className="data-[state=active]:bg-transparent data-[state=active]:text-[#10b981] data-[state=active]:border-b-2 data-[state=active]:border-[#10b981] rounded-none border-b-2 border-transparent px-0">Logs</TabsTrigger>
                   </TabsList>
               </div>

               {/* Deploy Tab */}
               <TabsContent value="deploy" className="p-8 flex-1 overflow-y-auto">
                   <div className="max-w-3xl mx-auto space-y-8">
                       <Card className="bg-[#0f0f0f] border-[#333] text-gray-300">
                           <CardContent className="p-8 text-center space-y-6">
                               <div 
                                  className="border-2 border-dashed border-[#333] rounded-lg p-12 hover:border-[#10b981] hover:bg-[#1a1a1a] transition-all cursor-pointer group"
                                  onClick={() => fileInputRef.current.click()}
                               >
                                   <div className="h-16 w-16 bg-[#1a1a1a] rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-[#0f0f0f]">
                                       <Upload size={32} className="text-gray-500 group-hover:text-[#10b981]" />
                                   </div>
                                   <h3 className="text-lg font-bold mb-2">Upload Asset Bundle (.zip)</h3>
                                   <p className="text-sm text-gray-500 mb-6">Drag & drop or click to browse. Max 500MB.</p>
                                   <input 
                                      type="file" 
                                      ref={fileInputRef} 
                                      className="hidden" 
                                      accept=".zip" 
                                      onChange={handleFileSelect}
                                   />
                                   {zipFile && (
                                       <div className="bg-[#1a1a1a] p-3 rounded border border-[#333] inline-flex items-center gap-3">
                                           <FileCode size={20} className="text-yellow-500" />
                                           <span className="text-sm font-mono">{zipFile.name}</span>
                                           <span className="text-xs text-gray-500">({(zipFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                                           <button onClick={(e) => { e.stopPropagation(); setZipFile(null); }} className="hover:text-red-500"><X size={16} /></button>
                                       </div>
                                   )}
                               </div>
                               <div className="flex gap-4 justify-center">
                                   <Button 
                                      className="bg-[#10b981] hover:bg-[#059669] text-black font-bold px-8"
                                      disabled={!zipFile || deployStatus === 'extracting'}
                                      onClick={handleDeploy}
                                   >
                                       {deployStatus === 'extracting' ? 'Deploying...' : 'Extract & Deploy'}
                                   </Button>
                               </div>
                           </CardContent>
                       </Card>
                   </div>
               </TabsContent>

               {/* File Manager Tab */}
               <TabsContent value="files" className="flex-1 overflow-hidden flex">
                   <div className="w-64 border-r border-[#333] bg-[#0f0f0f] overflow-y-auto p-4">
                       <div className="mb-4 relative">
                           <Search size={14} className="absolute left-2 top-2 text-gray-500" />
                           <input 
                              placeholder="Search files..." 
                              className="w-full bg-[#1a1a1a] border border-[#333] rounded py-1 pl-8 pr-2 text-xs text-gray-300 focus:border-[#10b981] outline-none"
                              value={searchTerm}
                              onChange={e => setSearchTerm(e.target.value)}
                           />
                       </div>
                       <div className="space-y-1">
                           {fileSystem.map((item, i) => <FileTreeItem key={i} item={item} />)}
                       </div>
                   </div>
                   <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center text-gray-600">
                       {!isEditorOpen ? (
                           <div className="text-center">
                               <FileCode size={48} className="mx-auto mb-4 opacity-20" />
                               <p>Select a file to view or edit</p>
                           </div>
                       ) : (
                           <div className="w-full h-full flex flex-col">
                               <div className="h-10 border-b border-[#333] bg-[#0f0f0f] flex justify-between items-center px-4">
                                   <span className="text-xs font-mono text-[#10b981]">{selectedFile.name}</span>
                                   <div className="flex gap-2">
                                       <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-[#333] hover:text-[#10b981]" onClick={saveFile}><Save size={12} className="mr-1" /> Save</Button>
                                       <Button size="sm" variant="ghost" className="h-7 text-xs hover:bg-[#333] hover:text-red-500" onClick={() => setIsEditorOpen(false)}><X size={12} /></Button>
                                   </div>
                               </div>
                               <textarea
                                  ref={codeEditorRef}
                                  className="flex-1 bg-[#1e1e1e] text-[#d4d4d4] font-mono text-sm p-4 outline-none resize-none"
                                  value={editorContent}
                                  onChange={e => setEditorContent(e.target.value)}
                                  spellCheck="false"
                               ></textarea>
                           </div>
                       )}
                   </div>
               </TabsContent>
               
               {/* Data Management Tab */}
               <TabsContent value="data" className="p-8 flex-1 overflow-y-auto">
                   <div className="max-w-2xl mx-auto space-y-8">
                       <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                           <Database size={20} className="text-red-500" /> Database Operations
                       </h2>
                       <Card className="bg-[#0f0f0f] border-red-900/30 text-gray-300">
                           <CardContent className="p-6">
                               <div className="flex justify-between items-start">
                                    <div className="space-y-2">
                                        <h3 className="font-bold text-red-500">Clear Dummy Data</h3>
                                        <p className="text-sm text-gray-500 max-w-sm">
                                            Permanently delete all leads, calls, logs, and performance data generated during testing. 
                                            <br/><br/>
                                            <span className="text-gray-400 font-bold">Safe:</span> Keeps accounts (Admin/Employees) and Project definitions.
                                        </p>
                                    </div>
                                    <Button variant="destructive" onClick={() => setIsClearModalOpen(true)}>Clear All Data</Button>
                               </div>
                           </CardContent>
                       </Card>
                   </div>
               </TabsContent>

               {/* Logs Tab */}
               <TabsContent value="logs" className="p-8 flex-1 overflow-y-auto">
                   <div className="max-w-6xl mx-auto">
                       <div className="bg-[#0f0f0f] border border-[#333] rounded-lg overflow-hidden font-mono text-sm">
                           <table className="w-full text-left">
                               <thead className="bg-[#1a1a1a] text-gray-500 border-b border-[#333]">
                                   <tr>
                                       <th className="p-3">Timestamp</th>
                                       <th className="p-3">Admin</th>
                                       <th className="p-3">Action</th>
                                       <th className="p-3">Status</th>
                                   </tr>
                               </thead>
                               <tbody className="divide-y divide-[#333]">
                                   {deploymentLogs.map((log) => (
                                       <tr key={log.id} className="hover:bg-[#1a1a1a]">
                                           <td className="p-3 text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                           <td className="p-3 text-[#10b981]">{log.admin}</td>
                                           <td className="p-3">{log.action}</td>
                                           <td className="p-3">{log.status}</td>
                                       </tr>
                                   ))}
                               </tbody>
                           </table>
                       </div>
                   </div>
               </TabsContent>
           </Tabs>
       </div>
       
       {/* Confirmation Modal for Clearing Data */}
        <Dialog open={isClearModalOpen} onOpenChange={(open) => { if(!isClearing) setIsClearModalOpen(open); }}>
            <DialogContent className="bg-[#1a1a1a] border-[#333] text-gray-200">
                <DialogHeader>
                    <DialogTitle className="text-red-500 flex items-center gap-2"><AlertTriangle /> Clear All Data?</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        This action is irreversible. All dummy leads and logs will be deleted.
                    </DialogDescription>
                </DialogHeader>
                
                {isClearing ? (
                    <div className="py-4 space-y-2">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Deleting records...</span>
                            <span>{clearProgress}%</span>
                        </div>
                        <Progress value={clearProgress} className="h-2 bg-[#333]" indicatorClassName="bg-red-500" />
                    </div>
                ) : (
                    <div className="bg-red-900/10 border border-red-900/30 p-4 rounded text-sm text-red-200">
                        <p>You are about to delete:</p>
                        <ul className="list-disc list-inside mt-2 text-xs opacity-80">
                            <li>All Leads and Customer Data</li>
                            <li>Call Logs & Site Visit Records</li>
                            <li>Performance Metrics</li>
                            <li>Task History</li>
                        </ul>
                    </div>
                )}
                
                <DialogFooter>
                    {!isClearing && (
                        <>
                            <Button variant="ghost" onClick={() => setIsClearModalOpen(false)} className="hover:bg-[#333] text-gray-400">Cancel</Button>
                            <Button variant="destructive" onClick={handleClearData} className="bg-red-600 hover:bg-red-700">Yes, Clear Data</Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
  );
};

export default DeveloperConsole;
