import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";
import { Kraft, Letreiro, Polaroid, Selo } from "./components";
import { cor, fonte } from "./theme";

export const ofertaSchema = z.object({
  gancho: z.string().describe("Frase de abertura, em letras grandes"),
  ganchoDestaque: z.string().describe("Complemento em itálico, logo abaixo do gancho"),
  fotoAbertura: z.string().describe("Foto de fundo da abertura (caminho em public/)"),
  fotoPacote: z.string(),
  legendaPacote: z.string(),
  fotos: z
    .array(z.object({ src: z.string(), legenda: z.string() }))
    .length(2)
    .describe("Duas fotos que entram ao lado do pacote"),
  preco: z.number().int().min(1),
  centavos: z.string().length(2),
  unidade: z.string(),
  entrega: z.string(),
  ingredientes: z.string(),
  chamadaTopo: z.string(),
  chamadaDestaque: z.string(),
  subchamada: z.string(),
  arroba: z.string(),
});

export type OfertaProps = z.infer<typeof ofertaSchema>;

// Duração de cada cena, em quadros (30 por segundo). As cenas se sobrepõem por SOBRA quadros na transição.
const SOBRA = 10;
export const CENAS = { gancho: 84, produto: 190, preco: 130, chamada: 76 };
export const DURACAO = CENAS.gancho + CENAS.produto + CENAS.preco + CENAS.chamada - 3 * SOBRA;

const curva = Easing.bezier(0.7, 0, 0.2, 1);

const progresso = (frame: number, inicio: number, fim: number) =>
  interpolate(frame, [inicio, fim], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: curva });

// Cada cena entra cobrindo a anterior de baixo para cima
const Entrada: React.FC<{ children: React.ReactNode; primeira?: boolean }> = ({ children, primeira }) => {
  const frame = useCurrentFrame();
  const p = primeira ? 1 : progresso(frame, 0, SOBRA + 2);
  return <AbsoluteFill style={{ clipPath: `inset(${(1 - p) * 100}% 0 0 0)` }}>{children}</AbsoluteFill>;
};

// Texto que entra palavra por palavra
const Palavras: React.FC<{ texto: string; atraso?: number; estilo: React.CSSProperties }> = ({
  texto,
  atraso = 0,
  estilo,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", columnGap: "0.22em", ...estilo }}>
      {texto.split(/\s+/).map((palavra, i) => {
        const s = spring({ frame: frame - atraso - i * 4, fps, config: { damping: 14, stiffness: 160 } });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: s,
              transform: `translateY(${(1 - s) * 70}px) rotate(${(1 - s) * -4}deg)`,
            }}
          >
            {palavra}
          </span>
        );
      })}
    </div>
  );
};

const tamanhoPorTamanho = (texto: string, maior: number, menor: number) => {
  const n = texto.length;
  return Math.round(interpolate(n, [14, 44], [maior, menor], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
};

const CenaGancho: React.FC<OfertaProps> = ({ gancho, ganchoDestaque, fotoAbertura }) => {
  const frame = useCurrentFrame();
  const zoom = interpolate(frame, [0, CENAS.gancho], [1.18, 1.04]);
  const destaque = progresso(frame, 26, 44);
  return (
    <AbsoluteFill style={{ background: cor.tinta }}>
      <Img
        src={staticFile(fotoAbertura)}
        style={{ width: "100%", height: "100%", objectFit: "cover", transform: `scale(${zoom})` }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, rgba(28,24,20,.25) 0%, rgba(28,24,20,0) 28%, rgba(28,24,20,.7) 62%, rgba(28,24,20,.92) 100%)",
        }}
      />
      <div style={{ position: "absolute", left: 72, right: 72, bottom: 430 }}>
        <Palavras
          texto={gancho}
          atraso={4}
          estilo={{
            fontFamily: fonte.display,
            fontSize: tamanhoPorTamanho(gancho, 170, 104),
            lineHeight: 0.98,
            color: cor.creme,
            textTransform: "uppercase",
          }}
        />
        <div
          style={{
            marginTop: 18,
            fontFamily: fonte.serif,
            fontStyle: "italic",
            fontSize: 132,
            lineHeight: 1,
            color: cor.mel,
            clipPath: `inset(0 ${(1 - destaque) * 100}% 0 0)`,
          }}
        >
          {ganchoDestaque}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CenaProduto: React.FC<OfertaProps> = ({ fotoPacote, legendaPacote, fotos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const pura = progresso(frame, 6, 40);
  const kicker = progresso(frame, 14, 34);
  const pacote = spring({ frame: frame - 18, fps, config: { damping: 15, stiffness: 90 } });
  const direita = spring({ frame: frame - 62, fps, config: { damping: 14, stiffness: 110 } });
  const esquerda = spring({ frame: frame - 96, fps, config: { damping: 14, stiffness: 110 } });
  const selo = spring({ frame: frame - 40, fps, config: { damping: 10, stiffness: 120 } });
  const flutua = (fase: number, amp: number) => Math.sin((frame + fase) / 22) * amp;

  return (
    <AbsoluteFill>
      <Kraft />
      <Letreiro
        texto="GRANOLA PURA ✦ FEITA À MÃO EM SÃO PAULO ✦ RECEITA 01 ✦"
        top={250}
        estilo={{
          background: cor.tinta,
          color: cor.mel,
          fontFamily: fonte.display,
          fontSize: 40,
          letterSpacing: "0.08em",
          padding: "18px 0",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 352,
          left: 72,
          right: 72,
          fontFamily: fonte.serif,
          fontStyle: "italic",
          fontSize: 58,
          lineHeight: 1.05,
          color: cor.tinta,
          clipPath: `inset(0 ${(1 - kicker) * 100}% 0 0)`,
        }}
      >
        granola artesanal, assada em pequenos lotes
      </div>
      <div
        style={{
          position: "absolute",
          top: 480,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: fonte.display,
          fontSize: 470,
          lineHeight: 0.86,
          color: cor.tinta,
          clipPath: `inset(0 ${(1 - pura) * 100}% 0 0)`,
        }}
      >
        PURA
      </div>

      <Selo
        tamanho={240}
        style={{ position: "absolute", top: 770, right: 50, scale: String(selo), zIndex: 3 }}
      />

      <div
        style={{
          position: "absolute",
          top: 850,
          left: 270,
          transform: `translateY(${(1 - pacote) * 1100}px) rotate(${-5 + flutua(0, 1.5)}deg)`,
          zIndex: 2,
        }}
      >
        <Polaroid src={fotoPacote} legenda={legendaPacote} largura={540} proporcao={882 / 899} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1360,
          right: 24,
          transform: `translateX(${(1 - direita) * 700}px) translateY(${flutua(30, 10)}px) rotate(7deg)`,
          zIndex: 3,
        }}
      >
        <Polaroid src={fotos[0].src} legenda={fotos[0].legenda} largura={340} proporcao={1} />
      </div>

      <div
        style={{
          position: "absolute",
          top: 1290,
          left: 24,
          transform: `translateX(${(1 - esquerda) * -700}px) translateY(${flutua(60, 12)}px) rotate(-8deg)`,
          zIndex: 3,
        }}
      >
        <Polaroid src={fotos[1].src} legenda={fotos[1].legenda} largura={300} proporcao={4 / 5} />
      </div>
    </AbsoluteFill>
  );
};

const CenaPreco: React.FC<OfertaProps> = ({ preco, centavos, unidade, entrega, ingredientes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const valor = Math.round(
    interpolate(frame, [8, 34], [0, preco], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: Easing.out(Easing.cubic),
    }),
  );
  const topo = progresso(frame, 6, 22);
  const linha = progresso(frame, 30, 48);
  const selo = spring({ frame: frame - 46, fps, config: { damping: 9, stiffness: 140 } });
  const pulso = 1 + Math.max(0, Math.sin((frame - 34) / 3)) * 0.04 * (frame > 34 && frame < 44 ? 1 : 0);

  return (
    <AbsoluteFill>
      <Kraft base={cor.creme} />
      <Letreiro
        texto={ingredientes}
        top={250}
        velocidade={3}
        reverso
        estilo={{
          borderTop: `3px solid ${cor.tinta}`,
          borderBottom: `3px solid ${cor.tinta}`,
          padding: "16px 0",
          fontFamily: fonte.serif,
          fontStyle: "italic",
          fontSize: 50,
          color: cor.tinta,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 520,
          width: "100%",
          textAlign: "center",
          fontFamily: fonte.serif,
          fontStyle: "italic",
          fontSize: 92,
          color: cor.tinta,
          opacity: topo,
          transform: `translateY(${(1 - topo) * 30}px)`,
        }}
      >
        por apenas
      </div>
      <div
        style={{
          position: "absolute",
          top: 640,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-start",
          fontFamily: fonte.display,
          color: cor.tinta,
          lineHeight: 0.9,
          transform: `scale(${pulso})`,
        }}
      >
        <span style={{ fontSize: 150, marginTop: 40, marginRight: 18 }}>R$</span>
        <span style={{ fontSize: 470 }}>{valor}</span>
        <span style={{ fontSize: 150, marginTop: 40 }}>,{centavos}</span>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1100,
          width: "100%",
          textAlign: "center",
          fontFamily: fonte.serif,
          fontStyle: "italic",
          fontSize: 88,
          color: cor.tinta,
          clipPath: `inset(0 ${(1 - linha) * 50}% 0 ${(1 - linha) * 50}%)`,
        }}
      >
        {unidade}
      </div>
      <div style={{ position: "absolute", top: 1280, width: "100%", display: "flex", justifyContent: "center" }}>
        <div
          style={{
            background: cor.cranberry,
            color: cor.creme,
            fontFamily: fonte.display,
            fontSize: 60,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            padding: "26px 48px",
            borderRadius: 999,
            transform: `rotate(-3deg) scale(${selo})`,
          }}
        >
          {entrega}
        </div>
      </div>
    </AbsoluteFill>
  );
};

const CenaChamada: React.FC<OfertaProps> = ({ chamadaTopo, chamadaDestaque, subchamada, arroba }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const destaque = spring({ frame: frame - 12, fps, config: { damping: 11, stiffness: 120 } });
  const pulso = 1 + Math.sin(frame / 5) * 0.025 * Math.min(1, Math.max(0, (frame - 26) / 6));
  const sub = progresso(frame, 26, 42);
  const marca = progresso(frame, 34, 50);
  const tamanhoDestaque = Math.min(320, Math.round(940 / (chamadaDestaque.length * 0.46)));

  return (
    <AbsoluteFill style={{ background: cor.tinta }}>
      <div style={{ position: "absolute", top: 520, left: 60, right: 60, textAlign: "center" }}>
        <Palavras
          texto={chamadaTopo}
          atraso={2}
          estilo={{
            justifyContent: "center",
            fontFamily: fonte.display,
            fontSize: 120,
            lineHeight: 1,
            color: cor.creme,
            textTransform: "uppercase",
          }}
        />
        <div
          style={{
            marginTop: 10,
            fontFamily: fonte.display,
            fontSize: tamanhoDestaque,
            lineHeight: 0.95,
            color: cor.mel,
            textTransform: "uppercase",
            transform: `scale(${destaque * pulso}) rotate(${(1 - destaque) * -6}deg)`,
          }}
        >
          {chamadaDestaque}
        </div>
        <div
          style={{
            marginTop: 30,
            fontFamily: fonte.serif,
            fontStyle: "italic",
            fontSize: 68,
            lineHeight: 1.1,
            color: cor.creme,
            opacity: sub,
            transform: `translateY(${(1 - sub) * 24}px)`,
          }}
        >
          {subchamada}
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          top: 1200,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 10,
          opacity: marca,
        }}
      >
        <Img src={staticFile("logo.png")} style={{ width: 300, filter: "invert(1) sepia(0.25) brightness(0.97)" }} />
        <div style={{ fontFamily: fonte.sans, fontWeight: 700, fontSize: 46, color: cor.mel }}>{arroba}</div>
      </div>
    </AbsoluteFill>
  );
};

export const Oferta: React.FC<OfertaProps> = (props) => {
  const inicioProduto = CENAS.gancho - SOBRA;
  const inicioPreco = inicioProduto + CENAS.produto - SOBRA;
  const inicioChamada = inicioPreco + CENAS.preco - SOBRA;
  return (
    <AbsoluteFill style={{ background: cor.tinta }}>
      <Sequence durationInFrames={CENAS.gancho} name="Gancho">
        <Entrada primeira>
          <CenaGancho {...props} />
        </Entrada>
      </Sequence>
      <Sequence from={inicioProduto} durationInFrames={CENAS.produto} name="Produto">
        <Entrada>
          <CenaProduto {...props} />
        </Entrada>
      </Sequence>
      <Sequence from={inicioPreco} durationInFrames={CENAS.preco} name="Preço">
        <Entrada>
          <CenaPreco {...props} />
        </Entrada>
      </Sequence>
      <Sequence from={inicioChamada} durationInFrames={CENAS.chamada} name="Chamada">
        <Entrada>
          <CenaChamada {...props} />
        </Entrada>
      </Sequence>
    </AbsoluteFill>
  );
};
