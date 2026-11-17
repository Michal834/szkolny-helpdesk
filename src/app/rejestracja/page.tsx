"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import type { z } from "zod";
import { ClientResponseError } from "pocketbase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { homePathFor, useAuth } from "@/lib/auth";
import { pb } from "@/lib/pocketbase";
import { registerSchema } from "@/lib/schemas";

type RegisterValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { user, role, ready } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(registerSchema) });

  React.useEffect(() => {
    if (ready && user) router.replace(homePathFor(role));
  }, [ready, user, role, router]);

  async function onSubmit(values: RegisterValues) {
    try {
      // Rola NIE jest wysyłana: reguła API zabrania jej ustawiania przy rejestracji.
      await pb.collection("users").create({
        name: values.name,
        email: values.email,
        password: values.password,
        passwordConfirm: values.passwordConfirm,
      });
      await pb.collection("users").authWithPassword(values.email, values.password);
      toast.success("Konto utworzone");
      router.replace("/zgloszenia");
    } catch (err) {
      if (err instanceof ClientResponseError) {
        const data = err.response?.data ?? {};
        if (data.email) {
          setError("email", { message: "Konto z tym adresem e-mail już istnieje lub adres jest nieprawidłowy" });
          return;
        }
        if (data.password) {
          setError("password", { message: data.password.message ?? "Nieprawidłowe hasło" });
          return;
        }
      }
      setError("root", { message: "Nie udało się utworzyć konta. Spróbuj ponownie." });
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Rejestracja</CardTitle>
        <CardDescription>Załóż konto, aby zgłaszać usterki w szkole.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Imię i nazwisko" htmlFor="name" error={errors.name?.message}>
            <Input id="name" autoComplete="name" {...register("name")} />
          </Field>
          <Field label="Adres e-mail" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Hasło" htmlFor="password" error={errors.password?.message} hint="Minimum 8 znaków.">
            <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          </Field>
          <Field label="Powtórz hasło" htmlFor="passwordConfirm" error={errors.passwordConfirm?.message}>
            <Input id="passwordConfirm" type="password" autoComplete="new-password" {...register("passwordConfirm")} />
          </Field>
          {errors.root && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Utwórz konto
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Masz już konto?{" "}
            <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
              Zaloguj się
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
