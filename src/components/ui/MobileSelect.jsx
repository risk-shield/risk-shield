import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

function useIsMobile() {
  return typeof window !== "undefined" && window.innerWidth < 1024;
}

/**
 * Drop-in replacement for Select that uses a bottom-sheet Drawer on mobile.
 * Props mirror the shadcn Select API:
 *   value, onValueChange, placeholder, options: [{value, label}], triggerClassName
 */
export function MobileSelect({ value, onValueChange, placeholder, options = [], triggerClassName }) {
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);

  const displayLabel = options.find(o => o.value === value)?.label ?? placeholder ?? "Select…";

  if (!isMobile) {
    return (
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className={triggerClassName}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map(o => (
            <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm",
          "focus:outline-none focus:ring-1 focus:ring-ring",
          !value && "text-muted-foreground",
          triggerClassName
        )}
      >
        <span className="truncate">{value ? displayLabel : placeholder ?? "Select…"}</span>
        <svg className="w-4 h-4 opacity-50 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{placeholder ?? "Select an option"}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1 max-h-[60vh] overflow-y-auto">
            {options.map(o => (
              <button
                key={o.value}
                type="button"
                onClick={() => { onValueChange(o.value); setOpen(false); }}
                className={cn(
                  "w-full text-left px-4 py-3 rounded-lg text-sm transition-colors",
                  o.value === value
                    ? "bg-primary text-primary-foreground font-medium"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {o.label}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}