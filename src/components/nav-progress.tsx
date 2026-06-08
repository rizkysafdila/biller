"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

// A thin top progress bar that sweeps on every client-side route change, giving
// a global "navigating" cue on top of the per-route `loading.tsx` skeletons.
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    // Skip the very first render (initial page load, not a navigation).
    if (first.current) {
      first.current = false;
      return;
    }
    setActive(true);
    const t = setTimeout(() => setActive(false), 550);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5"
    >
      <div
        className={cn(
          "bg-primary h-full origin-left transition-[width,opacity] ease-out",
          active
            ? "w-full opacity-100 duration-500"
            : "w-0 opacity-0 duration-200",
        )}
      />
    </div>
  );
}
