"use client";

import * as React from "react";
import { Toaster as Sonner } from "sonner";

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };

export const toast = {
  success: (message: string, options?: any) => {
    return window.toast.success(message, options);
  },
  error: (message: string, options?: any) => {
    return window.toast.error(message, options);
  },
  info: (message: string, options?: any) => {
    return window.toast.info(message, options);
  },
  warning: (message: string, options?: any) => {
    return window.toast.warning(message, options);
  },
  promise: (promise: Promise<any>, options?: any) => {
    return window.toast.promise(promise, options);
  },
  dismiss: (toastId?: string) => {
    window.toast.dismiss(toastId);
  },
  custom: (render: React.ReactNode, options?: any) => {
    return window.toast.custom(render, options);
  },
  message: (message: string, options?: any) => {
    return window.toast(message, options);
  },
};

// For TypeScript support
declare global {
  interface Window {
    toast: {
      (message: string, options?: any): string;
      success: (message: string, options?: any) => string;
      error: (message: string, options?: any) => string;
      info: (message: string, options?: any) => string;
      warning: (message: string, options?: any) => string;
      promise: (promise: Promise<any>, options?: any) => string;
      dismiss: (toastId?: string) => void;
      custom: (render: React.ReactNode, options?: any) => string;
    };
  }
}
