import * as React from "react";
import { CalendarIcon, Loader2 } from "lucide-react";
import type { DateRange } from "react-day-picker";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatISODate, formatShortDateRange } from "@/lib/listing-constants";
import { createInquiry } from "@/lib/listings.functions";
import type { Availability } from "@/lib/listings.functions";

interface Props {
  listingId: string;
  availabilities: Availability[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function isoToDate(v: string): Date {
  const [y, m, d] = v.split("-").map((n) => parseInt(n, 10));
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function ContactInquiryDialog({ listingId, availabilities, open, onOpenChange }: Props) {
  const bookable = React.useMemo(
    () =>
      availabilities
        .filter((a) => a.status !== "unavailable" && a.status !== "booked")
        .map((a) => ({ from: isoToDate(a.start_date), to: isoToDate(a.end_date) })),
    [availabilities],
  );

  const [firstName, setFirstName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [message, setMessage] = React.useState("");
  const [dateError, setDateError] = React.useState<string | null>(null);
  const [submitError, setSubmitError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [emailSent, setEmailSent] = React.useState(true);

  const submit = useServerFn(createInquiry);

  React.useEffect(() => {
    if (!open) {
      // reset when closed
      setTimeout(() => {
        setFirstName("");
        setEmail("");
        setRange(undefined);
        setMessage("");
        setDateError(null);
        setDone(false);
        setSubmitting(false);
      }, 200);
    }
  }, [open]);

  const isDateBookable = React.useCallback(
    (d: Date) => {
      const day = startOfDay(d).getTime();
      return bookable.some((p) => day >= p.from.getTime() && day <= p.to.getTime());
    },
    [bookable],
  );

  const rangeFitsOnePeriod = React.useCallback(
    (from: Date, to: Date) =>
      bookable.some(
        (p) => from.getTime() >= p.from.getTime() && to.getTime() <= p.to.getTime(),
      ),
    [bookable],
  );

  const handleSelect = (r: DateRange | undefined) => {
    setDateError(null);
    if (r?.from && r.to && !rangeFitsOnePeriod(r.from, r.to)) {
      setDateError("Cette période chevauche des dates indisponibles. Choisis une période entièrement disponible.");
      setRange({ from: r.from, to: undefined });
      return;
    }
    setRange(r);
  };

  const rangeLabel =
    range?.from && range.to
      ? formatShortDateRange(formatISODate(range.from), formatISODate(range.to))
      : range?.from
        ? `À partir du ${formatShortDateRange(formatISODate(range.from), formatISODate(range.from)).split(" → ")[0]}`
        : "Choisir tes dates";

  const canSubmit =
    firstName.trim() &&
    /^\S+@\S+\.\S+$/.test(email.trim()) &&
    range?.from &&
    range?.to &&
    message.trim() &&
    !submitting;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!range?.from || !range?.to) {
      setDateError("Choisis tes dates d'arrivée et de départ.");
      return;
    }
    if (!rangeFitsOnePeriod(range.from, range.to)) {
      setDateError("Cette période chevauche des dates indisponibles.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submit({
        data: {
          listing_id: listingId,
          visitor_first_name: firstName.trim(),
          visitor_email: email.trim(),
          start_date: formatISODate(range.from),
          end_date: formatISODate(range.to),
          message: message.trim(),
        },
      });
      setEmailSent(res?.emailSent !== false);
      setDone(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">
                {emailSent ? "Message envoyé" : "Demande enregistrée"}
              </DialogTitle>
              <DialogDescription className="pt-2 text-base">
                {emailSent
                  ? "Ton message a bien été envoyé au propriétaire."
                  : "Ta demande a bien été enregistrée. L'envoi de l'email au propriétaire a rencontré un problème — nous allons le contacter pour toi."}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => onOpenChange(false)}>Fermer</Button>
            </DialogFooter>
          </>
        ) : (
          <form onSubmit={onSubmit} className="space-y-6">
            <DialogHeader>
              <DialogTitle className="font-serif text-2xl">Contacter le propriétaire</DialogTitle>
              <DialogDescription>
                Envoie directement un message au propriétaire.
              </DialogDescription>
            </DialogHeader>

            <section className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tes coordonnées
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="inq-firstname">Prénom</Label>
                  <Input
                    id="inq-firstname"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="inq-email">Email</Label>
                  <Input
                    id="inq-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Tes dates
              </h3>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !range?.from && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {rangeLabel}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={range}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                    disabled={(d) => !isDateBookable(d)}
                    defaultMonth={bookable[0]?.from}
                    className="pointer-events-auto p-3"
                  />
                </PopoverContent>
              </Popover>
              <p className="text-xs text-muted-foreground">
                Seules les dates disponibles pour cette annonce peuvent être sélectionnées.
              </p>
              {dateError ? (
                <p className="text-xs font-medium text-destructive">{dateError}</p>
              ) : null}
            </section>

            <section className="space-y-3">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Ton message
              </h3>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                required
              />
            </section>

            <DialogFooter className="gap-2 sm:gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                Annuler
              </Button>
              <Button type="submit" disabled={!canSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Envoi…
                  </>
                ) : (
                  "Envoyer"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
