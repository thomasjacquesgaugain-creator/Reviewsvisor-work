// components/metric-info-popover.tsx

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface MetricInfoPopoverProps {
  ariaLabel: string;
  children: React.ReactNode;
  side?: React.ComponentPropsWithoutRef<typeof PopoverContent>["side"];
  align?: React.ComponentPropsWithoutRef<typeof PopoverContent>["align"];
  triggerClassName?: string;
  contentClassName?: string;
}

export function MetricInfoPopover({
  ariaLabel,
  children,
  side = "right",
  align = "start",
  triggerClassName,
  contentClassName,
}: MetricInfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={ariaLabel}
          className={cn(
            "group inline-flex h-6 w-6 items-center justify-center rounded-full transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            triggerClassName
          )}
        >
          <Info
            size={14}
            className="text-muted-foreground transition-colors group-hover:text-primary"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side={side}
        align={align}
        sideOffset={8}
        className={cn(
          "z-[9999] w-[280px] rounded-2xl border border-border bg-background p-4 shadow-2xl dark:border-slate-700 dark:bg-slate-950 dark:shadow-black/40 sm:w-[320px]",
          contentClassName
        )}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}
