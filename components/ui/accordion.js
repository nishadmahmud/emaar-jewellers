import * as React from "react"
import { cn } from "@/lib/utils"

const Accordion = React.forwardRef(({ className, type, collapsible, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-1", className)} {...props} />
))
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, ...props }, ref) => (
  <details ref={ref} className={cn("group border-b", className)} {...props} />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => (
  <summary
    ref={ref}
    className={cn(
      "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[open]>svg]:rotate-180 cursor-pointer list-none",
      className
    )}
    {...props}
  >
    {children}
    {/* Simple chevron fallback can be added if needed, but keeping it generic */}
  </summary>
))
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "overflow-hidden text-sm transition-all pb-4 pt-0",
      className
    )}
    {...props}
  >
    {children}
  </div>
))
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
