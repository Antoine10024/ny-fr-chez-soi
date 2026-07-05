import * as React from "react";
import { CalendarIcon } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatShortDateRange, formatISODate } from "@/lib/listing-constants";

export interface DateRangeValue {
  from?: string; // ISO yyyy-mm-dd
  to?: string;
}

interface Props {
  value: DateRangeValue;
  onChange: (v: DateRangeValue) => void;
  placeholder?: string;
  numberOfMonths?: number;
  minDate?: Date;
  className?: string;
}

function isoToDate(v?: string): Date | undefined {
  if (!v) return undefined;
  const [y, m, d] = v.split("-").map((n) => parseInt(n, 10));
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function toValue(r: DateRange | undefined): DateRangeValue {
  return {
    from: r?.from ? formatISODate(r.from) : undefined,
    to: r?.to ? formatISODate(r.to) : undefined,
  };
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Choisir des dates",
  numberOfMonths = 2,
  minDate,
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DateRange | undefined>(
    value.from ? { from: isoToDate(value.from), to: isoToDate(value.to) } : undefined,
  );

  // Sync draft when popover opens or external value changes
  React.useEffect(() => {
    if (open) {
      setDraft(
        value.from ? { from: isoToDate(value.from), to: isoToDate(value.to) } : undefined,
      );
    }
  }, [open, value.from, value.to]);

  const label =
    value.from && value.to
      ? formatShortDateRange(value.from, value.to)
      : value.from
        ? `À partir du ${formatShortDateRange(value.from, value.from).split(" → ")[0]}`
        : placeholder;

  const apply = () => {
    onChange(toValue(draft));
    setOpen(false);
  };

  const reset = () => {
    setDraft(undefined);
    onChange({});
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start pl-2 text-left font-normal",
            !value.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-1.5 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={draft}
          onSelect={(r) => setDraft(r)}
          numberOfMonths={numberOfMonths}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
          className={cn("pointer-events-auto p-3")}
        />
        <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={reset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Réinitialiser
          </button>
          <Button
            type="button"
            size="sm"
            onClick={apply}
            disabled={!draft?.from}
          >
            Valider
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
