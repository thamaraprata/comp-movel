export function formatTimestamp(timestamp: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(timestamp));
}

export function formatNumber(value: number, unit?: string) {
  const formatter = new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2
  });
  return `${formatter.format(value)}${unit ? ` ${unit}` : ""}`;
}

