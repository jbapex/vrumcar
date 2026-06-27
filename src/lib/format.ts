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

/** Formata reais para exibição em input (pt-BR): 31000 → "31.000", 31000.5 → "31.000,5". */
export function formatReaisForInput(reais: number): string {
  if (!Number.isFinite(reais)) return '';
  return reais.toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

/** Centavos → string formatada para input de preço. */
export function centsToReaisDisplay(cents: number | null | undefined): string {
  if (cents == null) return '';
  return formatReaisForInput(cents / 100);
}

/** Converte string formatada pt-BR em valor numérico de reais. */
export function parseReaisFormatted(value: string): number | null {
  const cleaned = value.replace(/[^\d,]/g, '');
  if (!cleaned) return null;

  const commaIdx = cleaned.indexOf(',');
  const intPart = commaIdx >= 0 ? cleaned.slice(0, commaIdx) : cleaned;
  const decPart = commaIdx >= 0 ? cleaned.slice(commaIdx + 1) : '';

  if (!intPart && !decPart) return null;

  const intNum = intPart === '' ? 0 : Number.parseInt(intPart, 10);
  if (Number.isNaN(intNum)) return null;

  const decNum =
    decPart === ''
      ? 0
      : Number.parseInt(decPart.padEnd(2, '0').slice(0, 2), 10) / 100;

  return intNum + decNum;
}

/** Aplica máscara pt-BR enquanto o usuário digita. */
export function formatReaisWhileTyping(raw: string): string {
  const cleaned = raw.replace(/[^\d,]/g, '');
  const commaIdx = cleaned.indexOf(',');
  let intPart = commaIdx >= 0 ? cleaned.slice(0, commaIdx) : cleaned;
  const decPart =
    commaIdx >= 0
      ? cleaned.slice(commaIdx + 1).replace(/,/g, '').slice(0, 2)
      : '';

  intPart = intPart.replace(/^0+(?=\d)/, '');

  if (!intPart && !decPart && commaIdx < 0) return '';

  const formattedInt =
    intPart === '' ? (commaIdx >= 0 ? '0' : '') : Number(intPart).toLocaleString('pt-BR');

  if (commaIdx >= 0) {
    return `${formattedInt},${decPart}`;
  }

  return formattedInt;
}

/** Valor em reais (number input) → centavos inteiros. */
export function reaisNumberParaCentavos(reais: unknown): number | undefined {
  if (reais === undefined || reais === null || reais === '') return undefined;
  if (typeof reais === 'string') {
    const trimmed = reais.trim();
    if (!trimmed) return undefined;
    if (trimmed.includes(',') || /^\d{1,3}(\.\d{3})+/.test(trimmed)) {
      const parsed = parseReaisFormatted(trimmed);
      if (parsed == null) return undefined;
      return Math.round(parsed * 100);
    }
  }
  const n = Number(reais);
  if (Number.isNaN(n)) return undefined;
  return Math.round(n * 100);
}
