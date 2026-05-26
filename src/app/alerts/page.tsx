import { AlertsManager } from "@/components/alerts/AlertsManager";
import { AppShell } from "@/components/layout/AppShell";

export default function AlertsPage() {
  return (
    <AppShell activePath="/alerts">
      <AlertsManager />
    </AppShell>
  );
}
