"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useScrollLock } from "@/hooks/useScrollLock";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { TokenChecker } from "@/components/token-checker";
import { WalletConnector } from "@/components/wallet-connector";
import { ModernLinkList } from "@/components/links/modern-link-list";
import { LinksData } from "@/types/links";
import { Loader2 } from "lucide-react";
import { Toaster } from "@/components/ui/use-toast";

export default function Home() {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [hasTokens, setHasTokens] = useState(false);
  const [zaoBalance, setZaoBalance] = useState("0");
  const [loanzBalance, setLoanzBalance] = useState("0");
  const [linksData, setLinksData] = useState<LinksData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Refs for scroll handling
  const linksContainerRef = useRef<HTMLDivElement>(null);

  // Handle wallet connection
  const handleWalletConnected = (address: string) => {
    console.log("[HOME] Wallet connected:", address);
    setWalletAddress(address);
  };

  // Handle wallet disconnection
  const handleWalletDisconnected = () => {
    console.log("[HOME] Wallet disconnected");
    setWalletAddress(null);
    setHasTokens(false);
    setZaoBalance("0");
    setLoanzBalance("0");
  };

  // Handle balance check results
  const handleBalancesChecked = (hasTokens: boolean, zaoBalance: string, loanzBalance: string) => {
    console.log("[HOME] Balances checked - Has tokens:", hasTokens);
    console.log("[HOME] ZAO Balance:", zaoBalance);
    console.log("[HOME] LOANZ Balance:", loanzBalance);
    setHasTokens(hasTokens);
    setZaoBalance(zaoBalance);
    setLoanzBalance(loanzBalance);
  };
  
  // Use our scroll lock hook
  const { registerScrollable } = useScrollLock();
  
  // Setup improved nested scrolling using both IntersectionObserver and touch event handling
  useEffect(() => {
    if (!linksContainerRef.current) return;
    
    // Register the links container as a scrollable element
    const cleanup = registerScrollable(linksContainerRef.current);
    
    // Create an intersection observer to detect when the links container is in view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // When the container comes into view, prepare it for receiving focus
          const scrollableElement = entry.target.querySelector('.links-list') as HTMLDivElement;
          if (scrollableElement) {
            scrollableElement.setAttribute('tabindex', '-1');
            
            // Add a sentinel element at the bottom of the page to detect when user has scrolled to bottom
            const sentinel = document.createElement('div');
            sentinel.id = 'scroll-sentinel';
            sentinel.style.height = '1px';
            sentinel.style.width = '100%';
            sentinel.style.position = 'absolute';
            sentinel.style.bottom = '0';
            document.body.appendChild(sentinel);
            
            // Create another observer for the sentinel
            const sentinelObserver = new IntersectionObserver(
              (sentinelEntries) => {
                if (sentinelEntries[0].isIntersecting) {
                  // User has reached bottom of page, focus the scrollable element
                  scrollableElement.scrollIntoView({ behavior: 'smooth' });
                  setTimeout(() => scrollableElement.focus(), 100);
                }
              },
              { threshold: 1.0 } // Trigger when fully visible
            );
            
            sentinelObserver.observe(sentinel);
            
            // Clean up sentinel observer when component unmounts
            return () => {
              sentinelObserver.disconnect();
              if (sentinel.parentNode) {
                sentinel.parentNode.removeChild(sentinel);
              }
            };
          }
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    );
    
    // Start observing the links container
    observer.observe(linksContainerRef.current);
    
    // Clean up
    return () => {
      cleanup();
      if (linksContainerRef.current) {
        observer.unobserve(linksContainerRef.current);
      }
    };
  }, [linksContainerRef.current, registerScrollable]);
  
  // Load links data
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
    <main className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <Toaster />
      <h1 className="text-2xl sm:text-3xl font-bold text-center mb-4 sm:mb-8">ZAO Nexus V5</h1>
      
      <div className="mb-4 sm:mb-8">
        <Card className="w-full">
          <CardHeader className="p-3 sm:p-4">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-lg">Wallet & Token Access</CardTitle>
                <CardDescription className="text-xs">
                  {walletAddress ? `Connected: ${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : "Connect your wallet to check access"}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <WalletConnector 
                  onWalletConnected={handleWalletConnected}
                  onWalletDisconnected={handleWalletDisconnected}
                  compact={true}
                />
                <div className={`text-xs px-2 py-1 rounded-md ${hasTokens ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300" : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"}`}>
                  {hasTokens ? "✅ Access" : "⚠️ No Access"}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0 sm:pt-0">
            <div className="flex flex-wrap justify-between items-center">
              <TokenChecker 
                walletAddress={walletAddress}
                onBalancesChecked={handleBalancesChecked}
                compact={true}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Links section - integrated directly into the page flow */}
      <div className="mt-4 sm:mt-8 mb-20">
        <Card className="w-full min-h-[500px] flex flex-col shadow-none">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="text-lg sm:text-xl">ZAO Ecosystem Links</CardTitle>
            <CardDescription>
              Browse through our curated collection of resources and links
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2">Loading links...</span>
              </div>
            ) : linksData ? (
              <div className="links-container-wrapper h-full" ref={linksContainerRef}>
                <ModernLinkList data={linksData} />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Failed to load links. Please try again later.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
