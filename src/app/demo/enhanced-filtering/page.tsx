"use client";

import { EnhancedLinkBrowser } from '@/components/links/enhanced-link-browser';

// Sample data for demonstration
const SAMPLE_LINKS = [
  {
    id: "1",
    url: "https://github.com/vercel/next.js",
    title: "Next.js - The React Framework",
    description: "Next.js gives you the best developer experience with all the features you need for production.",
    dateAdded: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [{ name: "react", color: "#61dafb" }, { name: "framework", color: "#0070f3" }],
    category: "Development",
    favicon: "https://www.google.com/s2/favicons?domain=github.com&sz=64",
    isRead: false,
    clickCount: 12,
  },
  {
    id: "2",
    url: "https://tailwindcss.com/docs",
    title: "Tailwind CSS Documentation",
    description: "Rapidly build modern websites without ever leaving your HTML.",
    dateAdded: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [{ name: "css", color: "#38b2ac" }, { name: "documentation", color: "#4a5568" }],
    category: "Development",
    favicon: "https://www.google.com/s2/favicons?domain=tailwindcss.com&sz=64",
    isRead: true,
    clickCount: 8,
  },
  {
    id: "3",
    url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    title: "Never Gonna Give You Up",
    description: "The classic music video by Rick Astley",
    dateAdded: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [{ name: "music", color: "#e53e3e" }, { name: "video", color: "#ed8936" }],
    category: "Entertainment",
    favicon: "https://www.google.com/s2/favicons?domain=youtube.com&sz=64",
    isRead: true,
    clickCount: 42,
    attachments: [{ type: "video", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }],
  },
  {
    id: "4",
    url: "https://www.nytimes.com/",
    title: "The New York Times - Breaking News",
    description: "Live news, investigations, opinion, photos and video by the journalists of The New York Times.",
    dateAdded: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [{ name: "news", color: "#718096" }, { name: "article", color: "#a0aec0" }],
    category: "News",
    favicon: "https://www.google.com/s2/favicons?domain=nytimes.com&sz=64",
    isRead: false,
    clickCount: 3,
  },
  {
    id: "5",
    url: "https://www.figma.com/",
    title: "Figma: The Collaborative Interface Design Tool",
    description: "Build better products as a team with Figma.",
    dateAdded: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    tags: [{ name: "design", color: "#9f7aea" }, { name: "tool", color: "#667eea" }],
    category: "Design",
    favicon: "https://www.google.com/s2/favicons?domain=figma.com&sz=64",
    isRead: true,
    clickCount: 25,
  },
];

export default function EnhancedFilteringDemo() {
  return (
    <div className="h-screen w-full flex flex-col">
      <header className="p-4 border-b bg-background">
        <h1 className="text-2xl font-bold">NEXUS V5 - Enhanced Filtering & AI Tagging Demo</h1>
        <p className="text-muted-foreground">
          Try adding new links with AI-generated tags and filtering the link collection
        </p>
      </header>
      
      <main className="flex-1 overflow-hidden">
        <EnhancedLinkBrowser initialLinks={SAMPLE_LINKS} />
      </main>
    </div>
  );
}
