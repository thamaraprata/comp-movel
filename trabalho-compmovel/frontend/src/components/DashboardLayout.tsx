import { ThemeToggle } from "./ThemeToggle";

interface DashboardLayoutProps {
  userName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardLayout({ userName, onLogout, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold">Painel Ambiental</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Bem-vindo, {userName}. Monitoramento em tempo real dos sensores.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white shadow hover:bg-red-600 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">{children}</main>
    </div>
  );
}

