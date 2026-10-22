# Vídeos da Granola Pura

Modelos de Reels (1080x1920, 30 fps) feitos com [Remotion](https://www.remotion.dev), na identidade do site: kraft, Anton, Instrument Serif e DM Sans.

## Modelo "Oferta" (15 s)

1. **Gancho** (0 a 2,8 s): foto de fundo com zoom lento e a frase entrando palavra por palavra.
2. **Produto** (2,8 a 9 s): "PURA" gigante, letreiro, selo girando e as polaroids do pacote e de duas fotos.
3. **Preço** (9 a 13 s): o preço contando até o valor, a unidade e o selo de entrega.
4. **Chamada** (13 a 15 s): a chamada para pedir, a logo e o @.

O vídeo sai sem música de propósito: no Instagram, escolha um áudio em alta na hora de postar, que ajuda no alcance.

## Gerar um vídeo novo sem instalar nada

No GitHub: **Actions › Vídeo Oferta › Run workflow**. Preencha só o que quiser trocar (gancho, preço, chamada…), espere uns 3 minutos e baixe o MP4 em "Artifacts", no fim da página da execução.

## Editar no computador

```bash
cd videos
npm install
npm run studio   # abre o editor no navegador, com todos os textos editáveis no painel da direita
npm run render   # gera out/oferta.mp4 com os textos padrão
```

Para renderizar com outros textos: `npx remotion render Oferta out/oferta.mp4 --props=meus-textos.json`, em que o JSON tem só os campos que mudam (veja os nomes em `src/Root.tsx`).

## Trocar fotos

Coloque a foto em `public/fotos/` (JPG de até 1600 px no lado maior) e aponte o campo `fotoAbertura`, `fotoPacote` ou `fotos` para ela. Evite fotos com o pote antigo: o produto hoje é só o pacote kraft de 200 g.
