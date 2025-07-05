"use client";

import { useState, useEffect } from "react";
import { VirtualizedLinkList } from "@/components/links/virtualized-link-list";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LinksData } from "@/types/links";
import { Loader2 } from "lucide-react";

export default function LinksPage() {
  const [linksData, setLinksData] = useState<LinksData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLinks() {
      try {
        // Only load the default dataset
        const response = await fetch('/api/links');
        if (response.ok) {
          const data = await response.json();
          setLinksData(data);
        } else {
          throw new Error('Failed to load links');
        }
      } catch (error) {
        console.error("Error loading links:", error);
        // Load from static file as a fallback
        const data = await import('@/data/links.json');
        setLinksData(data);
      } finally {
        setLoading(false);
      }
    }

    loadLinks();
  }, []);

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">ZAO Nexus Links</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Resource Directory</CardTitle>
          <CardDescription>
            Browse through our curated collection of resources and links
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2">Loading links...</span>
            </div>
          ) : linksData ? (
            <VirtualizedLinkList data={linksData} />
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Failed to load links. Please try again later.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
