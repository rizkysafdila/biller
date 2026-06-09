import { Receipt } from "lucide-react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/dal";
import { RegisterForm } from "./register-form";

export default async function RegisterPage() {
  // Already signed in? Skip the form.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="bg-primary text-primary-foreground mb-4 flex size-14 items-center justify-center rounded-2xl">
            <Receipt className="size-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Patungan</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Bikin akun buat mulai split bill tanpa drama.
          </p>
        </div>
        <RegisterForm />
      </div>
    </main>
  );
}
