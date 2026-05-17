
import React, { createContext, useContext, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext({});

const Tabs = ({ defaultValue, value, onValueChange, children, className }) => {
  const [selected, setSelected] = useState(defaultValue);
  const current = value !== undefined ? value : selected;
  const onChange = onValueChange || setSelected;

  return (
    <TabsContext.Provider value={{ value: current, onChange }}>
      <div className={cn("", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

const TabsList = ({ children, className }) => (
  <div className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-gray-100 p-1 text-muted-foreground", className)}>
    {children}
  </div>
);

const TabsTrigger = ({ value, children, className }) => {
  const { value: selectedValue, onChange } = useContext(TabsContext);
  const isSelected = selectedValue === value;
  return (
    <button
      type="button"
      onClick={() => onChange(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isSelected ? "bg-white text-foreground shadow" : "hover:bg-gray-200/50",
        className
      )}
    >
      {children}
    </button>
  );
};

const TabsContent = ({ value, children, className }) => {
  const { value: selectedValue } = useContext(TabsContext);
  if (selectedValue !== value) return null;
  return (
    <div className={cn("mt-2 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)}>
      {children}
    </div>
  );
};

export { Tabs, TabsList, TabsTrigger, TabsContent };
