"use client";

import { ReactNode } from "react";
import { useEffect } from "react";
import Script from "next/script";

export default function TokenCheckerLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <Script 
        src="https://cdn.jsdelivr.net/npm/web3@1.7.3/dist/web3.min.js"
        strategy="beforeInteractive"
      />
      {children}
    </>
  );
}
