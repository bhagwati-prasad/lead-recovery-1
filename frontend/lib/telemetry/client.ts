"use client";

import type { TelemetryEvent } from "@/instrumentation";

const TELEMETRY_ROUTE = "/api/telemetry";

function toPayload(event: TelemetryEvent): TelemetryEvent {
  return {
    ...event,
    timestamp: event.timestamp ?? new Date().toISOString(),
  };
}

export async function logClientEvent(event: TelemetryEvent): Promise<void> {
  const payload = toPayload(event);

  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const didSend = navigator.sendBeacon(TELEMETRY_ROUTE, JSON.stringify(payload));
    if (didSend) {
      return;
    }
  }

  try {
    await fetch(TELEMETRY_ROUTE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch (error) {
    console.warn("[telemetry] Failed to send client event", error);
  }
}
