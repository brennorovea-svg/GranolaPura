// Grava o pedido e cria o pagamento no Mercado Pago (Checkout Pro).
// Preço e frete são sempre recalculados aqui: o navegador só manda a quantidade e o CEP.
import { db } from '../_shared/db.ts';
import { buscarEndereco, regiaoDoCep } from '../_shared/frete.ts';
import { cors, erro, json } from '../_shared/http.ts';
import { novoCodigo, PRECO_CENTAVOS, PRODUTO, QTD_MAX, SITE_URL, soDigitos } from '../_shared/loja.ts';

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN');

const texto = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return erro('Use POST.', 405);
  if (!MP_ACCESS_TOKEN) return erro('Pagamento ainda não configurado.', 503);

  const b = await req.json().catch(() => null);
  if (!b) return erro('Pedido inválido.');

  const quantidade = Number(b.quantidade);
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > QTD_MAX) {
    return erro(`Escolha de 1 a ${QTD_MAX} pacotes.`);
  }

  const nome = texto(b.nome);
  const email = texto(b.email).toLowerCase();
  const telefone = soDigitos(b.telefone);
  const numero = texto(b.numero, 20);
  if (nome.length < 2) return erro('Informe o seu nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return erro('Confira o e-mail.');
  if (telefone.length < 10 || telefone.length > 11) return erro('Informe o celular com DDD.');
  if (!numero) return erro('Informe o número do endereço.');

  const endereco = await buscarEndereco(b.cep);
  if (!endereco) return erro('CEP não encontrado.');
  const regiao = await regiaoDoCep(endereco.cep);
  if (!regiao) return erro('Ainda não entregamos nesse CEP.');

  // Alguns CEPs (cidades pequenas, CEP geral) vêm sem rua: aí vale o que o cliente digitou.
  const logradouro = endereco.logradouro || texto(b.logradouro);
  const bairro = endereco.bairro || texto(b.bairro, 80);
  if (!logradouro || !bairro) return erro('Informe a rua e o bairro.');

  const pedido = {
    codigo: novoCodigo(),
    quantidade,
    preco_centavos: PRECO_CENTAVOS,
    frete_centavos: regiao.frete_centavos,
    total_centavos: quantidade * PRECO_CENTAVOS + regiao.frete_centavos,
    regiao: regiao.nome,
    prazo: regiao.prazo,
    nome,
    email,
    telefone,
    cep: endereco.cep,
    logradouro,
    numero,
    complemento: texto(b.complemento, 80) || null,
    bairro,
    cidade: endereco.cidade,
    uf: endereco.uf,
    observacoes: texto(b.observacoes, 300) || null,
  };

  const { data: salvo, error } = await db.from('pedidos').insert(pedido).select('id, codigo').single();
  if (error) {
    console.error(error);
    return erro('Não conseguimos registrar o pedido. Tente de novo.', 500);
  }
  await db.from('eventos_pedido').insert({ pedido_id: salvo.id, status: 'aguardando_pagamento' });

  const voltar = `${SITE_URL}/pedido.html?c=${salvo.codigo}`;
  const funcoes = `${Deno.env.get('SUPABASE_URL')}/functions/v1`;
  const itens = [
    { id: 'granola-200g', title: PRODUTO, quantity: quantidade, unit_price: PRECO_CENTAVOS / 100, currency_id: 'BRL' },
    { id: 'entrega', title: `Entrega · ${regiao.nome}`, quantity: 1, unit_price: regiao.frete_centavos / 100, currency_id: 'BRL' },
  ].filter((i) => i.unit_price > 0);

  const r = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
      'X-Idempotency-Key': salvo.id,
    },
    body: JSON.stringify({
      items: itens,
      payer: { name: nome, email },
      external_reference: salvo.id,
      notification_url: `${funcoes}/webhook-mercadopago`,
      back_urls: { success: voltar, pending: voltar, failure: voltar },
      auto_return: 'approved',
      statement_descriptor: 'GRANOLAPURA',
      payment_methods: { installments: 1 },
    }),
  });

  if (!r.ok) {
    console.error('Mercado Pago recusou a preferência', r.status, await r.text());
    await db.from('pedidos').update({ status: 'cancelado' }).eq('id', salvo.id);
    await db.from('eventos_pedido').insert({ pedido_id: salvo.id, status: 'cancelado', detalhe: 'falha ao criar pagamento' });
    return erro('O pagamento está indisponível agora. Tente de novo em instantes.', 502);
  }

  const pref = await r.json();
  await db.from('pedidos').update({ mp_preferencia_id: pref.id }).eq('id', salvo.id);

  return json({ codigo: salvo.codigo, pagamento_url: pref.init_point });
});
