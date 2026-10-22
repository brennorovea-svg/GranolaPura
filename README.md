# Granola Pura

Site da Granola Pura, granola artesanal de São Paulo. Página única, estática, publicada no GitHub Pages.

## Estrutura

- `index.html`: a página.
- `css/style.css`: estilos e animações (paleta kraft, fontes Anton, Instrument Serif e DM Sans).
- `js/main.js`: pedido pelo WhatsApp (quantidade, CEP e nome viram uma mensagem pronta) e animações de entrada no scroll.
- `img/`: fotos em WebP, logo e imagem de compartilhamento.

## Como alterar o essencial

- **Preço e número do WhatsApp:** constantes `PRECO` e `WHATSAPP` no topo de `js/main.js`. O preço também aparece em texto no `index.html`.
- **Fotos:** troque os arquivos em `img/` mantendo os nomes.

## Rodar localmente

```bash
python3 -m http.server 8000
```

Depois abra http://localhost:8000.

## Publicação

Settings › Pages › Build and deployment: "Deploy from a branch", branch `main`, pasta `/ (root)`.
