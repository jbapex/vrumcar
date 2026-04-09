/**
 * Formata número de telefone brasileiro pra exibição.
 * Aceita string só com dígitos e retorna no formato (XX) XXXXX-XXXX.
 */
export function formatPhone(phone: string | null | undefined): string {
  if (!phone) return '-';
  const digits = phone.replace(/\D/g, '');

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return phone;
}

/**
 * Formata CPF pra exibição: XXX.XXX.XXX-XX
 */
export function formatCpf(cpf: string | null | undefined): string {
  if (!cpf) return '-';
  const d = cpf.replace(/\D/g, '');
  if (d.length !== 11) return cpf;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}

/**
 * Formata CNPJ: XX.XXX.XXX/XXXX-XX
 */
export function formatCnpj(cnpj: string | null | undefined): string {
  if (!cnpj) return '-';
  const d = cnpj.replace(/\D/g, '');
  if (d.length !== 14) return cnpj;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/**
 * Formata CPF ou CNPJ baseado no comprimento.
 */
export function formatCpfCnpj(value: string | null | undefined): string {
  if (!value) return '-';
  const d = value.replace(/\D/g, '');
  if (d.length === 11) return formatCpf(d);
  if (d.length === 14) return formatCnpj(d);
  return value;
}
