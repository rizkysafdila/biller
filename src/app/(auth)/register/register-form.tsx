"use client";

import { useActionState } from "react";
import Link from "next/link";
import { register, type AuthState } from "@/server/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    register,
    undefined,
  );

  return (
    <Card>
      <CardContent className="pt-6">
        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="name">Nama</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder="cth. Rizky"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="kamu@email.com"
              required
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              placeholder="Minimal 8 karakter"
              required
            />
          </div>
          {state?.error && (
            <p className="text-destructive text-sm">{state.error}</p>
          )}
          <Button type="submit" disabled={pending} className="mt-2 w-full" size="lg">
            {pending ? "Mendaftar..." : "Daftar"}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            Udah punya akun?{" "}
            <Link href="/login" className="text-primary font-medium">
              Masuk
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
