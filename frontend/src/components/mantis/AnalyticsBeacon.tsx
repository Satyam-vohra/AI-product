"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { api } from "@/lib/api";

export function AnalyticsBeacon() {
  const pathname = usePathname();

  useEffect(() => {
    api.track("page_view", { pathname }).catch(() => undefined);
  }, [pathname]);

  return null;
}
