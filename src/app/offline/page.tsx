import { WifiOff } from "lucide-react";

export const metadata = {
  title: "Offline — Patungan",
};

export default function OfflinePage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
      <div className="bg-muted text-muted-foreground flex size-14 items-center justify-center rounded-2xl">
        <WifiOff className="size-7" />
      </div>
      <h1 className="text-lg font-bold">Lagi offline</h1>
      <p className="text-muted-foreground max-w-xs text-sm">
        Sambungan internetmu putus. Cek koneksi lalu coba buka lagi — datamu aman.
      </p>
    </main>
  );
}
