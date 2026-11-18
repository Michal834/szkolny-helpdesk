"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRequireAuth } from "@/lib/auth";
import { CATEGORIES, PRIORITIES, ROOMS } from "@/lib/constants";
import { pb } from "@/lib/pocketbase";
import { ticketSchema, type TicketFormValues } from "@/lib/schemas";
import { ClientResponseError } from "pocketbase";

export default function NewTicketPage() {
  const router = useRouter();
  const { allowed, user } = useRequireAuth("user");

  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TicketFormValues>({
    resolver: zodResolver(ticketSchema),
    defaultValues: { title: "", description: "" },
  });

  async function onSubmit(values: TicketFormValues) {
    if (!user) return;
    const body = new FormData();
    body.append("title", values.title);
    body.append("description", values.description);
    body.append("room", values.room);
    body.append("category", values.category);
    body.append("priority", values.priority);
    body.append("status", "nowe");
    body.append("author", user.id);
    if (values.photo) body.append("photo", values.photo);

    try {
      await pb.collection("tickets").create(body);
      toast.success("Zgłoszenie zostało dodane");
      router.replace("/zgloszenia");
    } catch (err) {
      // Błędy walidacji z serwera pokazujemy przy odpowiednich polach.
      if (err instanceof ClientResponseError && err.response?.data) {
        const data = err.response.data as Record<string, { message?: string }>;
        let shown = false;
        for (const [field, info] of Object.entries(data)) {
          if (field in ticketSchema.shape) {
            setError(field as keyof TicketFormValues, { message: info?.message ?? "Nieprawidłowa wartość" });
            shown = true;
          }
        }
        if (shown) return;
      }
      toast.error("Nie udało się dodać zgłoszenia. Spróbuj ponownie.");
    }
  }

  if (!allowed) return <p className="text-center text-muted-foreground">Ładowanie…</p>;

  return (
    <Card className="mx-auto max-w-2xl">
      <CardHeader>
        <CardTitle>Nowe zgłoszenie</CardTitle>
        <CardDescription>Opisz usterkę możliwie dokładnie, a technik szybciej się nią zajmie.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Tytuł" htmlFor="title" error={errors.title?.message}>
            <Input id="title" placeholder="np. Nie działa rzutnik" {...register("title")} />
          </Field>

          <Field label="Opis" htmlFor="description" error={errors.description?.message}>
            <Textarea id="description" rows={5} placeholder="Co się dzieje? Od kiedy?" {...register("description")} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Sala" htmlFor="room" error={errors.room?.message}>
              <Controller
                control={control}
                name="room"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="room">
                      <SelectValue placeholder="Wybierz salę" />
                    </SelectTrigger>
                    <SelectContent>
                      {ROOMS.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Kategoria" htmlFor="category" error={errors.category?.message}>
              <Controller
                control={control}
                name="category"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Wybierz kategorię" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>

            <Field label="Priorytet" htmlFor="priority" error={errors.priority?.message}>
              <Controller
                control={control}
                name="priority"
                render={({ field }) => (
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <SelectTrigger id="priority">
                      <SelectValue placeholder="Wybierz priorytet" />
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </Field>
          </div>

          <Field
            label="Zdjęcie usterki (opcjonalnie)"
            htmlFor="photo"
            hint="Jeden plik graficzny, maksymalnie 5 MB."
            error={errors.photo?.message as string | undefined}
          >
            <Input
              id="photo"
              type="file"
              accept="image/*"
              onChange={(e) =>
                setValue("photo", e.target.files?.[0], { shouldValidate: true, shouldDirty: true })
              }
            />
          </Field>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" asChild>
              <Link href="/zgloszenia">Anuluj</Link>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="animate-spin" />}
              Wyślij zgłoszenie
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
