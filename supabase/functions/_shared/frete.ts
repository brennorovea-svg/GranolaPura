import { db } from './db.ts';
import { soDigitos } from './loja.ts';

export type Regiao = { nome: string; cep_inicio: number; cep_fim: number; frete_centavos: number; prazo: string };

export type Endereco = { cep: string; logradouro: string; bairro: string; cidade: string; uf: string };

// Entre as faixas que contêm o CEP, vale a mais estreita (a mais específica).
export function escolherRegiao(cep: string, regioes: Regiao[]): Regiao | null {
  const n = Number(soDigitos(cep));
  const candidatas = regioes.filter((r) => n >= r.cep_inicio && n <= r.cep_fim);
  candidatas.sort((a, b) => (a.cep_fim - a.cep_inicio) - (b.cep_fim - b.cep_inicio));
  return candidatas[0] ?? null;
}

export async function regiaoDoCep(cep: string): Promise<Regiao | null> {
  const { data, error } = await db
    .from('regioes_entrega')
    .select('nome, cep_inicio, cep_fim, frete_centavos, prazo')
    .eq('ativo', true);
  if (error) throw error;
  return escolherRegiao(cep, data as Regiao[]);
}

// ViaCEP: devolve null se o CEP não existir.
export async function buscarEndereco(cep: string): Promise<Endereco | null> {
  const d = soDigitos(cep);
  if (d.length !== 8) return null;
  const r = await fetch(`https://viacep.com.br/ws/${d}/json/`);
  if (!r.ok) return null;
  const v = await r.json();
  if (v.erro) return null;
  return {
    cep: `${d.slice(0, 5)}-${d.slice(5)}`,
    logradouro: v.logradouro ?? '',
    bairro: v.bairro ?? '',
    cidade: v.localidade ?? '',
    uf: v.uf ?? '',
  };
}
