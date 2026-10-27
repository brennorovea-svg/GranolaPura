// Regras da loja que valem para todas as funções.

export const PRODUTO = 'Granola Pura · pacote 200 g';
export const PRECO_CENTAVOS = 1700;
export const QTD_MAX = 20;

export const SITE_URL = Deno.env.get('SITE_URL') ?? 'https://www.granolapura.com.br';

export const STATUS_TEXTO: Record<string, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pagamento confirmado',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const brl = (centavos: number) =>
  (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const soDigitos = (valor: unknown) => String(valor ?? '').replace(/\D/g, '');

// Código curto e difícil de adivinhar para o link de acompanhamento.
export function novoCodigo(tamanho = 10) {
  const alfabeto = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
  const bytes = crypto.getRandomValues(new Uint8Array(tamanho));
  return Array.from(bytes, (b) => alfabeto[b % alfabeto.length]).join('');
}
