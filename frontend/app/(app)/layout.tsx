import { AppShell } from "@/components/app/app-shell";
import { RouteChangeTelemetry } from "@/components/app/route-change-telemetry";

export default function PrivateAppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <RouteChangeTelemetry />
      <AppShell>{children}</AppShell>
    </>
  );
}
