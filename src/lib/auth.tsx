"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { pb } from "@/lib/pocketbase";
import type { Role, User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  ready: boolean;
  role: Role;
  isTechnician: boolean;
  logout: () => void;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [ready, setReady] = React.useState(false);

  React.useEffect(() => {
    setUser(pb.authStore.isValid ? (pb.authStore.record as User | null) : null);

    const unsubscribe = pb.authStore.onChange((_token, record) => {
      setUser(record as User | null);
    });

    // Odśwież dane użytkownika (np. rolę zmienioną przez superusera).
    async function refresh() {
      if (pb.authStore.isValid) {
        try {
          await pb.collection("users").authRefresh();
        } catch {
          pb.authStore.clear();
        }
      }
      setReady(true);
    }
    refresh();

    return unsubscribe;
  }, []);

  const value = React.useMemo<AuthContextValue>(() => {
    const role: Role = user?.role === "technician" ? "technician" : "user";
    return {
      user,
      ready,
      role,
      isTechnician: role === "technician",
      logout: () => pb.authStore.clear(),
    };
  }, [user, ready]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth musi być użyty wewnątrz AuthProvider");
  return ctx;
}

// Przekierowuje niezalogowanych na /login, a użytkowników bez wymaganej roli na ich stronę.
export function useRequireAuth(required?: Role) {
  const auth = useAuth();
  const router = useRouter();

  const allowed =
    auth.ready && !!auth.user && (!required || auth.role === required);

  React.useEffect(() => {
    if (!auth.ready) return;
    if (!auth.user) {
      router.replace("/login");
    } else if (required && auth.role !== required) {
      router.replace(auth.isTechnician ? "/technik" : "/zgloszenia");
    }
  }, [auth.ready, auth.user, auth.role, auth.isTechnician, required, router]);

  return { ...auth, allowed };
}

export function homePathFor(role: Role) {
  return role === "technician" ? "/technik" : "/zgloszenia";
}
