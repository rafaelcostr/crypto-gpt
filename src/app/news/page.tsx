import { AppShell } from "@/components/layout/AppShell";
import { NewsPanel } from "@/components/news/NewsPanel";

export default function NewsPage() {
  return (
    <AppShell activePath="/news">
      <NewsPanel />
    </AppShell>
  );
}
