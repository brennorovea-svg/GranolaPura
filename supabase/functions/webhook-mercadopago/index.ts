// Notificação do Mercado Pago. Valida a assinatura, confere o pagamento na API
// e marca o pedido como pago uma única vez (o MP repete avisos).
import { db } from '../_shared/db.ts';
import { emailPedidoPago } from '../_shared/email.ts';
import { json } from '../_shared/http.ts';
import { assinaturaValida } from '../_shared/mercadopago.ts';

const MP_ACCESS_TOKEN = Deno.env.get('MP_ACCESS_TOKEN')!;
const MP_WEBHOOK_SECRET = Deno.env.get('MP_WEBHOOK_SECRET');

Deno.serve(async (req) => {
  const url = new URL(req.url);
  const corpo = await req.json().catch(() => ({}));
  const tipo = url.searchParams.get('type') ?? corpo.type;
  const dataId = String(url.searchParams.get('data.id') ?? corpo?.data?.id ?? '');

  // Só interessa pagamento. Outros avisos (merchant_order etc.) recebem 200 e são ignorados.
  if (tipo !== 'payment' || !dataId) return json({ ok: true });

  if (MP_WEBHOOK_SECRET && !(await assinaturaValida(req, dataId, MP_WEBHOOK_SECRET))) {
    console.warn('Assinatura inválida', dataId);
    return json({ erro: 'assinatura inválida' }, 401);
  }

  const r = await fetch(`https://api.mercadopago.com/v1/payments/${encodeURIComponent(dataId)}`, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN}` },
  });
  if (!r.ok) {
    console.error('Pagamento não encontrado', dataId, r.status);
    return json({ erro: 'pagamento não encontrado' }, 502); // o MP tenta de novo
  }
  const pagamento = await r.json();

  const { data: pedido } = await db.from('pedidos').select('*').eq('id', pagamento.external_reference).maybeSingle();
  if (!pedido) return json({ ok: true, ignorado: 'pedido desconhecido' });

  if (pagamento.status === 'approved') {
    const pagoCentavos = Math.round(Number(pagamento.transaction_amount) * 100);
    if (pagoCentavos !== pedido.total_centavos) {
      console.error('Valor pago diferente do pedido', pedido.codigo, pagoCentavos, pedido.total_centavos);
      return json({ ok: true, ignorado: 'valor divergente' });
    }

    // O filtro por status garante que só o primeiro aviso confirma o pedido e manda e-mail.
    const { data: atualizado } = await db
      .from('pedidos')
      .update({ status: 'pago', pago_em: new Date().toISOString(), mp_pagamento_id: String(pagamento.id) })
      .eq('id', pedido.id)
      .eq('status', 'aguardando_pagamento')
      .select('*')
      .maybeSingle();

    if (atualizado) {
      await db.from('eventos_pedido').insert({
        pedido_id: pedido.id,
        status: 'pago',
        detalhe: `${pagamento.payment_method_id} · pagamento ${pagamento.id}`,
      });
      await emailPedidoPago(atualizado);
    }
  } else if (['refunded', 'charged_back'].includes(pagamento.status) && pedido.status !== 'cancelado') {
    await db.from('pedidos').update({ status: 'cancelado' }).eq('id', pedido.id);
    await db.from('eventos_pedido').insert({ pedido_id: pedido.id, status: 'cancelado', detalhe: `pagamento ${pagamento.status}` });
  }

  return json({ ok: true });
});
