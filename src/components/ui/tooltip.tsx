"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface TooltipProps {
  children: React.ReactNode;
  content?: React.ReactNode;
  side?: "top" | "right" | "bottom" | "left";
  align?: "start" | "center" | "end";
  delayDuration?: number;
  className?: string;
}

const TooltipContext = React.createContext<{
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  content: React.ReactNode;
  side: "top" | "right" | "bottom" | "left";
  align: "start" | "center" | "end";
}>({ 
  open: false, 
  setOpen: () => {}, 
  content: null,
  side: "top",
  align: "center"
});

const TooltipProvider = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false);
  const [content, setContent] = React.useState<React.ReactNode>(null);
  const [side, setSide] = React.useState<"top" | "right" | "bottom" | "left">("top");
  const [align, setAlign] = React.useState<"start" | "center" | "end">("center");
  
  return (
    <TooltipContext.Provider value={{ open, setOpen, content, side, align }}>
      {children}
    </TooltipContext.Provider>
  );
};

const Tooltip = ({ 
  children, 
  content, 
  side = "top", 
  align = "center", 
  delayDuration = 300,
  className
}: TooltipProps) => {
  const [open, setOpen] = React.useState(false);
  const [position, setPosition] = React.useState({ top: 0, left: 0 });
  const [tooltipContent, setTooltipContent] = React.useState<React.ReactNode>(content);
  const triggerRef = React.useRef<HTMLDivElement>(null);
  
  // Check if we're using compound components or direct content prop
  const isCompoundComponent = React.Children.toArray(children).some(
    child => React.isValidElement(child) && child.type === TooltipContent
  );

  // Extract content from TooltipContent if using compound components
  React.useEffect(() => {
    if (isCompoundComponent) {
      React.Children.forEach(children, child => {
        if (React.isValidElement(child) && child.type === TooltipContent) {
          setTooltipContent(child.props.children);
        }
      });
    } else {
      setTooltipContent(content);
    }
  }, [children, content, isCompoundComponent]);
  
  const handleMouseEnter = React.useCallback(() => {
    const timer = setTimeout(() => {
      setOpen(true);
      
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        let top = 0;
        let left = 0;
        
        // Calculate position based on side and align
        switch (side) {
          case "top":
            top = rect.top - 8;
            left = align === "start" ? rect.left : align === "end" ? rect.right : rect.left + rect.width / 2;
            break;
          case "bottom":
            top = rect.bottom + 8;
            left = align === "start" ? rect.left : align === "end" ? rect.right : rect.left + rect.width / 2;
            break;
          case "left":
            top = align === "start" ? rect.top : align === "end" ? rect.bottom : rect.top + rect.height / 2;
            left = rect.left - 8;
            break;
          case "right":
            top = align === "start" ? rect.top : align === "end" ? rect.bottom : rect.top + rect.height / 2;
            left = rect.right + 8;
            break;
        }
        
        setPosition({ top, left });
      }
    }, delayDuration);
    
    return () => clearTimeout(timer);
  }, [delayDuration, side, align]);
  
  const handleMouseLeave = React.useCallback(() => {
    setOpen(false);
  }, []);
  
  return (
    <div 
      className="relative inline-block" 
      ref={triggerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleMouseEnter}
      onBlur={handleMouseLeave}
    >
      {isCompoundComponent ? React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === TooltipContent) {
          return null; // Don't render TooltipContent directly
        }
        return child;
      }) : children}
      {open && tooltipContent && (
        <div 
          className={cn(
            "absolute z-50 rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-50 shadow-md animate-in fade-in-0 zoom-in-95",
            side === "top" && "mb-2 slide-in-from-bottom-2",
            side === "bottom" && "mt-2 slide-in-from-top-2",
            side === "left" && "mr-2 slide-in-from-right-2",
            side === "right" && "ml-2 slide-in-from-left-2",
            className
          )}
          style={{
            position: "fixed",
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: `translate(${side === "right" ? "0" : side === "left" ? "-100%" : "-50%"}, ${side === "bottom" ? "0" : side === "top" ? "-100%" : "-50%"})`,
          }}
        >
          {tooltipContent}
        </div>
      )}
    </div>
  );
};

interface TooltipTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const TooltipTrigger = ({ children, asChild }: TooltipTriggerProps) => {
  return <>{children}</>;
};

interface TooltipContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: "top" | "right" | "bottom" | "left";
}

const TooltipContent = React.forwardRef<
  HTMLDivElement,
  TooltipContentProps
>(({ className, side = "top", ...props }, ref) => {
  const { open } = React.useContext(TooltipContext);
  
  if (!open) return null;
  
  return (
    <div
      ref={ref}
      className={cn(
        "z-50 overflow-hidden rounded-md border border-zinc-800 bg-zinc-950 px-3 py-1.5 text-xs text-zinc-50 shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
        side === "top" && "slide-in-from-bottom-2",
        side === "bottom" && "slide-in-from-top-2",
        side === "left" && "slide-in-from-right-2",
        side === "right" && "slide-in-from-left-2",
        className
      )}
      {...props}
    />
  );
});
TooltipContent.displayName = "TooltipContent";

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
