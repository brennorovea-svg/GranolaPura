// Painel da Lynda: login por link no e-mail, lista de pedidos pagos e botões
// de status. A leitura passa pela RLS (só quem está em admins vê); a mudança de
// status passa pela função atualizar-status, que também avisa o cliente.

const sb = window.supabase.createClient(window.LOJA.supabaseUrl, window.LOJA.chavePublica);
const $ = (id) => document.getElementById(id);
const brl = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const data = (iso) => new Date(iso).toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const STATUS = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago · separar',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

const ACOES = {
  pago: [['saiu_para_entrega', 'Saiu para entrega'], ['entregue', 'Entregue']],
  saiu_para_entrega: [['entregue', 'Entregue']],
};

const FILTROS = {
  abertos: ['pago', 'saiu_para_entrega'],
  entregue: ['entregue'],
  todos: ['pago', 'saiu_para_entrega', 'entregue', 'cancelado'],
};

let filtro = 'abertos';

async function carregar() {
  $('painel-erro').textContent = '';
  const { data: pedidos, error } = await sb
    .from('pedidos')
    .select('*')
    .in('status', FILTROS[filtro])
    .order('criado_em', { ascending: filtro === 'abertos' })
    .limit(200);
  if (error) {
    $('painel-erro').textContent = 'Não foi possível carregar os pedidos.';
    return;
  }
  const lista = $('lista');
  lista.replaceChildren(...pedidos.map(cartao));
  if (!pedidos.length) lista.innerHTML = '<p class="pagina__texto">Nenhum pedido aqui.</p>';
}

function cartao(p) {
  const el = $('tpl-pedido').content.firstElementChild.cloneNode(true);
  const campo = (nome, valor) => { el.querySelector(`[data-campo="${nome}"]`).textContent = valor; };
  campo('codigo', p.codigo);
  campo('quando', data(p.pago_em || p.criado_em));
  campo('status', STATUS[p.status]);
  el.querySelector('[data-campo="status"]').dataset.status = p.status;
  campo('itens', `${p.quantidade} × 200 g · ${brl(p.total_centavos)} (frete ${brl(p.frete_centavos)})`);
  campo('nome', p.nome);
  const tel = el.querySelector('[data-campo="telefone"]');
  tel.textContent = p.telefone.replace(/^(\d{2})(\d{4,5})(\d{4})$/, '($1) $2-$3');
  tel.href = `https://wa.me/55${p.telefone}`;
  campo('email', p.email);
  campo('endereco', `${p.logradouro}, ${p.numero}${p.complemento ? ` · ${p.complemento}` : ''} · ${p.bairro} · ${p.cidade}/${p.uf} · CEP ${p.cep} (${p.regiao})`);
  campo('observacoes', p.observacoes ? `Obs.: ${p.observacoes}` : '');

  const acoes = el.querySelector('.pedido__acoes');
  (ACOES[p.status] || []).forEach(([status, rotulo]) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn--dark';
    b.textContent = rotulo;
    b.addEventListener('click', () => mudarStatus(p.codigo, status, b));
    acoes.append(b);
  });
  return el;
}

async function mudarStatus(codigo, status, botao) {
  botao.disabled = true;
  const { data: { session } } = await sb.auth.getSession();
  const r = await fetch(`${window.LOJA.funcoes}/atualizar-status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token}` },
    body: JSON.stringify({ codigo, status }),
  });
  if (!r.ok) {
    const { erro } = await r.json().catch(() => ({}));
    $('painel-erro').textContent = erro || 'Não foi possível mudar o status.';
    botao.disabled = false;
    return;
  }
  carregar();
}

document.querySelectorAll('[data-filtro]').forEach((b) => {
  b.addEventListener('click', () => {
    filtro = b.dataset.filtro;
    document.querySelectorAll('[data-filtro]').forEach((x) => x.classList.toggle('is-ativo', x === b));
    carregar();
  });
});

$('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const { error } = await sb.auth.signInWithOtp({
    email: $('login-email').value.trim(),
    // Só entra quem já foi convidado no Supabase (e está na tabela admins).
    options: { shouldCreateUser: false, emailRedirectTo: location.origin + location.pathname },
  });
  $('login-msg').textContent = error
    ? 'Esse e-mail não tem acesso ao painel.'
    : 'Pronto! Abra o link que chegou no seu e-mail neste aparelho.';
});

$('sair').addEventListener('click', () => sb.auth.signOut());

sb.auth.onAuthStateChange((_evento, session) => {
  $('login').hidden = !!session;
  $('pedidos').hidden = !session;
  $('sair').hidden = !session;
  if (session) carregar();
});

// Atualiza sozinho a cada minuto, para pedidos novos aparecerem.
setInterval(() => { if (!$('pedidos').hidden && !document.hidden) carregar(); }, 60000);
