import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { fr as frLocale, enUS } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/config";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface DatePickerProps {
  value?: string;
  onChange: (date: string | undefined) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  align?: "start" | "center" | "end";
}

export function DatePicker({
  value,
  onChange,
  placeholder,
  className,
  disabled = false,
  align = "start",
}: DatePickerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const dateLocale = i18n.language?.startsWith("fr") ? frLocale : enUS;

  const parsedDate = React.useMemo(() => {
    if (!value) return undefined;
    const dateStr = value.includes("T") ? value.split("T")[0] : value;
    try {
      return parseISO(dateStr);
    } catch {
      return undefined;
    }
  }, [value]);

  return (
    <Popover open={open} onOpenChange={disabled ? undefined : setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full justify-start text-left font-normal",
            !parsedDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
          {parsedDate
            ? format(parsedDate, "PPP", { locale: dateLocale })
            : (placeholder ?? t("recommendations.smart.pickDate"))}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align={align}>
        <Calendar
          mode="single"
          selected={parsedDate}
          onSelect={(date) => {
            onChange(date ? format(date, "yyyy-MM-dd") : undefined);
            setOpen(false);
          }}
          locale={dateLocale}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}
