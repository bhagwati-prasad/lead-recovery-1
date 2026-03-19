"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { logClientEvent } from "@/lib/telemetry/client";

export function RouteChangeTelemetry() {
  const pathname = usePathname();

  useEffect(() => {
    void logClientEvent({
      source: "frontend.navigation",
      message: "Route change",
      level: "info",
      route: pathname,
    });
  }, [pathname]);

  return null;
}
