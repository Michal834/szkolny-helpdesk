"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { homePathFor, useAuth } from "@/lib/auth";

// Strona startowa tylko przekierowuje: do logowania albo do właściwego panelu.
export default function HomePage() {
  const { user, role, ready } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!ready) return;
    router.replace(user ? homePathFor(role) : "/login");
  }, [ready, user, role, router]);

  return <p className="text-center text-muted-foreground">Ładowanie…</p>;
}
