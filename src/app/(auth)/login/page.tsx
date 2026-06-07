import { Receipt } from "lucide-react";
import { getCurrentUser } from "@/lib/dal";
import { redirect } from "next/navigation";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
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
            Split bill nongkrong tanpa drama ngitung di rumah.
          </p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
