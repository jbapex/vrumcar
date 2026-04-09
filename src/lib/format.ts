export function formatPriceBRL(cents: number | null | undefined): string {
  if (cents == null) return '-';
  return (cents / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}

export function formatKm(km: number | null | undefined): string {
  if (km == null) return '-';
  return `${km.toLocaleString('pt-BR')} km`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('pt-BR');
}

/**
 * Converte entrada monetária comum (pt-BR ou número simples) em centavos.
 */
export function parseMoneyInput(value: string): number {
  const cleaned = value
    .replace(/[^\d,.-]/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  if (Number.isNaN(num)) return 0;
  return Math.round(num * 100);
}

/** Valor em reais (number input) → centavos inteiros. */
export function reaisNumberParaCentavos(reais: unknown): number | undefined {
  if (reais === undefined || reais === null || reais === '') return undefined;
  const n = Number(reais);
  if (Number.isNaN(n)) return undefined;
  return Math.round(n * 100);
}
