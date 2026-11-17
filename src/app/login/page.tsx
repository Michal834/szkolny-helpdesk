"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { homePathFor, useAuth } from "@/lib/auth";
import { pb } from "@/lib/pocketbase";
import { loginSchema } from "@/lib/schemas";
import type { z } from "zod";

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { user, role, ready } = useAuth();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  React.useEffect(() => {
    if (ready && user) router.replace(homePathFor(role));
  }, [ready, user, role, router]);

  async function onSubmit(values: LoginValues) {
    try {
      const auth = await pb.collection("users").authWithPassword(values.email, values.password);
      const r = auth.record.role === "technician" ? "technician" : "user";
      toast.success("Zalogowano");
      router.replace(homePathFor(r));
    } catch {
      setError("root", { message: "Nieprawidłowy e-mail lub hasło" });
    }
  }

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Logowanie</CardTitle>
        <CardDescription>Zaloguj się, aby zgłosić usterkę lub sprawdzić status zgłoszeń.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <Field label="Adres e-mail" htmlFor="email" error={errors.email?.message}>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
          </Field>
          <Field label="Hasło" htmlFor="password" error={errors.password?.message}>
            <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
          </Field>
          {errors.root && (
            <p role="alert" className="text-sm font-medium text-destructive">
              {errors.root.message}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="animate-spin" />}
            Zaloguj się
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            Nie masz konta?{" "}
            <Link href="/rejestracja" className="font-medium text-foreground underline underline-offset-4">
              Zarejestruj się
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
