import { emitTelemetry } from "@/instrumentation";

type IncomingTelemetry = {
  source?: string;
  message?: string;
  level?: "debug" | "info" | "warn" | "error";
  route?: string;
  details?: Record<string, unknown>;
  timestamp?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as IncomingTelemetry;

    await emitTelemetry({
      source: body.source ?? "frontend.client",
      message: body.message ?? "Client telemetry event",
      level: body.level ?? "info",
      route: body.route,
      details: body.details,
      timestamp: body.timestamp,
    });

    return Response.json({ ok: true });
  } catch (error) {
    await emitTelemetry({
      source: "frontend.telemetry.route",
      message: "Failed to process telemetry event",
      level: "error",
      details: {
        error: error instanceof Error ? error.message : "unknown",
      },
    });

    return Response.json({ ok: false }, { status: 400 });
  }
}
