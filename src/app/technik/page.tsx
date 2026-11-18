"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PriorityBadge, StatusBadge } from "@/components/ticket-badges";
import { useRequireAuth } from "@/lib/auth";
import { CATEGORIES, PRIORITIES, ROOMS, STATUSES, labelOf } from "@/lib/constants";
import { pb } from "@/lib/pocketbase";
import type { Ticket } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const ALL = "all";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Wszystkie</SelectItem>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export default function TechnicianPage() {
  const { allowed } = useRequireAuth("technician");
  const router = useRouter();
  const [tickets, setTickets] = React.useState<Ticket[] | null>(null);
  const [status, setStatus] = React.useState(ALL);
  const [room, setRoom] = React.useState(ALL);
  const [priority, setPriority] = React.useState(ALL);

  const load = React.useCallback(async () => {
    try {
      setTickets(
        await pb.collection("tickets").getFullList<Ticket>({ sort: "-created", expand: "author" })
      );
    } catch {
      toast.error("Nie udało się pobrać zgłoszeń");
      setTickets([]);
    }
  }, []);

  // Realtime: każda zmiana w kolekcji tickets odświeża listę bez przeładowania strony.
  React.useEffect(() => {
    if (!allowed) return;
    load();
    let unsubscribed = false;
    pb.collection("tickets").subscribe<Ticket>("*", (e) => {
      if (unsubscribed) return;
      if (e.action === "create") toast.info(`Nowe zgłoszenie: ${e.record.title}`);
      load();
    });
    return () => {
      unsubscribed = true;
      pb.collection("tickets").unsubscribe("*");
    };
  }, [allowed, load]);

  const filtered = React.useMemo(
    () =>
      (tickets ?? []).filter(
        (t) =>
          (status === ALL || t.status === status) &&
          (room === ALL || t.room === room) &&
          (priority === ALL || t.priority === priority)
      ),
    [tickets, status, room, priority]
  );

  const stats = React.useMemo(() => {
    const all = tickets ?? [];
    const open = all.filter((t) => t.status !== "zamkniete").length;
    const byCategory = CATEGORIES.map((c) => ({
      label: c.label,
      count: all.filter((t) => t.category === c.value).length,
    }));
    const perRoom = new Map<string, number>();
    for (const t of all) perRoom.set(t.room, (perRoom.get(t.room) ?? 0) + 1);
    const top = [...perRoom.entries()].sort((a, b) => b[1] - a[1])[0];
    return { open, total: all.length, byCategory, top };
  }, [tickets]);

  if (!allowed) return <p className="text-center text-muted-foreground">Ładowanie…</p>;

  const maxCategory = Math.max(1, ...stats.byCategory.map((c) => c.count));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Panel technika</h1>

      <section aria-label="Podsumowanie" className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Otwarte zgłoszenia</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.open}</p>
            <p className="text-xs text-muted-foreground">z {stats.total} wszystkich</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Sala z największą liczbą zgłoszeń</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.top ? (
              <>
                <p className="text-xl font-bold">{stats.top[0]}</p>
                <p className="text-xs text-muted-foreground">zgłoszeń: {stats.top[1]}</p>
              </>
            ) : (
              <p className="text-muted-foreground">Brak danych</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zgłoszenia wg kategorii</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {stats.byCategory.map((c) => (
              <div key={c.label} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span>{c.label}</span>
                  <span className="font-medium">{c.count}</span>
                </div>
                <div className="h-2 rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary"
                    style={{ width: `${(c.count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Wszystkie zgłoszenia</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <FilterSelect id="f-status" label="Status" value={status} onChange={setStatus} options={STATUSES} />
            <FilterSelect
              id="f-room"
              label="Sala"
              value={room}
              onChange={setRoom}
              options={ROOMS.map((r) => ({ value: r, label: r }))}
            />
            <FilterSelect id="f-priority" label="Priorytet" value={priority} onChange={setPriority} options={PRIORITIES} />
          </div>

          {tickets === null ? (
            <p className="text-muted-foreground">Ładowanie zgłoszeń…</p>
          ) : filtered.length === 0 ? (
            <p className="py-6 text-center text-muted-foreground">Brak zgłoszeń dla wybranych filtrów.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tytuł</TableHead>
                  <TableHead>Sala</TableHead>
                  <TableHead className="hidden md:table-cell">Kategoria</TableHead>
                  <TableHead>Priorytet</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Zgłaszający</TableHead>
                  <TableHead className="hidden sm:table-cell">Data</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((t) => (
                  <TableRow
                    key={t.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/zgloszenia/${t.id}`)}
                  >
                    <TableCell className="font-medium">
                      <Link href={`/zgloszenia/${t.id}`} className="underline-offset-4 hover:underline">
                        {t.title}
                      </Link>
                    </TableCell>
                    <TableCell>{t.room}</TableCell>
                    <TableCell className="hidden md:table-cell">{labelOf(CATEGORIES, t.category)}</TableCell>
                    <TableCell>
                      <PriorityBadge priority={t.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={t.status} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {t.expand?.author?.name || t.expand?.author?.email || "—"}
                    </TableCell>
                    <TableCell className="hidden whitespace-nowrap sm:table-cell">{formatDate(t.created)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
