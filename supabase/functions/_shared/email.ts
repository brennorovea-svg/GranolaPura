import { brl, SITE_URL, STATUS_TEXTO } from './loja.ts';

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const REMETENTE = Deno.env.get('EMAIL_REMETENTE') ?? 'Granola Pura <pedidos@granolapura.com.br>';
const EMAIL_LOJA = Deno.env.get('EMAIL_LOJA');

type Pedido = Record<string, any>;

// Sem chave do Resend o e-mail só vai para o log: o pedido não pode falhar por isso.
async function enviar(para: string, assunto: string, html: string) {
  if (!RESEND_API_KEY) {
    console.log(`[email desligado] para ${para}: ${assunto}`);
    return;
  }
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: REMETENTE, to: [para], subject: assunto, html }),
  });
  if (!r.ok) console.error('Resend falhou', r.status, await r.text());
}

const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

const link = (p: Pedido) => `${SITE_URL}/pedido.html?c=${p.codigo}`;

const endereco = (p: Pedido) =>
  `${esc(p.logradouro)}, ${esc(p.numero)}${p.complemento ? ` · ${esc(p.complemento)}` : ''}<br>` +
  `${esc(p.bairro)} · ${esc(p.cidade)}/${esc(p.uf)} · CEP ${esc(p.cep)}`;

const resumo = (p: Pedido) => `
  <table cellpadding="6" style="border-collapse:collapse;font-size:15px">
    <tr><td>${p.quantidade} × pacote 200 g</td><td align="right">${brl(p.quantidade * p.preco_centavos)}</td></tr>
    <tr><td>Entrega (${esc(p.regiao)})</td><td align="right">${brl(p.frete_centavos)}</td></tr>
    <tr><td><b>Total</b></td><td align="right"><b>${brl(p.total_centavos)}</b></td></tr>
  </table>`;

const moldura = (conteudo: string) => `
  <div style="font-family:Arial,sans-serif;color:#1C1814;background:#F7F0E4;padding:24px;max-width:560px">
    <p style="font-size:22px;font-weight:bold;letter-spacing:1px;margin:0 0 16px">GRANOLA PURA</p>
    ${conteudo}
  </div>`;

export async function emailPedidoPago(p: Pedido) {
  const primeiroNome = esc(String(p.nome).split(' ')[0]);
  await enviar(p.email, `Pedido ${p.codigo} confirmado`, moldura(`
    <p>Oi, ${primeiroNome}! Recebemos o seu pagamento e o seu pedido já está com a gente.</p>
    ${resumo(p)}
    <p><b>Entrega:</b> ${esc(p.prazo)}, em:<br>${endereco(p)}</p>
    <p><a href="${link(p)}">Acompanhe o pedido ${p.codigo}</a></p>`));

  if (EMAIL_LOJA) {
    await enviar(EMAIL_LOJA, `Novo pedido pago: ${p.quantidade} pct · ${esc(p.regiao)} · ${p.codigo}`, moldura(`
      <p><b>${esc(p.nome)}</b> · ${esc(p.telefone)} · ${esc(p.email)}</p>
      ${resumo(p)}
      <p>${endereco(p)}</p>
      ${p.observacoes ? `<p><b>Observações:</b> ${esc(p.observacoes)}</p>` : ''}
      <p><a href="${SITE_URL}/painel.html">Abrir o painel</a></p>`));
  }
}

export async function emailMudancaStatus(p: Pedido) {
  const textos: Record<string, string> = {
    saiu_para_entrega: 'O seu pedido saiu para entrega e chega em breve.',
    entregue: 'O seu pedido foi entregue. Bom apetite!',
    cancelado: 'O seu pedido foi cancelado. Se tiver dúvida, responda este e-mail.',
  };
  if (!textos[p.status]) return;
  await enviar(p.email, `Pedido ${p.codigo}: ${STATUS_TEXTO[p.status]}`, moldura(`
    <p>${textos[p.status]}</p>
    <p><a href="${link(p)}">Ver o pedido ${p.codigo}</a></p>`));
}
