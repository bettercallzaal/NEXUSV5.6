"use client";

import { useState, useEffect } from "react";
import { Data } from "@/types/links";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { batchAutoTagLinks, countTaggedLinks } from "@/utils/batch-auto-tag";
import { Progress } from "@/components/ui/progress";
import { LinksNav } from "@/components/links/links-nav";
import { usePrivy } from "@privy-io/react-auth";

export default function BatchTagPage() {
  const [data, setData] = useState<Data | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stats, setStats] = useState({ total: 0, tagged: 0, untagged: 0 });
  const { authenticated } = usePrivy();

  useEffect(() => {
    async function loadData() {
      try {
        // In a real app, this would be an API call
        const response = await fetch("/api/links");
        const jsonData = await response.json();
        setData(jsonData);
        
        // Calculate initial stats
        const initialStats = countTaggedLinks(jsonData);
        setStats(initialStats);
      } catch (error) {
        console.error("Error loading links data:", error);
        
        // Fallback to static data
        const staticData = await import("@/data/links.json");
        setData(staticData as unknown as Data);
        
        // Calculate initial stats for static data
        const initialStats = countTaggedLinks(staticData as unknown as Data);
        setStats(initialStats);
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, []);

  const handleBatchTag = async () => {
    if (!data || isProcessing) return;
    
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Process links in batches to show progress
      const updatedData = await batchAutoTagLinks(data);
      
      // Update data with new tags
      setData(updatedData);
      
      // Update stats
      const newStats = countTaggedLinks(updatedData);
      setStats(newStats);
      
      // Set progress to 100% when complete
      setProgress(100);
    } catch (error) {
      console.error("Error in batch tagging:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Authentication check
  if (!authenticated) {
    return (
      <div className="container mx-auto p-6">
        <h1 className="text-2xl font-bold mb-4">Admin Access Required</h1>
        <p>Please log in with an admin account to access this page.</p>
      </div>
    );
  }

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

  const percentTagged = stats.total > 0 ? Math.round((stats.tagged / stats.total) * 100) : 0;

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8 space-y-2">
        <h1 className="text-3xl font-bold">Batch Auto-Tagging</h1>
        <p className="text-muted-foreground">
          Process existing links to add AI-generated tags
        </p>
      </div>
      
      <LinksNav />
      
      <div className="space-y-6 max-w-2xl">
        <div className="p-6 border rounded-lg bg-card">
          <h2 className="text-xl font-semibold mb-4">Link Statistics</h2>
          
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span>Tagged Links</span>
                <span className="font-medium">{stats.tagged} / {stats.total} ({percentTagged}%)</span>
              </div>
              <Progress value={percentTagged} className="h-2" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Total Links</div>
                <div className="text-2xl font-bold">{stats.total}</div>
              </div>
              <div className="p-4 border rounded-md">
                <div className="text-sm text-muted-foreground">Untagged Links</div>
                <div className="text-2xl font-bold">{stats.untagged}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            onClick={handleBatchTag} 
            disabled={isProcessing || stats.untagged === 0}
            className="w-40"
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Start Auto-Tagging'
            )}
          </Button>
          
          {isProcessing && (
            <div className="flex-1">
              <div className="text-sm mb-1">{progress}% Complete</div>
              <Progress value={progress} className="h-2" />
            </div>
          )}
        </div>
        
        {stats.untagged === 0 && (
          <p className="text-sm text-muted-foreground">
            All links have been tagged! There are no untagged links to process.
          </p>
        )}
      </div>
    </div>
  );
}
