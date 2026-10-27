// Página de acompanhamento: lê o código da URL e mostra o status do pedido.
// Logo depois do pagamento o aviso do Mercado Pago pode demorar alguns
// segundos, então enquanto estiver "aguardando pagamento" a página consulta de novo.

const $ = (id) => document.getElementById(id);
const brl = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (iso) => new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const ETAPAS = [
  ['pago', 'Pagamento confirmado'],
  ['saiu_para_entrega', 'Saiu para entrega'],
  ['entregue', 'Entregue'],
];

const TITULOS = {
  aguardando_pagamento: 'AGUARDANDO PAGAMENTO',
  pago: 'PEDIDO CONFIRMADO',
  saiu_para_entrega: 'SAIU PARA ENTREGA',
  entregue: 'ENTREGUE',
  cancelado: 'PEDIDO CANCELADO',
};

const codigo = new URLSearchParams(location.search).get('c') || '';
let tentativas = 0;

function mostrar(p) {
  $('titulo').textContent = TITULOS[p.status] || p.status.toUpperCase();

  const mensagens = {
    aguardando_pagamento: tentativas < 12
      ? 'Estamos esperando a confirmação do Mercado Pago. Se você já pagou, esta página atualiza sozinha.'
      : 'Ainda não recebemos a confirmação do pagamento. Pix pode levar alguns minutos. Se precisar, fale com a gente no WhatsApp.',
    pago: `Obrigado, ${p.primeiro_nome}! O seu pedido chega ${p.prazo}. A confirmação foi para o seu e-mail.`,
    saiu_para_entrega: `${p.primeiro_nome}, o seu pedido está a caminho.`,
    entregue: 'Pedido entregue. Bom apetite!',
    cancelado: 'Este pedido foi cancelado. Se tiver dúvida, fale com a gente no WhatsApp.',
  };
  $('mensagem').textContent = mensagens[p.status] || '';

  const quando = Object.fromEntries(p.eventos.map((e) => [e.status, e.criado_em]));
  const linha = $('linha');
  linha.replaceChildren(...ETAPAS.map(([status, rotulo]) => {
    const li = document.createElement('li');
    li.className = quando[status] ? 'is-feito' : '';
    li.innerHTML = '<span></span>';
    li.querySelector('span').textContent = quando[status] ? `${rotulo} · ${data(quando[status])}` : rotulo;
    return li;
  }));
  linha.hidden = p.status === 'aguardando_pagamento' || p.status === 'cancelado';

  const resumo = $('resumo');
  resumo.innerHTML = '';
  [
    [`${p.quantidade} × pacote 200 g`, brl(p.quantidade * p.preco_centavos)],
    [`Entrega · ${p.regiao}`, brl(p.frete_centavos)],
    ['Total', brl(p.total_centavos)],
  ].forEach(([dt, dd], i, todos) => {
    const div = document.createElement('div');
    if (i === todos.length - 1) div.className = 'resumo__total';
    div.innerHTML = '<dt></dt><dd></dd>';
    div.querySelector('dt').textContent = dt;
    div.querySelector('dd').textContent = dd;
    resumo.append(div);
  });
  resumo.hidden = false;

  $('rodape').innerHTML = `Pedido <strong>${p.codigo}</strong> · <a href="https://wa.me/5511948177429?text=${encodeURIComponent(`Oi! Sobre o pedido ${p.codigo}`)}" target="_blank" rel="noopener">dúvidas no WhatsApp</a>`;
}

async function carregar() {
  if (!codigo) {
    $('titulo').textContent = 'PEDIDO NÃO ENCONTRADO';
    $('mensagem').textContent = 'Use o link que chegou no seu e-mail.';
    return;
  }
  try {
    const r = await fetch(`${window.LOJA.funcoes}/status-pedido?c=${encodeURIComponent(codigo)}`);
    const p = await r.json();
    if (!r.ok) throw new Error(p.erro);
    mostrar(p);
    if (p.status === 'aguardando_pagamento' && tentativas++ < 12) setTimeout(carregar, 5000);
  } catch (e) {
    $('titulo').textContent = 'PEDIDO NÃO ENCONTRADO';
    $('mensagem').textContent = e.message || 'Confira o link que chegou no seu e-mail.';
  }
}

carregar();
