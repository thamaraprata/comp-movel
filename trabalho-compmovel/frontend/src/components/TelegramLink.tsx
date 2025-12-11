import { useState } from "react";
import api from "../services/api";

export function TelegramLink() {
  const [code, setCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const generateCode = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await api.post<{ status: string; data: { code: string; expiresAt: string } }>(
        "/auth/generate-telegram-code"
      );

      setCode(data.data.code);
      setExpiresAt(data.data.expiresAt);
    } catch (err: any) {
      setError(err.response?.data?.message || "Erro ao gerar código");
    } finally {
      setLoading(false);
    }
  };

  const getTimeRemaining = () => {
    if (!expiresAt) return null;

    const now = new Date().getTime();
    const expiry = new Date(expiresAt).getTime();
    const diff = expiry - now;

    if (diff <= 0) return "Expirado";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-2xl">📱</span>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Vincular Telegram
        </h3>
      </div>

      <p className="mb-4 text-sm text-slate-600 dark:text-slate-400">
        Vincule sua conta ao Telegram para receber notificações e usar o chat pelo bot.
      </p>

      {!code ? (
        <button
          onClick={generateCode}
          disabled={loading}
          className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
        >
          {loading ? "Gerando..." : "Gerar Código"}
        </button>
      ) : (
        <div className="space-y-4">
          <div className="rounded-lg bg-slate-100 p-4 text-center dark:bg-slate-700">
            <p className="mb-2 text-xs text-slate-600 dark:text-slate-400">Seu código:</p>
            <p className="mb-2 text-3xl font-bold tracking-widest text-slate-900 dark:text-white">
              {code}
            </p>
            <p className="text-xs text-slate-500">
              Expira em: <span className="font-semibold">{getTimeRemaining()}</span>
            </p>
          </div>

          <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-950">
            <p className="text-sm text-blue-900 dark:text-blue-200">
              <strong>Como usar:</strong>
            </p>
            <ol className="ml-4 mt-2 list-decimal space-y-1 text-sm text-blue-800 dark:text-blue-300">
              <li>Abra o Telegram</li>
              <li>Procure pelo bot</li>
              <li>
                Digite: <code className="rounded bg-blue-100 px-1 dark:bg-blue-900">/vincular {code}</code>
              </li>
            </ol>
          </div>

          <button
            onClick={generateCode}
            disabled={loading}
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
          >
            Gerar Novo Código
          </button>
        </div>
      )}

      {error && (
        <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm text-red-800 dark:bg-red-900 dark:text-red-200">
          {error}
        </div>
      )}
    </div>
  );
}
