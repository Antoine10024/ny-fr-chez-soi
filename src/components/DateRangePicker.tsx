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

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Choisir des dates",
  numberOfMonths = 2,
  minDate,
  className,
}: Props) {
  const range: DateRange | undefined = value.from
    ? { from: isoToDate(value.from), to: isoToDate(value.to) }
    : undefined;

  const label =
    value.from && value.to
      ? formatShortDateRange(value.from, value.to)
      : value.from
        ? `À partir du ${formatShortDateRange(value.from, value.from).split(" → ")[0]}`
        : placeholder;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !value.from && "text-muted-foreground",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {label}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={range}
          onSelect={(r) => {
            onChange({
              from: r?.from ? formatISODate(r.from) : undefined,
              to: r?.to ? formatISODate(r.to) : undefined,
            });
          }}
          numberOfMonths={numberOfMonths}
          disabled={minDate ? { before: minDate } : undefined}
          initialFocus
          className={cn("pointer-events-auto p-3")}
        />
        {value.from ? (
          <div className="flex justify-end border-t border-border px-3 py-2">
            <button
              type="button"
              onClick={() => onChange({})}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Réinitialiser
            </button>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
