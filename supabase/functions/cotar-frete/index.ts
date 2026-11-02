// GET com o CEP e a quantidade: devolve o endereço (ViaCEP) e as opções de
// frete do Melhor Envio, da mais barata para a mais cara.
import { buscarEndereco } from '../_shared/frete.ts';
import { cors, erro, json } from '../_shared/http.ts';
import { QTD_MAX } from '../_shared/loja.ts';
import { cotar, textoOpcao, textoPrazo } from '../_shared/melhorenvio.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const params = new URL(req.url).searchParams;
  const quantidade = Math.min(QTD_MAX, Math.max(1, Number(params.get('qtd')) || 1));

  const endereco = await buscarEndereco(params.get('cep') ?? '');
  if (!endereco) return erro('CEP não encontrado. Confira os números.', 404);

  try {
    const opcoes = await cotar(endereco.cep, quantidade);
    if (!opcoes.length) return json({ atende: false, endereco });
    return json({
      atende: true,
      endereco,
      opcoes: opcoes.map((o) => ({ ...o, nome: textoOpcao(o), prazo: textoPrazo(o) })),
    });
  } catch (e) {
    console.error(e);
    return erro('Não conseguimos calcular o frete agora. Tente de novo em instantes.', 502);
  }
});
