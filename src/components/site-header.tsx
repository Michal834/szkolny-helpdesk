"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import { homePathFor, useAuth } from "@/lib/auth";

export function SiteHeader() {
  const { user, role, isTechnician, logout } = useAuth();
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <div className="container flex h-14 items-center justify-between gap-2">
        <Link
          href={user ? homePathFor(role) : "/login"}
          className="flex items-center gap-2 font-semibold"
        >
          <Wrench className="h-5 w-5" />
          <span>Szkolny Helpdesk</span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          {user && (
            <>
              <span className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
                {user.name || user.email}
                <Badge variant={isTechnician ? "blue" : "gray"}>
                  {isTechnician ? "Technik" : "Użytkownik"}
                </Badge>
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  logout();
                  router.replace("/login");
                }}
              >
                <LogOut />
                <span className="hidden sm:inline">Wyloguj</span>
              </Button>
            </>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
