import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { cor, fonte } from "./theme";

// Fundo de papel kraft: cor chapada + granulado leve
export const Kraft: React.FC<{ base?: string }> = ({ base = cor.kraft }) => (
  <AbsoluteFill style={{ background: base }}>
    <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.22, mixBlendMode: "multiply" }}>
      <filter id="grao">
        <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
        <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0 0.15  0 0 0 0.55 0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grao)" />
    </svg>
  </AbsoluteFill>
);

// Letreiro correndo. Repete o texto o bastante para cobrir o vídeo inteiro sem emenda.
export const Letreiro: React.FC<{
  texto: string;
  top: number;
  velocidade?: number;
  reverso?: boolean;
  estilo?: React.CSSProperties;
}> = ({ texto, top, velocidade = 4, reverso = false, estilo }) => {
  const frame = useCurrentFrame();
  const desloc = frame * velocidade;
  return (
    <div
      style={{
        position: "absolute",
        top,
        left: 0,
        right: 0,
        overflow: "hidden",
        whiteSpace: "nowrap",
        ...estilo,
      }}
    >
      <div
        style={{
          display: "inline-block",
          transform: `translateX(${reverso ? -3000 + desloc : -desloc}px)`,
        }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <span key={i} style={{ paddingRight: 56 }}>
            {texto}
          </span>
        ))}
      </div>
    </div>
  );
};

export const Polaroid: React.FC<{
  src: string;
  legenda?: string;
  largura: number;
  proporcao?: number;
  style?: React.CSSProperties;
}> = ({ src, legenda, largura, proporcao = 1, style }) => (
  <figure
    style={{
      margin: 0,
      width: largura,
      background: cor.branco,
      padding: `${largura * 0.035}px ${largura * 0.035}px ${legenda ? largura * 0.15 : largura * 0.1}px`,
      boxShadow: "0 40px 80px rgba(28, 24, 20, .35)",
      ...style,
    }}
  >
    <Img
      src={src.startsWith("http") ? src : staticFile(src)}
      style={{ width: "100%", aspectRatio: String(proporcao), objectFit: "cover", display: "block" }}
    />
    {legenda ? (
      <figcaption
        style={{
          marginTop: largura * 0.03,
          fontFamily: fonte.serif,
          fontStyle: "italic",
          fontSize: largura * 0.075,
          color: cor.tinta,
          lineHeight: 1,
        }}
      >
        {legenda}
      </figcaption>
    ) : null}
  </figure>
);

// Selo girando, igual ao do site
export const Selo: React.FC<{ tamanho: number; style?: React.CSSProperties }> = ({ tamanho, style }) => {
  const frame = useCurrentFrame();
  return (
    <svg
      viewBox="0 0 200 200"
      width={tamanho}
      height={tamanho}
      style={{ transform: `rotate(${frame * 1.6}deg)`, ...style }}
    >
      <defs>
        <path id="circ" d="M100,100 m-72,0 a72,72 0 1,1 144,0 a72,72 0 1,1 -144,0" />
      </defs>
      <circle cx="100" cy="100" r="96" fill={cor.mel} stroke={cor.tinta} strokeWidth="3" />
      <text fontFamily="Anton, sans-serif" fontSize="21" letterSpacing="4" fill={cor.tinta}>
        <textPath href="#circ">PRODUÇÃO MANUAL · 100% NATURAL · </textPath>
      </text>
      <path
        d="M100 122c-14-10-24-18-24-29a12 12 0 0 1 24-3 12 12 0 0 1 24 3c0 11-10 19-24 29z"
        fill={cor.cranberry}
      />
    </svg>
  );
};
