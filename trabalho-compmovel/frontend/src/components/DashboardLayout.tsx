import { ThemeToggle } from "./ThemeToggle";

interface DashboardLayoutProps {
  userName: string;
  onLogout: () => void;
  children: React.ReactNode;
}

export function DashboardLayout({ userName, onLogout, children }: DashboardLayoutProps) {
  return (
    <div className="min-h-screen overflow-x-hidden">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-3 sm:px-4 py-3 sm:py-4">
          <div className="min-w-0 flex-1 mr-2">
            <h1 className="text-base sm:text-lg font-semibold truncate">Painel Ambiental</h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 truncate">
              Bem-vindo, {userName}
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <ThemeToggle />
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg bg-red-500 px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow hover:bg-red-600 transition"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-8 space-y-6 sm:space-y-8 overflow-x-hidden">{children}</main>
    </div>
  );
}

