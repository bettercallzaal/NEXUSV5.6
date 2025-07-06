"use client";

export function Footer() {
  return (
    <footer className="border-t bg-background w-full mt-auto">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:h-24 md:flex-row md:py-0">
        <div className="text-center text-sm text-muted-foreground md:text-left">
          &copy; {new Date().getFullYear()} ZAO Nexus. All rights reserved.
        </div>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a href="https://x.com/thezaodao" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Twitter
          </a>
          <a href="https://discord.gg/ACJyYQH3BE" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Discord
          </a>
          <a href="https://thezao.com" target="_blank" rel="noopener noreferrer" className="hover:underline">
            Website
          </a>
        </div>
      </div>
    </footer>
  );
}
