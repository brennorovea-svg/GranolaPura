// GET/POST com o CEP: devolve o endereço (ViaCEP) e o frete da região.
import { buscarEndereco, regiaoDoCep } from '../_shared/frete.ts';
import { cors, erro, json } from '../_shared/http.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  const cep = req.method === 'GET'
    ? new URL(req.url).searchParams.get('cep')
    : (await req.json().catch(() => ({}))).cep;

  const endereco = await buscarEndereco(cep ?? '');
  if (!endereco) return erro('CEP não encontrado. Confira os números.', 404);

  const regiao = await regiaoDoCep(endereco.cep);
  if (!regiao) return json({ atende: false, endereco });

  return json({
    atende: true,
    endereco,
    regiao: regiao.nome,
    frete_centavos: regiao.frete_centavos,
    prazo: regiao.prazo,
  });
});
