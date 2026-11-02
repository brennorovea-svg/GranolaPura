// Frete pelo Melhor Envio, na conta da Lynda.
// O CEP de origem vem do endereço cadastrado na conta (token com users-read).
// CEP_ORIGEM nos segredos, se existir, tem prioridade.
import { PACOTE, soDigitos } from './loja.ts';

const BASE = Deno.env.get('MELHOR_ENVIO_BASE') ?? 'https://melhorenvio.com.br/api/v2';
const TOKEN = Deno.env.get('MELHOR_ENVIO_TOKEN');
// Ids de serviço separados por vírgula (ex.: "17,1,4"). Vazio: os 3 mais baratos.
const SERVICOS = (Deno.env.get('MELHOR_ENVIO_SERVICOS') ?? '').split(',').map((s) => Number(s.trim())).filter(Boolean);
const MAX_OPCOES = 3;

export type OpcaoFrete = {
  id: number;
  empresa: string;
  servico: string;
  frete_centavos: number;
  prazo_dias: number;
};

async function chamar(caminho: string, init: RequestInit = {}) {
  if (!TOKEN) throw new Error('MELHOR_ENVIO_TOKEN ausente');
  const r = await fetch(BASE + caminho, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      'User-Agent': 'Granola Pura (pedidos@granolapura.com.br)',
    },
  });
  if (!r.ok) throw new Error(`Melhor Envio ${caminho}: ${r.status} ${await r.text()}`);
  return r.json();
}

let origemCache: { cep: string; ate: number } | null = null;

// Endereço padrão da conta; guarda por 10 minutos para não consultar a cada CEP digitado.
export async function cepOrigem(): Promise<string> {
  const fixo = soDigitos(Deno.env.get('CEP_ORIGEM'));
  if (fixo.length === 8) return fixo;
  if (origemCache && origemCache.ate > Date.now()) return origemCache.cep;

  const resposta = await chamar('/me/addresses');
  const enderecos: any[] = Array.isArray(resposta) ? resposta : resposta.data ?? [];
  const escolhido = enderecos.find((e) => e.default) ?? enderecos[0];
  const cep = soDigitos(escolhido?.postal_code);
  if (cep.length !== 8) throw new Error('Conta do Melhor Envio sem endereço cadastrado');

  origemCache = { cep, ate: Date.now() + 10 * 60 * 1000 };
  return cep;
}

// Transforma a resposta do Melhor Envio nas opções que o site mostra.
export function escolherOpcoes(resposta: any[], servicos = SERVICOS): OpcaoFrete[] {
  const validas = resposta
    .filter((o) => !o.error && (o.custom_price ?? o.price))
    .map((o) => ({
      id: Number(o.id),
      empresa: String(o.company?.name ?? ''),
      servico: String(o.name ?? ''),
      frete_centavos: Math.round(Number(o.custom_price ?? o.price) * 100),
      prazo_dias: Number(o.custom_delivery_time ?? o.delivery_time),
    }))
    .sort((a, b) => a.frete_centavos - b.frete_centavos || a.prazo_dias - b.prazo_dias);

  return servicos.length
    ? validas.filter((o) => servicos.includes(o.id))
    : validas.slice(0, MAX_OPCOES);
}

export async function cotar(cepDestino: string, quantidade: number): Promise<OpcaoFrete[]> {
  const resposta = await chamar('/me/shipment/calculate', {
    method: 'POST',
    body: JSON.stringify({
      from: { postal_code: await cepOrigem() },
      to: { postal_code: soDigitos(cepDestino) },
      products: [{
        id: 'granola-200g',
        width: PACOTE.largura_cm,
        height: PACOTE.altura_cm,
        length: PACOTE.comprimento_cm,
        weight: PACOTE.peso_kg,
        insurance_value: PACOTE.valor_reais,
        quantity: quantidade,
      }],
    }),
  });
  return escolherOpcoes(Array.isArray(resposta) ? resposta : []);
}

export const textoOpcao = (o: OpcaoFrete) => `${o.empresa} ${o.servico}`;
export const textoPrazo = (o: OpcaoFrete) => `até ${o.prazo_dias} ${o.prazo_dias === 1 ? 'dia útil' : 'dias úteis'}`;
