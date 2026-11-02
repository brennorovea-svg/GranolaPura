// Status público do pedido, pelo código do link. Não devolve e-mail, telefone nem endereço.
import { db } from '../_shared/db.ts';
import { cors, erro, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const codigo = (new URL(req.url).searchParams.get('c') ?? '').toUpperCase();
  if (!/^[A-Z0-9]{6,16}$/.test(codigo)) return erro('Código inválido.');

  const { data: p } = await db
    .from('pedidos')
    .select('id, codigo, status, criado_em, quantidade, preco_centavos, frete_centavos, total_centavos, regiao, prazo, nome, bairro')
    .eq('codigo', codigo)
    .maybeSingle();
  if (!p) return erro('Pedido não encontrado.', 404);

  const { data: eventos } = await db
    .from('eventos_pedido')
    .select('status, criado_em')
    .eq('pedido_id', p.id)
    .order('criado_em');

  const { id: _id, nome, ...publico } = p;
  return json({ ...publico, primeiro_nome: String(nome).split(' ')[0], eventos: eventos ?? [] });
});
