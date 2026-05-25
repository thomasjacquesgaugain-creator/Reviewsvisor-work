// components/metric-info-popover.tsx

import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MetricInfoPopoverProps {
  title: string;
  subtitle: string;
  formula: string;
  description: string;
  icon: React.ReactNode;
}

export function MetricInfoPopover({
  title,
  subtitle,
  formula,
  description,
  icon,
}: MetricInfoPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          aria-label={`How is ${title} calculated?`}
          className="group flex items-center justify-center rounded-full border border-border bg-background p-1.5 transition hover:bg-muted"
        >
          <Info
            size={14}
            className="text-muted-foreground transition-colors group-hover:text-primary"
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="right"
        align="start"
        sideOffset={8}
        className="z-[9999] w-72 rounded-2xl border border-border bg-background p-4 shadow-2xl"
      >
        <div className="space-y-3">

          <div className="flex items-center gap-2">
            <div className="rounded-full bg-primary/10 p-2">
              {icon}
            </div>

            <div>
              <h4 className="text-sm font-semibold">
                {title}
              </h4>

              <p className="text-xs text-muted-foreground">
                {subtitle}
              </p>
            </div>
          </div>

          <div className="rounded-xl bg-muted/50 p-3 text-sm font-medium">
            <div className="text-muted-foreground">
              Formula
            </div>

            <div className="mt-1 text-primary">
              {formula}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-background p-3">
            <p className="text-xs leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>

        </div>
      </PopoverContent>
    </Popover>
  );
}