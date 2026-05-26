import Link from "next/link";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "Chat" },
  { href: "/portfolio", label: "Portfólio" },
  { href: "/news", label: "Notícias" },
  { href: "/alerts", label: "Alertas" },
];

export function AppShell({
  children,
  activePath,
}: {
  children: ReactNode;
  activePath: string;
}) {
  return (
    <div className="min-h-full flex flex-col bg-[#06080f] text-zinc-100">
      <header className="border-b border-white/10 bg-[#0a0e18]/90 backdrop-blur sticky top-0 z-20">
        <div className="mx-auto max-w-6xl px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center text-sm font-bold text-[#06080f]">
              C
            </span>
            <div>
              <p className="font-semibold tracking-tight group-hover:text-emerald-300 transition-colors">
                CryptoGPT
              </p>
              <p className="text-[11px] text-zinc-500">
                Análise · Notícias · Carteira
              </p>
            </div>
          </Link>
          <nav className="flex gap-1 text-sm">
            {links.map((l) => {
              const active =
                l.href === "/"
                  ? activePath === "/"
                  : activePath.startsWith(l.href);
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-md transition-colors ${
                    active
                      ? "bg-emerald-500/15 text-emerald-300"
                      : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 py-6">{children}</main>
      <footer className="border-t border-white/5 py-4 text-center text-xs text-zinc-500">
        Dados informativos — não constitui recomendação de investimento.
      </footer>
    </div>
  );
}
