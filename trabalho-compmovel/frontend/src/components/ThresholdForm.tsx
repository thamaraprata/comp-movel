import { useEffect, useMemo, useState } from "react";

import type { SensorThreshold } from "../types";

interface ThresholdFormProps {
  thresholds: SensorThreshold[];
  onSave: (threshold: SensorThreshold) => Promise<void>;
}

export function ThresholdForm({ thresholds, onSave }: ThresholdFormProps) {
  const [selectedType, setSelectedType] = useState<string>(
    thresholds[0]?.sensorType ?? "temperature"
  );

  const current = useMemo(
    () => thresholds.find((item) => item.sensorType === selectedType),
    [selectedType, thresholds]
  );

  const [minValue, setMinValue] = useState<string>(current?.minValue?.toString() ?? "");
  const [maxValue, setMaxValue] = useState<string>(current?.maxValue?.toString() ?? "");
  const [unit, setUnit] = useState<string>(current?.unit ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (current) {
      setMinValue(current.minValue !== null ? String(current.minValue) : "");
      setMaxValue(current.maxValue !== null ? String(current.maxValue) : "");
      setUnit(current.unit);
    }
  }, [current]);

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await onSave({
        sensorType: selectedType as SensorThreshold["sensorType"],
        minValue: minValue === "" ? null : Number(minValue),
        maxValue: maxValue === "" ? null : Number(maxValue),
        unit
      });
      setMessage("Limites atualizados com sucesso!");
    } catch (error) {
      console.error(error);
      setMessage("Não foi possível salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  if (thresholds.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Nenhum limite configurado.</p>;
  }

  return (
    <form className="space-y-4" onSubmit={handleSave}>
      <div>
        <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
          Tipo de sensor
        </label>
        <select
          value={selectedType}
          onChange={(event) => setSelectedType(event.target.value)}
          className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
        >
          {thresholds.map((threshold) => (
            <option key={threshold.sensorType} value={threshold.sensorType}>
              {threshold.sensorType}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Mínimo
          </label>
          <input
            type="number"
            step="0.1"
            value={minValue}
            onChange={(event) => setMinValue(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">
            Máximo
          </label>
          <input
            type="number"
            step="0.1"
            value={maxValue}
            onChange={(event) => setMaxValue(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-600 dark:text-slate-300">Unidade</label>
          <input
            type="text"
            value={unit}
            onChange={(event) => setUnit(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-500 disabled:opacity-50"
      >
        {saving ? "Salvando..." : "Salvar limites"}
      </button>

      {message && (
        <p className="text-center text-sm text-slate-600 dark:text-slate-400">{message}</p>
      )}
    </form>
  );
}

