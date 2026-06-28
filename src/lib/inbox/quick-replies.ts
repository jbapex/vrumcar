/** Respostas rápidas padrão para lojas de veículos (MVP — configurável por org na Fase 2). */
export type QuickReply = {
  id: string;
  label: string;
  text: string;
};

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  {
    id: 'available',
    label: 'Disponível',
    text: 'Olá! Sim, o veículo ainda está disponível. Posso te passar mais detalhes?',
  },
  {
    id: 'schedule',
    label: 'Agendar visita',
    text: 'Que tal agendar uma visita para você conhecer o carro pessoalmente? Qual dia e horário ficam melhor pra você?',
  },
  {
    id: 'financing',
    label: 'Financiamento',
    text: 'Trabalhamos com financiamento! Me conta: você prefere entrada + parcelas ou trocar um veículo na negociação?',
  },
  {
    id: 'photos',
    label: 'Enviar fotos',
    text: 'Vou separar as fotos e vídeos do veículo e te mando em seguida, tudo bem?',
  },
  {
    id: 'trade-in',
    label: 'Troca',
    text: 'Aceitamos seu carro na troca! Me manda marca, modelo, ano e KM que faço uma avaliação prévia.',
  },
];
