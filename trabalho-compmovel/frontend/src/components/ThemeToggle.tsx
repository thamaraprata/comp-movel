import { MoonIcon, SunIcon } from "@heroicons/react/24/outline";

import { useTheme } from "../providers/theme-provider";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-2 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition"
      aria-label={`Alternar tema para ${theme === "dark" ? "claro" : "escuro"}`}
    >
      {theme === "dark" ? (
        <SunIcon className="h-4 w-4 text-amber-400" />
      ) : (
        <MoonIcon className="h-4 w-4 text-slate-600" />
      )}
      <span>{theme === "dark" ? "Claro" : "Escuro"}</span>
    </button>
  );
}

