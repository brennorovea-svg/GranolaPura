import "./fonts";
import React from "react";
import { Composition } from "remotion";
import { DURACAO, Oferta, OfertaProps, ofertaSchema } from "./Oferta";
import { ALTURA, FPS, LARGURA } from "./theme";

// Textos padrão do modelo. Para um vídeo novo, troque pelo Studio ou passe um JSON em --props.
export const ofertaPadrao: OfertaProps = {
  gancho: "Granola que parece feita em casa.",
  ganchoDestaque: "Porque é.",
  fotoAbertura: "fotos/abertura.jpg",
  fotoPacote: "fotos/pacote.jpg",
  legendaPacote: "receita 01 · 200 g",
  fotos: [
    { src: "fotos/close.jpg", legenda: "mel, castanhas e frutas" },
    { src: "fotos/maos.jpg", legenda: "feita à mão" },
  ],
  preco: 17,
  centavos: "00",
  unidade: "o pacote de 200 g",
  entrega: "Entrega por motoboy em SP",
  ingredientes:
    "mel · óleo de coco · coco ralado · amêndoa · aveia · damasco · trigo · castanha-do-pará · flocos de milho · chia · cranberry · açúcar demerara ·",
  chamadaTopo: "Peça pelo",
  chamadaDestaque: "Link da bio",
  subchamada: "o WhatsApp abre com o pedido pronto",
  arroba: "@granola.pura",
};

export const RemotionRoot: React.FC = () => (
  <Composition
    id="Oferta"
    component={Oferta}
    schema={ofertaSchema}
    defaultProps={ofertaPadrao}
    durationInFrames={DURACAO}
    fps={FPS}
    width={LARGURA}
    height={ALTURA}
  />
);
