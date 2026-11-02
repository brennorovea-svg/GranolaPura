import { assertEquals } from 'jsr:@std/assert@1';
import { escolherOpcoes } from './melhorenvio.ts';
import { assinaturaValida } from './mercadopago.ts';

// Trecho real de uma cotação do Melhor Envio (02/11/2026), resumido.
const cotacao = [
  { id: 1, name: 'PAC', company: { name: 'Correios' }, error: 'Transportadora não atende este trecho.' },
  { id: 2, name: 'SEDEX', company: { name: 'Correios' }, price: '12.62', custom_price: '12.62', delivery_time: 1, custom_delivery_time: 2 },
  { id: 4, name: '.Com', company: { name: 'Jadlog' }, price: '13.16', custom_price: '13.16', custom_delivery_time: 6 },
  { id: 31, name: 'Express', company: { name: 'Loggi' }, price: '9.85', custom_price: '9.85', custom_delivery_time: 2 },
  { id: 32, name: 'Loggi Ponto', company: { name: 'Loggi' }, price: '10.43', custom_price: '10.43', custom_delivery_time: 4 },
];

Deno.test('Sem lista de serviços: as 3 opções mais baratas, sem as que deram erro', () => {
  assertEquals(escolherOpcoes(cotacao, []).map((o) => o.id), [31, 32, 2]);
});

Deno.test('Preço em centavos e prazo combinado do Melhor Envio', () => {
  assertEquals(escolherOpcoes(cotacao, [2])[0], { id: 2, empresa: 'Correios', servico: 'SEDEX', frete_centavos: 1262, prazo_dias: 2 });
});

Deno.test('Lista de serviços fixa filtra e mantém a ordem por preço', () => {
  assertEquals(escolherOpcoes(cotacao, [2, 31]).map((o) => o.id), [31, 2]);
});

Deno.test('Nenhuma transportadora atende: lista vazia', () => {
  assertEquals(escolherOpcoes([cotacao[0]], []), []);
});

async function assinar(segredo: string, manifesto: string) {
  const k = await crypto.subtle.importKey('raw', new TextEncoder().encode(segredo), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const s = await crypto.subtle.sign('HMAC', k, new TextEncoder().encode(manifesto));
  return Array.from(new Uint8Array(s), (b) => b.toString(16).padStart(2, '0')).join('');
}

Deno.test('Assinatura do Mercado Pago', async () => {
  const v1 = await assinar('segredo', 'id:123456;request-id:abc;ts:1700000000;');
  const req = (assinatura: string) =>
    new Request('https://x', { headers: { 'x-signature': `ts=1700000000,v1=${assinatura}`, 'x-request-id': 'abc' } });
  assertEquals(await assinaturaValida(req(v1), '123456', 'segredo'), true);
  assertEquals(await assinaturaValida(req(v1), '999', 'segredo'), false);
  assertEquals(await assinaturaValida(req('00'), '123456', 'segredo'), false);
});
