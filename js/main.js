// Granola Pura: checkout (frete, dados de entrega e pagamento) e animações de entrada.

const PRECO = 1700; // centavos; o valor que vale é o das funções da loja
const QTD_MAX = 20;
const FUNCOES = window.LOJA.funcoes;

const state = { qtd: 1, frete: null };

const $ = (id) => document.getElementById(id);
const form = $('order-form');
const cepEl = $('cep');
const freteEl = $('frete');
const entregaEl = $('entrega');
const erroEl = $('form-erro');
const pagarEl = $('pagar');

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const brl = (centavos) => (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function atualizar() {
  const produtos = PRECO * state.qtd;
  $('qtd').textContent = state.qtd;
  $('subtotal').textContent = brl(produtos);
  $('resumo-produtos').textContent = brl(produtos);
  $('resumo-frete').textContent = state.frete ? brl(state.frete.frete_centavos) : '–';
  $('resumo-total').textContent = state.frete ? brl(produtos + state.frete.frete_centavos) : '–';
}

document.querySelectorAll('[data-qty]').forEach((botao) => {
  botao.addEventListener('click', () => {
    state.qtd = Math.min(QTD_MAX, Math.max(1, state.qtd + Number(botao.dataset.qty)));
    atualizar();
  });
});

cepEl.addEventListener('input', () => {
  const d = cepEl.value.replace(/\D/g, '').slice(0, 8);
  cepEl.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  // CEP mudou: o frete calculado antes não vale mais.
  if (state.frete && state.frete.endereco.cep !== cepEl.value) {
    state.frete = null;
    entregaEl.hidden = true;
    freteEl.textContent = '';
    atualizar();
  }
  if (d.length === 8 && !state.frete) calcularFrete();
});

async function chamar(funcao, opcoes) {
  const r = await fetch(`${FUNCOES}/${funcao}`, opcoes);
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(dados.erro || 'Algo deu errado. Tente de novo.');
  return dados;
}

async function calcularFrete() {
  const cep = cepEl.value.replace(/\D/g, '');
  erroEl.textContent = '';
  if (cep.length !== 8) {
    freteEl.textContent = 'Digite os 8 números do CEP.';
    return;
  }
  freteEl.textContent = 'Calculando…';
  try {
    const f = await chamar(`cotar-frete?cep=${cep}`);
    if (!f.atende) {
      state.frete = null;
      entregaEl.hidden = true;
      freteEl.innerHTML = `Ainda não entregamos em ${esc([f.endereco.bairro, f.endereco.cidade].filter(Boolean).join(", "))}. ` +
        '<a href="https://wa.me/5511948177429" target="_blank" rel="noopener">Chama a gente no WhatsApp</a>.';
    } else {
      state.frete = f;
      freteEl.innerHTML = `<strong>${brl(f.frete_centavos)}</strong> · entrega ${esc(f.prazo)} (${esc(f.regiao)})`;
      $('logradouro').value = f.endereco.logradouro || $('logradouro').value;
      $('bairro').value = f.endereco.bairro || $('bairro').value;
      entregaEl.hidden = false;
      (f.endereco.logradouro ? $('numero') : $('logradouro')).focus();
    }
  } catch (e) {
    freteEl.textContent = e.message;
  }
  atualizar();
}

$('calcular-frete').addEventListener('click', calcularFrete);
cepEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); calcularFrete(); }
});

$('telefone').addEventListener('input', (e) => {
  const d = e.target.value.replace(/\D/g, '').slice(0, 11);
  e.target.value = d.length > 6 ? `(${d.slice(0, 2)}) ${d.slice(2, d.length - 4)}-${d.slice(-4)}`
    : d.length > 2 ? `(${d.slice(0, 2)}) ${d.slice(2)}` : d;
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  erroEl.textContent = '';
  if (!state.frete) { calcularFrete(); return; }
  if (!form.reportValidity()) return;

  const campos = ['logradouro', 'numero', 'complemento', 'bairro', 'nome', 'email', 'telefone', 'observacoes'];
  const corpo = { quantidade: state.qtd, cep: state.frete.endereco.cep };
  campos.forEach((c) => { corpo[c] = $(c).value.trim(); });

  pagarEl.disabled = true;
  pagarEl.textContent = 'Abrindo o pagamento…';
  try {
    const { pagamento_url } = await chamar('criar-pedido', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo),
    });
    window.location.href = pagamento_url;
  } catch (err) {
    erroEl.textContent = err.message;
    pagarEl.disabled = false;
    pagarEl.textContent = 'Ir para o pagamento';
  }
});

// Voltar do Mercado Pago pelo botão do navegador reabre a página como estava.
window.addEventListener('pageshow', () => {
  pagarEl.disabled = false;
  pagarEl.textContent = 'Ir para o pagamento';
});

atualizar();

// Camadas do pacote: montam de baixo para cima, ficam um tempo e saem de cima
// para baixo, em loop enquanto a seção estiver na tela.
const MONTA_E_SEGURA = 5000;  // 12 camadas caindo (~3,1 s) + pausa montado
const DESMONTA = 3000;        // 12 camadas sumindo (~2,6 s) + pausa vazio

function cicloDeCamadas(el) {
  let timer = null;
  const montar = () => {
    el.classList.add('is-built');
    timer = setTimeout(desmontar, MONTA_E_SEGURA);
  };
  const desmontar = () => {
    el.classList.remove('is-built');
    timer = setTimeout(montar, DESMONTA);
  };
  return {
    iniciar() { if (!timer) montar(); },
    parar() { clearTimeout(timer); timer = null; el.classList.remove('is-built'); },
  };
}

const camadas = document.querySelector('[data-layers]');
const ciclo = camadas ? cicloDeCamadas(camadas) : null;

// Entradas no scroll: blocos com .reveal aparecem uma vez; as camadas
// recomeçam do zero sempre que a seção volta à tela.
const alvos = document.querySelectorAll('[data-layers], .reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      const ehCamadas = entrada.target === camadas;
      if (entrada.isIntersecting) {
        if (ehCamadas) ciclo.iniciar();
        else {
          entrada.target.classList.add('is-visible');
          observer.unobserve(entrada.target);
        }
      } else if (ehCamadas) {
        ciclo.parar();
      }
    });
  }, { threshold: 0.3 });
  alvos.forEach((el) => observer.observe(el));
} else {
  alvos.forEach((el) => el.classList.add('is-visible'));
  if (ciclo) ciclo.iniciar();
}

document.getElementById('ano').textContent = new Date().getFullYear();

// Tag da Neon Scripts: a placa liga uma vez quando aparece e depois, a cada
// 2,6 a 6 s, pisca uma letra ou a placa toda, e às vezes rosa e azul trocam.
// Só roda com a placa na tela e a aba visível.
const neonTag = document.querySelector('.neon-tag');
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (neonTag && !semMovimento && 'IntersectionObserver' in window) {
  const palavras = neonTag.querySelectorAll('.neon-tag__word');
  const letras = neonTag.querySelectorAll('.neon-tag__word span');
  let timer = null;

  const piscar = (el) => {
    el.classList.remove('is-blink');
    void el.offsetWidth;
    el.classList.add('is-blink');
  };

  const tick = () => {
    if (!document.hidden) {
      const r = Math.random();
      if (r < 0.45) piscar(letras[Math.floor(Math.random() * letras.length)]);
      else if (r < 0.7) palavras.forEach(piscar);
      else { palavras.forEach(piscar); neonTag.classList.toggle('is-azul'); }
    }
    timer = setTimeout(tick, 2600 + Math.random() * 3400);
  };

  neonTag.classList.add('is-off');
  const observerNeon = new IntersectionObserver(([entrada]) => {
    if (entrada.isIntersecting) {
      if (neonTag.classList.contains('is-off')) {
        neonTag.classList.replace('is-off', 'is-on');
        timer = setTimeout(tick, 2400);
      } else if (!timer) {
        timer = setTimeout(tick, 2600);
      }
    } else {
      clearTimeout(timer);
      timer = null;
    }
  }, { threshold: 0.5 });
  observerNeon.observe(neonTag);
  window.addEventListener('pagehide', () => { clearTimeout(timer); observerNeon.disconnect(); });
}
