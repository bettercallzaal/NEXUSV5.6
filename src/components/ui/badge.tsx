"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // ZAO-themed variants
        zao: "border-transparent bg-[#8a2be2] text-white hover:bg-[#7a1bd2] shadow-sm shadow-[#8a2be2]/20",
        "zao-accent": "border-transparent bg-[#00f5ff] text-black hover:bg-[#00e5ef] shadow-sm shadow-[#00f5ff]/20",
        "zao-outline": "border-[#8a2be2] text-[#8a2be2] hover:bg-[#8a2be2]/10",
        "zao-subtle": "border-transparent bg-[#1c1c2a] text-[#a0a0a8] hover:bg-[#2a2a3a] hover:text-white",
      },
    },
    defaultVariants: {
      variant: "zao", // Change default to ZAO theme
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
