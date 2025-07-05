"use client";

import * as React from "react";
import { useState, useEffect, useRef, ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  className?: string;
}

export function SidebarLayout({ children, sidebar, className }: SidebarLayoutProps) {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);
  
  // Track scroll position to determine active section
  useEffect(() => {
    const handleScroll = () => {
      if (!mainRef.current) return;
      
      // Logic to determine active section based on scroll position
      // This is a simplified example - you would need to get actual section elements
      const scrollPosition = window.scrollY;
      
      // Example: Set active section based on scroll position
      // Replace with actual logic to determine which section is in view
      if (scrollPosition < 300) {
        setActiveSection("section1");
      } else if (scrollPosition < 600) {
        setActiveSection("section2");
      } else {
        setActiveSection("section3");
      }
    };
    
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isMobileMenuOpen && !target.closest('[data-mobile-menu]')) {
        setIsMobileMenuOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobileMenuOpen]);
  
  return (
    <div className={cn("flex min-h-screen flex-col", className)}>
      {/* Mobile view - hamburger menu with slide-over */}
      <div className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-zinc-800 bg-zinc-950/80 px-4 backdrop-blur-sm lg:hidden">
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden"
          onClick={() => setIsMobileMenuOpen(true)}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        
        <div className="flex-1">
          <h1 className="text-lg font-semibold">ZAO Links</h1>
        </div>
      </div>
      
      {/* Mobile menu slide-over */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm transition-all duration-100 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=open]:fade-in"
          data-state="open"
        >
          <div 
            data-mobile-menu 
            className="fixed left-0 top-0 z-50 h-full w-[80%] max-w-sm border-r border-zinc-800 bg-zinc-950 p-6 shadow-lg transition-transform duration-300 animate-in slide-in-from-left"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold">Navigation</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Close menu</span>
              </Button>
            </div>
            {sidebar}
          </div>
        </div>
      )}
      
      {/* Desktop view - side-by-side layout */}
      <div className="container flex-1 items-start lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10 lg:py-10">
        <aside className="fixed top-14 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r border-zinc-800 py-6 pr-2 lg:sticky lg:block">
          {sidebar}
        </aside>
        <main ref={mainRef} className="relative py-6 lg:gap-10 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
