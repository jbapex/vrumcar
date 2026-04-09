import type { PaymentMethod, SaleStatus } from '@prisma/client';

export const SALE_STATUS_LABELS: Record<SaleStatus, string> = {
  PENDING: 'Pendente',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro / Pix',
  BANK_TRANSFER: 'Transferência / TED',
  DEBIT_CARD: 'Cartão de débito',
  CREDIT_CARD: 'Cartão de crédito',
  FINANCING: 'Financiamento bancário',
  CONSORTIUM: 'Consórcio / Carta',
  TRADE_IN_ONLY: 'Somente troca',
  MIXED: 'Misto',
};
