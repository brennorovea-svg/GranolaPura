import { soDigitos } from './loja.ts';

export type Endereco = { cep: string; logradouro: string; bairro: string; cidade: string; uf: string };

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
