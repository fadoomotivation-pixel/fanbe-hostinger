
import React, { createContext, useContext, useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { ChevronDown, Check } from 'lucide-react';

const SelectContext = createContext({});

const Select = ({ children, value, onValueChange }) => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(value);
  const [labels, setLabels] = useState({});

  useEffect(() => {
    if (value !== undefined) setSelected(value);
  }, [value]);

  const handleSelect = (val) => {
    setSelected(val);
    if (onValueChange) onValueChange(val);
    setOpen(false);
  };

  const registerLabel = (val, label) => {
    setLabels(prev => ({ ...prev, [val]: label }));
  };

  return (
    <SelectContext.Provider value={{ open, setOpen, selected, handleSelect, labels, registerLabel }}>
      <div className="relative">{children}</div>
    </SelectContext.Provider>
  );
};

const SelectTrigger = ({ children, className }) => {
  const { open, setOpen } = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 bg-white",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 opacity-50" />
    </button>
  );
};

const SelectValue = ({ placeholder }) => {
  const { selected, labels } = useContext(SelectContext);
  return <span>{labels[selected] || selected || placeholder}</span>;
};

const SelectContent = ({ children, className }) => {
  const { open } = useContext(SelectContext);
  if (!open) return null;
  return (
    <div className={cn("absolute top-full mt-1 z-50 min-w-[8rem] w-full overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md animate-in fade-in-80 bg-white", className)}>
      <div className="p-1 max-h-60 overflow-auto">{children}</div>
    </div>
  );
};

const SelectItem = ({ value, children, className }) => {
  const { handleSelect, selected, registerLabel } = useContext(SelectContext);
  
  useEffect(() => {
     registerLabel(value, children);
  }, [value, children, registerLabel]);

  return (
    <div
      onClick={(e) => { e.stopPropagation(); handleSelect(value); }}
      className={cn(
        "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-2 pr-8 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 cursor-pointer",
        selected === value && "bg-gray-100 font-medium",
        className
      )}
    >
      <span className="truncate">{children}</span>
      {selected === value && (
        <span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
          <Check className="h-4 w-4" />
        </span>
      )}
    </div>
  );
};

export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue };
