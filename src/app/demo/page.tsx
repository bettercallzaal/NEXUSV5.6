"use client";

import { useState, useEffect } from "react";
import { EnhancedLinkList } from "@/components/links/enhanced-link-list";
import { LinksNav } from "@/components/links/links-nav";
import { Data } from "@/types/links";
import { Loader2 } from "lucide-react";

export default function DemoPage() {
  const [data, setData] = useState<Data | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // In a real app, this would be an API call
        const response = await fetch("/api/links");
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("Error loading links data:", error);
        
        // Fallback to static data
        const staticData = await import("@/data/links.json");
        setData(staticData as unknown as Data);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Error Loading Links</h1>
        <p>Unable to load links data. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">ZAO Nexus Links</h1>
        <p className="text-muted-foreground">
          Browse the curated collection of links with AI-powered tagging and filtering
        </p>
      </div>
      
      <LinksNav />
      
      <EnhancedLinkList data={data} />
    </div>
  );
}
