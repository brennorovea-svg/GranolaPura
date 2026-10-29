// Granola Pura: pedido pelo WhatsApp e animações de entrada.

const WHATSAPP = '5511948177429';
const PRECO = 17;

const state = { qtd: 1 };

const qtdEl = document.getElementById('qtd');
const totalEl = document.getElementById('total');
const cepEl = document.getElementById('cep');
const nomeEl = document.getElementById('nome');
const waLink = document.getElementById('wa-link');

const brl = (valor) => valor.toFixed(2).replace('.', ',');

function mensagem() {
  const qtd = state.qtd;
  return [
    'Olá! Quero pedir Granola Pura pelo site.',
    `Quantidade: ${qtd} ${qtd > 1 ? 'pacotes' : 'pacote'} de 200 g`,
    `Total dos produtos: R$ ${brl(PRECO * qtd)}`,
    `CEP: ${cepEl.value || '(vou informar)'}`,
    `Nome: ${nomeEl.value.trim() || '(vou informar)'}`,
  ].join('\n');
}

function atualizar() {
  qtdEl.textContent = state.qtd;
  totalEl.textContent = `R$ ${brl(PRECO * state.qtd)}`;
  waLink.href = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(mensagem())}`;
}

document.querySelectorAll('[data-qty]').forEach((botao) => {
  botao.addEventListener('click', () => {
    state.qtd = Math.min(50, Math.max(1, state.qtd + Number(botao.dataset.qty)));
    atualizar();
  });
});

cepEl.addEventListener('input', () => {
  const d = cepEl.value.replace(/\D/g, '').slice(0, 8);
  cepEl.value = d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
  atualizar();
});

nomeEl.addEventListener('input', atualizar);

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

// Tag da Neon Scripts (logo v3): a placa liga uma vez quando aparece e depois, a cada
// 2,6 a 6 s, pisca uma letra, o olho ou a placa toda, e às vezes rosa e azul trocam.
// Só roda com a placa na tela e a aba visível.
const neonTag = document.querySelector('.neon-tag');
const semMovimento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

if (neonTag && !semMovimento && 'IntersectionObserver' in window) {
  const palavras = neonTag.querySelectorAll('.neon-tag__word');
  const letras = neonTag.querySelectorAll('.neon-tag__word > span:not(.o-olho)');
  const olho = neonTag.querySelector('.o-olho');
  let timer = null;

  const piscar = (el) => {
    el.classList.remove('is-blink');
    void el.offsetWidth;
    el.classList.add('is-blink');
  };

  const tick = () => {
    if (!document.hidden) {
      const r = Math.random();
      if (r < 0.3) piscar(letras[Math.floor(Math.random() * letras.length)]);
      else if (r < 0.5) { olho.classList.add('fecha'); setTimeout(() => olho.classList.remove('fecha'), 150); }
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
