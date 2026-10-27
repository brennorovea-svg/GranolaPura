import { assertEquals } from 'jsr:@std/assert@1';
import { escolherRegiao, type Regiao } from './frete.ts';
import { assinaturaValida } from './mercadopago.ts';

const regioes: Regiao[] = [
  { nome: 'Capital', cep_inicio: 1000000, cep_fim: 5999999, frete_centavos: 1500, prazo: '2 dias' },
  { nome: 'Capital', cep_inicio: 8000000, cep_fim: 8499999, frete_centavos: 1500, prazo: '2 dias' },
  { nome: 'Grande SP', cep_inicio: 6000000, cep_fim: 9999999, frete_centavos: 2000, prazo: '3 dias' },
];

Deno.test('CEP da capital usa a faixa da capital', () => {
  assertEquals(escolherRegiao('05422-030', regioes)?.nome, 'Capital');
});

Deno.test('Zona Leste dentro da faixa da Grande SP fica com a capital (faixa mais estreita)', () => {
  assertEquals(escolherRegiao('08210-000', regioes)?.nome, 'Capital');
});

Deno.test('Guarulhos cai na Grande SP', () => {
  assertEquals(escolherRegiao('07010-000', regioes)?.frete_centavos, 2000);
});

Deno.test('Fora da área não atende', () => {
  assertEquals(escolherRegiao('13010-000', regioes), null);
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
