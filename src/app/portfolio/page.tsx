import { AppShell } from "@/components/layout/AppShell";
import { PortfolioManager } from "@/components/portfolio/PortfolioManager";

export default function PortfolioPage() {
  return (
    <AppShell activePath="/portfolio">
      <PortfolioManager />
    </AppShell>
  );
}
