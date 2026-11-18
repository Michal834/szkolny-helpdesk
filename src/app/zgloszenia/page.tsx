"use client";

import * as React from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import { useRequireAuth } from "@/lib/auth";
import { CATEGORIES, labelOf } from "@/lib/constants";
import { pb } from "@/lib/pocketbase";
import type { Ticket } from "@/lib/types";
import { formatDate } from "@/lib/utils";

// Lista zgłoszeń zalogowanego użytkownika. Zakres danych ogranicza reguła API
// (listRule: author = @request.auth.id), a nie ten kod.
export default function MyTicketsPage() {
  const { allowed } = useRequireAuth("user");
  const [tickets, setTickets] = React.useState<Ticket[] | null>(null);

  React.useEffect(() => {
    if (!allowed) return;
    pb.collection("tickets")
      .getFullList<Ticket>({ sort: "-created" })
      .then(setTickets)
      .catch(() => {
        toast.error("Nie udało się pobrać zgłoszeń");
        setTickets([]);
      });
  }, [allowed]);

  if (!allowed) return <p className="text-center text-muted-foreground">Ładowanie…</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Moje zgłoszenia</h1>
        <Button asChild>
          <Link href="/zgloszenia/nowe">
            <Plus />
            Nowe zgłoszenie
          </Link>
        </Button>
      </div>

      {tickets === null && <p className="text-muted-foreground">Ładowanie zgłoszeń…</p>}

      {tickets?.length === 0 && (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Nie masz jeszcze żadnych zgłoszeń. Kliknij „Nowe zgłoszenie”, aby zgłosić usterkę.
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {tickets?.map((t) => (
          <Link key={t.id} href={`/zgloszenia/${t.id}`} className="block">
            <Card className="h-full transition-colors hover:bg-muted/50">
              <CardHeader className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={t.status} />
                  <PriorityBadge priority={t.priority} />
                </div>
                <CardTitle className="text-lg">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm text-muted-foreground">
                <p>
                  {t.room} · {labelOf(CATEGORIES, t.category)}
                </p>
                <p>Zgłoszono: {formatDate(t.created)}</p>
                {t.comment && <p className="text-foreground">Komentarz technika: {t.comment}</p>}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
