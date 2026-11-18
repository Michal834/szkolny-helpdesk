"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import { TicketPhoto } from "@/components/ticket-photo";
import { homePathFor, useRequireAuth } from "@/lib/auth";
import { CATEGORIES, STATUSES, labelOf } from "@/lib/constants";
import { pb } from "@/lib/pocketbase";
import { updateTicketSchema, type UpdateTicketValues } from "@/lib/schemas";
import type { Ticket, TicketEvent } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// Szczegóły zgłoszenia. Użytkownik widzi tylko swoje (reguła viewRule),
// technik widzi każde i może zmienić status oraz dodać komentarz.
export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { allowed, role, isTechnician } = useRequireAuth();
  const [ticket, setTicket] = React.useState<Ticket | null>(null);
  const [events, setEvents] = React.useState<TicketEvent[]>([]);
  const [notFound, setNotFound] = React.useState(false);

  const load = React.useCallback(async () => {
    try {
      const t = await pb.collection("tickets").getOne<Ticket>(id, { expand: "author" });
      const ev = await pb
        .collection("ticket_events")
        .getFullList<TicketEvent>({ filter: pb.filter("ticket = {:id}", { id }), sort: "created", expand: "actor" });
      setTicket(t);
      setEvents(ev);
    } catch {
      // cudze lub nieistniejące zgłoszenie: API zwraca 404
      setNotFound(true);
    }
  }, [id]);

  React.useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<UpdateTicketValues>({ resolver: zodResolver(updateTicketSchema) });

  React.useEffect(() => {
    if (ticket) reset({ status: ticket.status, comment: ticket.comment ?? "" });
  }, [ticket, reset]);

  async function onSubmit(values: UpdateTicketValues) {
    try {
      await pb.collection("tickets").update(id, { status: values.status, comment: values.comment });
      toast.success("Zgłoszenie zostało zaktualizowane");
      await load();
    } catch {
      toast.error("Nie udało się zapisać zmian");
    }
  }

  const backHref = homePathFor(role);

  if (!allowed) return <p className="text-center text-muted-foreground">Ładowanie…</p>;

  if (notFound) {
    return (
      <div className="space-y-4">
        <p>Nie znaleziono zgłoszenia.</p>
        <Button asChild variant="outline">
          <Link href={backHref}>Wróć do listy</Link>
        </Button>
      </div>
    );
  }

  if (!ticket) return <p className="text-center text-muted-foreground">Ładowanie…</p>;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Button asChild variant="ghost" size="sm">
        <Link href={backHref}>
          <ArrowLeft />
          Wróć do listy
        </Link>
      </Button>

      <Card>
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={ticket.status} />
            <PriorityBadge priority={ticket.priority} />
          </div>
          <CardTitle>{ticket.title}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {ticket.room} · {labelOf(CATEGORIES, ticket.category)} · zgłoszono {formatDate(ticket.created)}
            {isTechnician && ticket.expand?.author && (
              <> · przez {ticket.expand.author.name || ticket.expand.author.email}</>
            )}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-wrap">{ticket.description}</p>
          <TicketPhoto ticket={ticket} full />
          {ticket.comment && (
            <div className="rounded-md border bg-muted/40 p-3 text-sm">
              <p className="font-medium">Komentarz technika</p>
              <p className="whitespace-pre-wrap">{ticket.comment}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {isTechnician && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Obsługa zgłoszenia</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <Field label="Status" htmlFor="status" error={errors.status?.message}>
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Wybierz status" />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field label="Komentarz" htmlFor="comment" error={errors.comment?.message}>
                <Textarea id="comment" rows={3} {...register("comment")} />
              </Field>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="animate-spin" />}
                Zapisz zmiany
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Historia zmian</CardTitle>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Brak wpisów.</p>
          ) : (
            <ol className="space-y-3 border-l pl-4">
              {events.map((e) => (
                <li key={e.id} className="text-sm">
                  <p className="font-medium">
                    {e.from_status
                      ? `${labelOf(STATUSES, e.from_status)} → ${labelOf(STATUSES, e.to_status ?? "")}`
                      : `Utworzono (${labelOf(STATUSES, e.to_status ?? "")})`}
                  </p>
                  <p className="text-muted-foreground">
                    {formatDate(e.created)} · {e.expand?.actor?.name || e.expand?.actor?.email || "Technik"}
                  </p>
                  {e.comment && <p className="whitespace-pre-wrap">{e.comment}</p>}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
