
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const SalesTools = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-[#0F3A5F]">Sales Tools</h1>
      
      <Tabs defaultValue="objections">
         <TabsList>
            <TabsTrigger value="objections">Objection Handling</TabsTrigger>
            <TabsTrigger value="calculator">EMI Calculator</TabsTrigger>
            <TabsTrigger value="quickinfo">Quick Info</TabsTrigger>
         </TabsList>

         <TabsContent value="objections">
            <Card>
               <CardHeader><CardTitle>Common Objections Guide</CardTitle></CardHeader>
               <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                     <AccordionItem value="item-1">
                        <AccordionTrigger>Price is too high</AccordionTrigger>
                        <AccordionContent>
                           <p className="mb-2"><strong>Response Strategy:</strong> Focus on value, ROI, and future appreciation.</p>
                           <ul className="list-disc pl-5 space-y-1 text-gray-600">
                              <li>Compare per sq.ft rate with nearby developed areas.</li>
                              <li>Highlight upcoming infrastructure (Metro, Highway).</li>
                              <li>Explain amenities provided which save future costs.</li>
                           </ul>
                        </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="item-2">
                        <AccordionTrigger>Location is too far</AccordionTrigger>
                        <AccordionContent>
                           <p>Explain connectivity plans and show how travel time will reduce. Mention peace and pollution-free environment.</p>
                        </AccordionContent>
                     </AccordionItem>
                     <AccordionItem value="item-3">
                        <AccordionTrigger>Documentation doubts</AccordionTrigger>
                        <AccordionContent>
                           <p>Show RERA registration number immediately. Offer to arrange a meeting with legal team.</p>
                        </AccordionContent>
                     </AccordionItem>
                  </Accordion>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="calculator">
            <Card>
               <CardContent className="p-6 text-center text-gray-500">
                  <p>EMI Calculator Widget Placeholder</p>
               </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="quickinfo">
            <Card>
               <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="p-4 border rounded bg-gray-50">
                        <h3 className="font-bold mb-2">Shree Kunj Bihari</h3>
                        <p className="text-sm">Location: Vatika Rd</p>
                        <p className="text-sm">Price: ₹15.5L - ₹30L</p>
                        <p className="text-sm">Possession: Dec 2024</p>
                     </div>
                     <div className="p-4 border rounded bg-gray-50">
                        <h3 className="font-bold mb-2">Khatu Shyam Enclave</h3>
                        <p className="text-sm">Location: Tonk Rd</p>
                        <p className="text-sm">Price: ₹12L - ₹25L</p>
                        <p className="text-sm">Possession: Ready to Move</p>
                     </div>
                  </div>
               </CardContent>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
};

export default SalesTools;
