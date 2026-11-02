// Painel da Lynda: muda o status de um pedido pago e avisa o cliente por e-mail.
import { db } from '../_shared/db.ts';
import { emailMudancaStatus } from '../_shared/email.ts';
import { cors, erro, json } from '../_shared/http.ts';

// De onde cada status pode vir. Evita, por exemplo, "entregue" num pedido não pago.
const TRANSICOES: Record<string, string[]> = {
  saiu_para_entrega: ['pago'],
  entregue: ['pago', 'saiu_para_entrega'],
  cancelado: ['aguardando_pagamento', 'pago', 'saiu_para_entrega'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return erro('Use POST.', 405);

  const token = (req.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: auth } = await db.auth.getUser(token);
  const email = auth?.user?.email?.toLowerCase();
  if (!email) return erro('Faça login de novo.', 401);

  const { data: admin } = await db.from('admins').select('email').eq('email', email).maybeSingle();
  if (!admin) return erro('Sem acesso ao painel.', 403);

  const { codigo, status } = await req.json().catch(() => ({}));
  const origens = TRANSICOES[status];
  if (!origens) return erro('Status inválido.');

  const { data: pedido } = await db
    .from('pedidos')
    .update({ status })
    .eq('codigo', codigo)
    .in('status', origens)
    .select('*')
    .maybeSingle();
  if (!pedido) return erro('Esse pedido não pode ir para esse status.', 409);

  await db.from('eventos_pedido').insert({ pedido_id: pedido.id, status, detalhe: `por ${email}` });
  await emailMudancaStatus(pedido);

  return json({ ok: true, status });
});
