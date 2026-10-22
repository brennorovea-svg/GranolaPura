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

// Entradas no scroll: camadas do pacote e blocos com .reveal
const alvos = document.querySelectorAll('[data-layers], .reveal');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entradas) => {
    entradas.forEach((entrada) => {
      if (entrada.isIntersecting) {
        entrada.target.classList.add('is-visible');
        observer.unobserve(entrada.target);
      }
    });
  }, { threshold: 0.3 });
  alvos.forEach((el) => observer.observe(el));
} else {
  alvos.forEach((el) => el.classList.add('is-visible'));
}

document.getElementById('ano').textContent = new Date().getFullYear();
